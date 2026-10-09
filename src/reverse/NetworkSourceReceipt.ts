import type { NetworkRequest } from '../protocol/Protocol.js';

/** Portable exact source coordinates for HAR and unchanged native flow records. */
export class NetworkSourceReceipt {
    /** Validates a location independently when reading a saved detail page. */
    public static location(selector: string, location: string): boolean {
        if (!/^entry:(?:0|[1-9][0-9]{0,4})$/u.test(selector)) {
            return false;
        }
        if (location === '$.log.entries[' + selector.slice(6) + ']') {
            return true;
        }
        const match: RegExpExecArray | null =
            /^bytes:(0|[1-9][0-9]{0,9})-(0|[1-9][0-9]{0,9})$/u.exec(location);
        const start: string | undefined = match?.[1];
        const end: string | undefined = match?.[2];
        return (
            start !== undefined &&
            end !== undefined &&
            BigInt(start) < BigInt(end) &&
            BigInt(end) <= 2_147_483_648n &&
            BigInt(end) - BigInt(start) <= 16_777_216n
        );
    }
    /** Native rows bind their byte range and compact producer identity to the same ordinal. */
    public static request(row: NetworkRequest): boolean {
        if (!this.location(row.id, row.location)) {
            return false;
        }
        if (row.native === undefined) {
            return row.location.startsWith('$.log.entries[');
        }
        const source: NonNullable<NetworkRequest['native']> = row.native;
        return (
            source.ordinal === row.id.slice(6) &&
            row.location === 'bytes:' + source.start + '-' + source.end &&
            [source.flowId, source.flowType, source.stateVersion].every(
                (value: string | null): boolean => value === null || value.length <= 256,
            ) &&
            Object.keys(source).every((key: string): boolean =>
                ['ordinal', 'start', 'end', 'flowId', 'flowType', 'stateVersion'].includes(key),
            )
        );
    }
}
