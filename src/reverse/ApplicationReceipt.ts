import type { ApplicationLocation, ReverseApplicationSnapshot } from '../protocol/Protocol.js';

/** Portable bounds for the shared static application projection, after wire-shape validation. */
export class ApplicationReceipt {
    /** Complete indexes remain in the host; presentation receipts contain only bounded previews. */
    public static validate(value: ReverseApplicationSnapshot): void {
        const counts: readonly number[] = [
            value.moduleCount,
            value.importCount,
            value.functionCount,
            value.ipcCount,
            value.routeCount,
            value.nativeAddonCount,
            value.sourceMapCount,
            value.issueCount,
        ];
        if (
            counts.some(
                (count: number): boolean =>
                    !Number.isSafeInteger(count) || count < 0 || count > 200_000,
            ) ||
            value.modules.length > 12 ||
            value.boundaries.length > 16 ||
            value.issues.length > 8 ||
            value.modules.length > value.moduleCount ||
            value.issues.length > value.issueCount ||
            new Set(value.modules.map((module): string => module.id)).size !==
                value.modules.length ||
            new Set(value.boundaries.map((boundary): string => boundary.id)).size !==
                value.boundaries.length
        ) {
            throw new RangeError('Application projection exceeds presentation limits');
        }
        if (
            value.modules.some(
                (module): boolean =>
                    module.id.length === 0 ||
                    module.id.length > 1024 ||
                    module.path.length > 1024 ||
                    !/^[a-f0-9]{64}$/u.test(module.sha256) ||
                    !/^[0-9]{1,10}$/u.test(module.bytes) ||
                    BigInt(module.bytes) > 16_777_216n ||
                    !Number.isSafeInteger(module.functions) ||
                    module.functions < 0 ||
                    module.functions > value.functionCount ||
                    !Number.isSafeInteger(module.imports) ||
                    module.imports < 0 ||
                    module.imports > value.importCount ||
                    (module.sourceMap !== null && module.sourceMap.length > 1024) ||
                    (module.parseError !== null && module.parseError.length > 1000),
            ) ||
            value.boundaries.some(
                (boundary): boolean =>
                    boundary.id.length === 0 ||
                    boundary.id.length > 128 ||
                    boundary.operation.length > 128 ||
                    (boundary.value !== null && boundary.value.length > 1024) ||
                    !this.#location(boundary.location),
            ) ||
            value.issues.some(
                (issue): boolean => issue.path.length > 1024 || issue.message.length > 1000,
            )
        ) {
            throw new RangeError('Invalid application observation provenance');
        }
    }
    static #location(location: ApplicationLocation): boolean {
        const values: readonly number[] = [
            location.line,
            location.column,
            location.endLine,
            location.endColumn,
            location.start,
            location.end,
        ];
        return (
            location.module.length > 0 &&
            location.module.length <= 1024 &&
            values.every(
                (value: number): boolean =>
                    Number.isSafeInteger(value) && value >= 0 && value <= 16_777_216,
            ) &&
            location.line >= 1 &&
            location.endLine >= location.line &&
            (location.endLine !== location.line || location.endColumn >= location.column) &&
            location.end >= location.start
        );
    }
}
