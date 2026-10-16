// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignHarfBuzzBytes } from './DesignHarfBuzzBytes.js';

/** A bounded standalone text shaper with no filesystem, process environment or network access. */
export class DesignHarfBuzzRuntime {
    static #instance: DesignHarfBuzzRuntime | null = null;
    static #pending: Promise<void> | null = null;
    readonly #exports: WebAssembly.Exports;
    /** Pointers address only this module's bounded linear memory. */
    public readonly memory: WebAssembly.Memory;

    private constructor(instance: WebAssembly.Instance) {
        this.#exports = instance.exports;
        const memory: unknown = instance.exports['memory'];
        if (!(memory instanceof WebAssembly.Memory)) {
            throw new Error('The text shaper does not export its linear memory.');
        }
        this.memory = memory;
        this.invoke('_initialize');
    }

    /** Compile asynchronously before rendering; synchronous standalone measurement also remains supported. */
    public static async prepare(): Promise<void> {
        if (this.#instance !== null) {
            return;
        }
        this.#pending ??= this.#load();
        await this.#pending;
    }

    static async #load(): Promise<void> {
        const result: WebAssembly.WebAssemblyInstantiatedSource = await WebAssembly.instantiate(
            this.#bytes(),
            this.#imports(),
        );
        this.#instance ??= new DesignHarfBuzzRuntime(result.instance);
    }

    /** Access is synchronous after preparation, including legacy standalone measurement callers. */
    public static read(): DesignHarfBuzzRuntime {
        this.#instance ??= new DesignHarfBuzzRuntime(
            new WebAssembly.Instance(new WebAssembly.Module(this.#bytes()), this.#imports()),
        );
        return this.#instance;
    }

    static #bytes(): Uint8Array<ArrayBuffer> {
        const decoded: string = atob(DesignHarfBuzzBytes);
        return Uint8Array.from(decoded, (value: string): number => value.charCodeAt(0));
    }

    /** Unsupported WASI descriptors return EBADF; private text cannot be written to a host stream. */
    static #imports(): WebAssembly.Imports {
        return {
            wasi_snapshot_preview1: {
                fd_close: (): number => 8,
                fd_prestat_get: (): number => 8,
                fd_prestat_dir_name: (): number => 8,
                fd_seek: (): number => 8,
                fd_write: (): number => 8,
                proc_exit: (status: number): never => {
                    throw new Error('The text shaper exited with status ' + String(status) + '.');
                },
            },
        };
    }

    /** Void exports are checked at the WebAssembly boundary before entering application logic. */
    public invoke(name: string, ...args: readonly number[]): void {
        const callable: unknown = this.#exports[name];
        if (typeof callable !== 'function') {
            throw new Error('Missing text shaper export: ' + name);
        }
        const result: unknown = Reflect.apply(callable, undefined, args);
        if (result !== undefined) {
            throw new Error('Unexpected text shaper return value: ' + name);
        }
    }

    /** C integer returns are checked before use as offsets, lengths or glyph identifiers. */
    public integer(name: string, ...args: readonly number[]): number {
        const callable: unknown = this.#exports[name];
        if (typeof callable !== 'function') {
            throw new Error('Missing text shaper export: ' + name);
        }
        const result: unknown = Reflect.apply(callable, undefined, args);
        if (typeof result !== 'number' || !Number.isInteger(result) || result < 0) {
            throw new Error('Invalid text shaper integer: ' + name);
        }
        return result;
    }

    /** Allocation failure cannot become an address-zero write. */
    public allocate(size: number): number {
        if (!Number.isInteger(size) || size < 1 || size > 32 * 1024 * 1024) {
            throw new Error('Text shaper allocation exceeds its budget.');
        }
        const pointer: number = this.integer('malloc', size);
        if (pointer === 0 || pointer + size > this.memory.buffer.byteLength) {
            throw new Error('The text shaper could not allocate its bounded input.');
        }
        return pointer;
    }
}
