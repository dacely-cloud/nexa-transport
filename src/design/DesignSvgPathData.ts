// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';

/** Validates complete SVG path grammar before the native parser can normalize malformed input. */
export class DesignSvgPathData {
    public static validate(source: string): void {
        let offset: number = 0;
        let command: string = '';
        let count: number = 0;
        const lengths: Readonly<Record<string, number>> = {
            M: 2,
            L: 2,
            H: 1,
            V: 1,
            C: 6,
            S: 4,
            Q: 4,
            T: 2,
            A: 7,
        };
        const space: () => void = (): void => {
            while (/[\t\r\n ]/u.test(source[offset] ?? '\0')) {
                offset++;
            }
        };
        space();
        if (!/[Mm]/u.test(source[offset] ?? '')) {
            throw new DesignSvgInputError('SVG paths must start with a move.');
        }
        while (offset < source.length) {
            space();
            if (offset >= source.length) {
                break;
            }
            const next: string = source[offset] ?? '';
            if (/[A-Za-z]/u.test(next)) {
                command = next;
                offset++;
                if (command === 'Z' || command === 'z') {
                    if (++count > 10000) {
                        throw new DesignSvgInputError('SVG path exceeds its command budget.');
                    }
                    command = '';
                    continue;
                }
            } else if (command === '') {
                throw new DesignSvgInputError('Expected an SVG path command.');
            }
            const kind: string = command.toUpperCase();
            const length: number | undefined = lengths[kind];
            if (length === undefined) {
                throw new DesignSvgInputError('Unsupported SVG path command ' + command);
            }
            for (let index: number = 0; index < length; index++) {
                space();
                if (source[offset] === ',') {
                    if (index === 0) {
                        throw new DesignSvgInputError('Unexpected SVG path separator.');
                    }
                    offset++;
                    space();
                }
                if (kind === 'A' && (index === 3 || index === 4)) {
                    const flag: string = source[offset] ?? '';
                    if (flag !== '0' && flag !== '1') {
                        throw new DesignSvgInputError('SVG arc flags must be zero or one.');
                    }
                    offset++;
                    continue;
                }
                const match: RegExpMatchArray | null = DesignSvgNumbers.token.exec(
                    source.slice(offset),
                );
                const raw: string | undefined = match?.[0];
                if (raw === undefined) {
                    throw new DesignSvgInputError('Missing SVG path coordinate.');
                }
                const value: number = Number(raw);
                if (!Number.isFinite(value) || Math.abs(value) > 1000000) {
                    throw new DesignSvgInputError('SVG path coordinate exceeds its range.');
                }
                offset += raw.length;
            }
            if (++count > 10000) {
                throw new DesignSvgInputError('SVG path exceeds its command budget.');
            }
            if (kind === 'M') {
                command = command === 'M' ? 'L' : 'l';
            }
            space();
            if (source[offset] === ',') {
                offset++;
                space();
                if (offset >= source.length || /[A-Za-z,]/u.test(source[offset] ?? '')) {
                    throw new DesignSvgInputError('Unexpected SVG path separator.');
                }
            }
        }
    }
}
