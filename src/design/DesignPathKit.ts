// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignPathKitFactory,
    DesignPathKitLibrary,
    DesignPathKitEnum,
} from './DesignPathKitTypes.js';

/** Lazily initializes the same bounded vector engine in native tools and the browser. */
export class DesignPathKit {
    static #loading: Promise<DesignPathKitLibrary> | null = null;

    /** Concurrent callers share one initialization; failed initialization remains visible to every caller. */
    public static load(): Promise<DesignPathKitLibrary> {
        this.#loading ??= this.#initialize();
        return this.#loading;
    }

    static async #initialize(): Promise<DesignPathKitLibrary> {
        const factory: unknown = (await import('pathkit-wasm')).default;
        if (!this.#factory(factory)) {
            throw new Error('The vector engine does not provide its initialization factory.');
        }
        const encoded: string = (await import('./DesignPathKitBytes.js')).DesignPathKitBytes;
        const binary: string = atob(encoded);
        const bytes: Uint8Array = new Uint8Array(binary.length);
        for (let index: number = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index);
        }
        const library: unknown = await factory({ wasmBinary: bytes });
        if (!this.#library(library)) {
            throw new Error('The vector engine has an incompatible runtime contract.');
        }
        return library;
    }

    static #factory(value: unknown): value is DesignPathKitFactory {
        return typeof value === 'function';
    }

    static #enum(value: unknown): value is DesignPathKitEnum {
        return (
            typeof value === 'object' &&
            value !== null &&
            'value' in value &&
            typeof value.value === 'number' &&
            Number.isInteger(value.value)
        );
    }

    static #library(value: unknown): value is DesignPathKitLibrary {
        if (
            typeof value !== 'object' ||
            value === null ||
            !('FromCmds' in value) ||
            typeof value.FromCmds !== 'function' ||
            !('FromSVGString' in value) ||
            typeof value.FromSVGString !== 'function' ||
            !('NewPath' in value) ||
            typeof value.NewPath !== 'function' ||
            !('MakeFromOp' in value) ||
            typeof value.MakeFromOp !== 'function' ||
            !('PathOp' in value) ||
            !('FillType' in value) ||
            !('StrokeJoin' in value) ||
            !('StrokeCap' in value)
        ) {
            return false;
        }
        const operations: unknown = value.PathOp;
        const fills: unknown = value.FillType;
        const joins: unknown = value.StrokeJoin;
        const caps: unknown = value.StrokeCap;
        return (
            (typeof operations === 'function' ||
                (typeof operations === 'object' && operations !== null)) &&
            'UNION' in operations &&
            this.#enum(operations.UNION) &&
            'DIFFERENCE' in operations &&
            this.#enum(operations.DIFFERENCE) &&
            'INTERSECT' in operations &&
            this.#enum(operations.INTERSECT) &&
            'XOR' in operations &&
            this.#enum(operations.XOR) &&
            (typeof fills === 'function' || (typeof fills === 'object' && fills !== null)) &&
            'WINDING' in fills &&
            this.#enum(fills.WINDING) &&
            (typeof joins === 'function' || (typeof joins === 'object' && joins !== null)) &&
            'ROUND' in joins &&
            this.#enum(joins.ROUND) &&
            (typeof caps === 'function' || (typeof caps === 'object' && caps !== null)) &&
            'ROUND' in caps &&
            this.#enum(caps.ROUND)
        );
    }
}
