// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/// <reference types="node" />

import { spawn, type ChildProcess } from 'node:child_process';
import type { Dirent, Stats } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import {
    AttachedEnvironmentPlatform,
    type AttachEnvironmentParams,
    type AttachedEnvironmentDoneResult,
    type AttachedEnvironmentEntry,
    type AttachedEnvironmentExec,
    type AttachedEnvironmentExecResult,
    type AttachedEnvironmentList,
    type AttachedEnvironmentListResult,
    type AttachedEnvironmentRead,
    type AttachedEnvironmentReadResult,
    type AttachedEnvironmentRemove,
    type AttachedEnvironmentStat,
    type AttachedEnvironmentStatResult,
    type AttachedEnvironmentWrite,
} from 'nexa-protocol/environments/AttachedEnvironmentTypes.js';
import { AttachedEnvironmentFailure } from './AttachedEnvironmentFailure.js';
import type {
    AttachedEnvironmentHandlers,
    AttachedEnvironmentRequestContext,
} from './AttachedEnvironmentHost.js';

export { AttachedEnvironmentFailure } from './AttachedEnvironmentFailure.js';

/** How a local directory is served. */
export interface NodeDirectoryEnvironmentOptions {
    /** Absolute directory that commands start in and file operations are confined to. */
    readonly root: string;
    /** Variables added to every command's environment, over this process's own. */
    readonly env?: Readonly<Record<string, string>>;
    /** Output kept per stream in bytes; the start is dropped first. Default 8 MiB. */
    readonly maximumOutputBytes?: number;
    /** Allow file operations outside `root`. Default false. */
    readonly unconfined?: boolean;
    /** Delay between the polite and the forced stop of a timed-out or cancelled command. Default 2000 ms. */
    readonly killGraceMs?: number;
}

/** The end of one output stream, bounded in bytes. */
class OutputTail {
    readonly #chunks: Buffer[] = [];
    readonly #limit: number;
    #bytes: number = 0;
    #dropped: number = 0;

    public constructor(limit: number) {
        this.#limit = limit;
    }

    public push(chunk: Buffer): void {
        this.#chunks.push(chunk);
        this.#bytes += chunk.byteLength;
        while (this.#bytes > this.#limit && this.#chunks.length > 0) {
            const first: Buffer | undefined = this.#chunks[0];
            if (first === undefined) {
                break;
            }
            const excess: number = this.#bytes - this.#limit;
            if (first.byteLength <= excess) {
                this.#chunks.shift();
                this.#bytes -= first.byteLength;
                this.#dropped += first.byteLength;
            } else {
                this.#chunks[0] = first.subarray(excess);
                this.#bytes -= excess;
                this.#dropped += excess;
            }
        }
    }

    public text(): string {
        const body: string = Buffer.concat(this.#chunks, this.#bytes).toString('utf8');
        return this.#dropped === 0
            ? body
            : `[${String(this.#dropped)} earlier bytes omitted]\n${body}`;
    }
}

/**
 * Serves a local directory as an attached environment with Node's `child_process` and `fs`.
 *
 * @remarks
 * Commands run in their own process group on POSIX so a timeout or cancellation stops everything
 * they started. A command line without `argv` runs in `/bin/sh -c` (or `cmd.exe /d /s /c` on
 * Windows). File operations are confined to the root by path; links inside it are followed, since
 * the directory's owner decides what it contains. Use it for examples, CI sandboxes and
 * benchmark runners; anything that must run elsewhere, such as inside a container, can implement
 * {@link AttachedEnvironmentHandlers} the same way.
 *
 * @example
 * ```ts
 * const local: NodeDirectoryEnvironment = new NodeDirectoryEnvironment({ root: process.cwd() });
 * const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(client, local.definition('My laptop'), local);
 * ```
 */
export class NodeDirectoryEnvironment implements AttachedEnvironmentHandlers {
    /** The directory being served, resolved. */
    public readonly root: string;
    readonly #env: Readonly<Record<string, string>>;
    readonly #maximumOutputBytes: number;
    readonly #unconfined: boolean;
    readonly #killGraceMs: number;

    /** Serves `options.root`. */
    public constructor(options: NodeDirectoryEnvironmentOptions) {
        if (!isAbsolute(options.root)) {
            throw new TypeError('NodeDirectoryEnvironment needs an absolute root');
        }
        this.root = resolve(options.root);
        this.#env = options.env ?? {};
        this.#maximumOutputBytes = options.maximumOutputBytes ?? 8 * 1024 * 1024;
        this.#unconfined = options.unconfined === true;
        this.#killGraceMs = options.killGraceMs ?? 2000;
    }

    /** This machine's platform as an attached environment reports it. */
    public static platform(): AttachedEnvironmentPlatform {
        return process.platform === 'win32'
            ? AttachedEnvironmentPlatform.Windows
            : process.platform === 'darwin'
              ? AttachedEnvironmentPlatform.Macos
              : AttachedEnvironmentPlatform.Linux;
    }

    /** The parameters that attach this directory. */
    public definition(name: string, description?: string): AttachEnvironmentParams {
        return {
            name,
            platform: NodeDirectoryEnvironment.platform(),
            root: this.root,
            ...(description === undefined ? {} : { description }),
        };
    }

    /** Runs one command to completion, honouring its timeout and the request's cancellation. */
    public async exec(
        operation: AttachedEnvironmentExec,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentExecResult> {
        const cwd: string = this.#path(operation.cwd);
        context.signal.throwIfAborted();
        const windows: boolean = process.platform === 'win32';
        const child: ChildProcess =
            operation.argv === undefined
                ? windows
                    ? spawn(
                          process.env['ComSpec'] ?? 'cmd.exe',
                          ['/d', '/s', '/c', `"${operation.command}"`],
                          {
                              cwd,
                              env: { ...process.env, ...this.#env, ...operation.env },
                              windowsVerbatimArguments: true,
                              stdio: ['pipe', 'pipe', 'pipe'],
                          },
                      )
                    : spawn('/bin/sh', ['-c', operation.command], {
                          cwd,
                          env: { ...process.env, ...this.#env, ...operation.env },
                          detached: true,
                          stdio: ['pipe', 'pipe', 'pipe'],
                      })
                : spawn(operation.command, [...operation.argv], {
                      cwd,
                      env: { ...process.env, ...this.#env, ...operation.env },
                      detached: !windows,
                      stdio: ['pipe', 'pipe', 'pipe'],
                  });
        const stdout: OutputTail = new OutputTail(this.#maximumOutputBytes);
        const stderr: OutputTail = new OutputTail(this.#maximumOutputBytes);
        child.stdout?.on('data', (chunk: Buffer): void => stdout.push(chunk));
        child.stderr?.on('data', (chunk: Buffer): void => stderr.push(chunk));
        child.stdin?.on('error', (): void => {
            /* A command may close stdin before reading it; its exit status still decides. */
        });
        child.stdin?.end(operation.stdin ?? '');
        let timedOut: boolean = false;
        const stop = (): void => this.#stop(child);
        const timer: ReturnType<typeof setTimeout> | undefined =
            operation.timeoutMs === undefined
                ? undefined
                : setTimeout((): void => {
                      timedOut = true;
                      stop();
                  }, operation.timeoutMs);
        context.signal.addEventListener('abort', stop, { once: true });
        try {
            const [exitCode, signal]: [number | null, NodeJS.Signals | null] = await new Promise(
                (done, fail): void => {
                    child.once('error', (error: Error): void => {
                        fail(NodeDirectoryEnvironment.#failure(error));
                    });
                    child.once(
                        'close',
                        (code: number | null, closed: NodeJS.Signals | null): void => {
                            done([code, closed]);
                        },
                    );
                },
            );
            return {
                kind: 'exec',
                exitCode: timedOut ? null : exitCode,
                signal,
                timedOut,
                stdout: stdout.text(),
                stderr: stderr.text(),
            };
        } finally {
            clearTimeout(timer);
            context.signal.removeEventListener('abort', stop);
        }
    }

    /** Reads a whole file. */
    public async read(operation: AttachedEnvironmentRead): Promise<AttachedEnvironmentReadResult> {
        const bytes: Buffer = await NodeDirectoryEnvironment.#io(
            readFile(this.#path(operation.path)),
        );
        return { kind: 'read', data: bytes.toString('base64') };
    }

    /** Writes a whole file, creating parents when asked. */
    public async write(
        operation: AttachedEnvironmentWrite,
    ): Promise<AttachedEnvironmentDoneResult> {
        const path: string = this.#path(operation.path);
        if (operation.parents === true) {
            await NodeDirectoryEnvironment.#io(mkdir(dirname(path), { recursive: true }));
        }
        await NodeDirectoryEnvironment.#io(
            writeFile(
                path,
                Buffer.from(operation.data, 'base64'),
                operation.mode === undefined ? undefined : { mode: operation.mode },
            ),
        );
        return { kind: 'done' };
    }

    /** Lists a directory. */
    public async list(operation: AttachedEnvironmentList): Promise<AttachedEnvironmentListResult> {
        const entries: Dirent[] = await NodeDirectoryEnvironment.#io(
            readdir(this.#path(operation.path), { withFileTypes: true }),
        );
        return {
            kind: 'list',
            entries: entries.map((entry: Dirent): AttachedEnvironmentEntry => ({
                name: entry.name,
                type: entry.isDirectory()
                    ? 'directory'
                    : entry.isSymbolicLink()
                      ? 'symlink'
                      : entry.isFile()
                        ? 'file'
                        : 'other',
            })),
        };
    }

    /** Describes one path, following links. */
    public async stat(operation: AttachedEnvironmentStat): Promise<AttachedEnvironmentStatResult> {
        const info: Stats = await NodeDirectoryEnvironment.#io(stat(this.#path(operation.path)));
        return {
            kind: 'stat',
            type: info.isDirectory() ? 'directory' : info.isFile() ? 'file' : 'other',
            size: info.size,
            modifiedAt: Math.trunc(info.mtimeMs),
            mode: info.mode & 0xffff,
        };
    }

    /** Removes a file, or a directory with `recursive`. */
    public async remove(
        operation: AttachedEnvironmentRemove,
    ): Promise<AttachedEnvironmentDoneResult> {
        await NodeDirectoryEnvironment.#io(
            rm(this.#path(operation.path), { recursive: operation.recursive, force: false }),
        );
        return { kind: 'done' };
    }

    /** Resolves a requested path, refusing one outside the root unless unconfined. */
    #path(path: string): string {
        const resolved: string = resolve(path);
        if (
            !this.#unconfined &&
            resolved !== this.root &&
            !resolved.startsWith(this.root.endsWith(sep) ? this.root : this.root + sep)
        ) {
            throw new AttachedEnvironmentFailure(
                'denied',
                `${path} is outside the served directory`,
            );
        }
        return resolved;
    }

    /** Stops a command and everything it started, forcefully after the grace period. */
    #stop(child: ChildProcess): void {
        const pid: number | undefined = child.pid;
        if (pid === undefined || child.exitCode !== null || child.signalCode !== null) {
            return;
        }
        const signal = (name: NodeJS.Signals): void => {
            try {
                if (process.platform === 'win32') {
                    child.kill(name);
                } else {
                    process.kill(-pid, name);
                }
            } catch {
                /* The process already exited, which is what stopping it is for. */
            }
        };
        signal('SIGTERM');
        const force: ReturnType<typeof setTimeout> = setTimeout((): void => {
            signal('SIGKILL');
        }, this.#killGraceMs);
        force.unref();
        child.once('close', (): void => clearTimeout(force));
    }

    /** Maps a filesystem failure onto the error codes Nexa understands. */
    static async #io<T>(work: Promise<T>): Promise<T> {
        try {
            return await work;
        } catch (error: unknown) {
            throw NodeDirectoryEnvironment.#failure(error);
        }
    }

    static #failure(error: unknown): AttachedEnvironmentFailure {
        const code: unknown =
            typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        const message: string = error instanceof Error ? error.message : String(error);
        return new AttachedEnvironmentFailure(
            code === 'ENOENT' || code === 'ENOTDIR'
                ? 'not-found'
                : code === 'EACCES' || code === 'EPERM'
                  ? 'denied'
                  : 'failed',
            message,
        );
    }
}
