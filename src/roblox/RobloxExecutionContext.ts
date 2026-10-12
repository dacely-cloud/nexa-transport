// SPDX-License-Identifier: Apache-2.0

/** A VM runs one isolated Roblox execution side for its whole lifetime. */
export const RobloxExecutionContext = { Server: 'server', Client: 'client' } as const;
/** Authored Script.RunContext values are evaluated against this immutable VM side. */
export type RobloxExecutionContext =
    (typeof RobloxExecutionContext)[keyof typeof RobloxExecutionContext];
