// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Raster formats are identified from bytes before becoming usable design assets. */
export const DesignAssetMime = {
    Png: 'image/png',
    Jpeg: 'image/jpeg',
    Webp: 'image/webp',
    Gif: 'image/gif',
} as const;
export type DesignAssetMime = (typeof DesignAssetMime)[keyof typeof DesignAssetMime];
/** All asset transfers use one acknowledged bounded chunk at a time. */
export class DesignAssetLimits {
    public static readonly chunkBytes: number = 192 * 1024;
    public static readonly fileBytes: bigint = 16n * 1024n * 1024n;
    public static readonly ownerBytes: bigint = 1024n * 1024n * 1024n;
    public static readonly ownerCount: number = 256;
    public static readonly pixels: number = 16 * 1024 * 1024;
    public static readonly edge: number = 8192;
}
/** Published assets are immutable, and all byte counts remain decimal strings. */
export interface DesignAsset {
    readonly id: string;
    readonly name: string;
    readonly mime: DesignAssetMime;
    readonly byteLength: string;
    readonly sha256: string;
    readonly width: number;
    readonly height: number;
}
/** Retried admission uses the same client-chosen identity. Ownership comes from the host. */
export interface DesignAssetStartRequest {
    readonly id: string;
    readonly name: string;
    readonly byteLength: string;
    readonly sha256: string;
}
/** One canonical base64 slice, addressed by exact byte position. */
export interface DesignAssetChunkRequest {
    readonly id: string;
    readonly offset: string;
    readonly data: string;
}
/** Asset addressing is independent of document ownership; both are authorized by the server. */
export interface DesignAssetIdRequest {
    readonly id: string;
}
/** Reads transfer only a bounded slice of a completed immutable image. */
export interface DesignAssetReadRequest {
    readonly id: string;
    readonly offset: string;
}
/** Receipts carry progress without echoing source bytes. */
export interface DesignAssetPosition {
    readonly id: string;
    readonly offset: string;
    readonly byteLength: string;
}
/** The browser pins the metadata identity while assembling slices. */
export interface DesignAssetSlice {
    readonly asset: DesignAsset;
    readonly offset: string;
    readonly data: string;
    readonly nextOffset: string | null;
}
/** Library projections are metadata only. */
export interface DesignAssetListRequest {
    readonly after: string | null;
    readonly limit: number;
}
export interface DesignAssetListPage {
    readonly items: readonly DesignAsset[];
    readonly nextAfter: string | null;
}
export interface DesignAssetStartMethod {
    readonly params: DesignAssetStartRequest;
    readonly result: DesignAssetPosition;
}
export interface DesignAssetChunkMethod {
    readonly params: DesignAssetChunkRequest;
    readonly result: DesignAssetPosition;
}
export interface DesignAssetFinishMethod {
    readonly params: DesignAssetIdRequest;
    readonly result: DesignAsset;
}
export interface DesignAssetCancelMethod {
    readonly params: DesignAssetIdRequest;
    readonly result: null;
}
export interface DesignAssetReadMethod {
    readonly params: DesignAssetReadRequest;
    readonly result: DesignAssetSlice;
}
export interface DesignAssetListMethod {
    readonly params: DesignAssetListRequest;
    readonly result: DesignAssetListPage;
}
export interface DesignAssetRemoveMethod {
    readonly params: DesignAssetIdRequest;
    readonly result: null;
}
