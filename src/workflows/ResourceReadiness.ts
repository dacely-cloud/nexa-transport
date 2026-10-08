// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ResourceBindingCodec } from './ResourceBindingCodec.js';
import { ResourceIssue, ResourceMode, ResourceState } from './ResourceTypes.js';
import type {
    ResourceBinding,
    ResourceDescriptor,
    ResourceCapability,
    ResourceReadiness as Readiness,
    ResourceBlocked,
} from './ResourceTypes.js';

/** Pure readiness checks on already-authorized metadata; no discovery, inference, or I/O. */
export class ResourceReadiness {
    /**
     * Never treats the result as authorization. The engine must load current descriptors
     * through the backend's verified account context and recheck access at every operation.
     * Mock mode requires an explicitly selected fixture descriptor for this exact binding.
     */
    public static inspect(
        binding: ResourceBinding,
        descriptor: ResourceDescriptor | null,
        mode: ResourceMode,
        nowMs: bigint,
    ): Readiness {
        if (mode !== ResourceMode.Live && mode !== ResourceMode.Mock) {
            throw new Error('Unknown resource execution mode');
        }
        if (nowMs < 0n || nowMs > 0x7fff_ffff_ffff_ffffn) {
            throw new Error('Invalid resource check time');
        }
        const checked: ResourceBinding = ResourceBindingCodec.parse(binding);
        if (checked.selection === null) {
            return this.#block(
                checked,
                mode,
                ResourceIssue.Setup,
                'Choose a resource and its permitted data.',
            );
        }
        if (descriptor === null) {
            return this.#block(
                checked,
                mode,
                ResourceIssue.Missing,
                'This resource is missing or no longer accessible.',
            );
        }
        if (
            checked.selection.resourceId !== descriptor.resourceId ||
            checked.selection.connectionId !== descriptor.connectionId ||
            checked.selection.connectorId !== descriptor.connectorId ||
            checked.selection.targetId !== descriptor.targetId ||
            checked.family !== descriptor.family
        ) {
            return this.#block(
                checked,
                mode,
                ResourceIssue.Identity,
                'Select the original resource and exact data scope.',
            );
        }
        if (checked.selection.connectorVersion !== descriptor.connectorVersion) {
            return this.#block(
                checked,
                mode,
                ResourceIssue.Version,
                'Review the changed connector version.',
            );
        }
        switch (descriptor.state) {
            case ResourceState.Unconfigured:
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Setup,
                    'Finish setting up this connection.',
                );
            case ResourceState.Unauthorized:
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Unauthorized,
                    'Restore permission to use this resource.',
                );
            case ResourceState.Disconnected:
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Disconnected,
                    'Reconnect this resource.',
                );
            case ResourceState.Unavailable:
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Unavailable,
                    'This connector is unavailable.',
                );
            case ResourceState.Mock:
                if (mode === ResourceMode.Live) {
                    return this.#block(
                        checked,
                        mode,
                        ResourceIssue.Mock,
                        'Sample resources cannot run live.',
                    );
                }
                break;
            case ResourceState.Ready:
                if (mode === ResourceMode.Mock) {
                    return this.#block(
                        checked,
                        mode,
                        ResourceIssue.FixtureRequired,
                        'Select a sample fixture for this test.',
                    );
                }
                break;
            default:
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Unavailable,
                    'The connector reported an unsupported state.',
                );
        }
        for (const operation of checked.operations) {
            const matches: readonly ResourceCapability[] = descriptor.capabilities.filter(
                (entry: ResourceCapability): boolean => entry.operation === operation,
            );
            const capability: ResourceCapability | undefined = matches[0];
            if (
                matches.length !== 1 ||
                capability === undefined ||
                !capability.uses.includes(checked.use)
            ) {
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Capability,
                    `This resource does not allow ${operation} for ${checked.use}.`,
                );
            }
            const maxBytes: bigint = BigInt(
                ResourceBindingCodec.decimal(capability.limits.maxBytes),
            );
            if (
                !Number.isSafeInteger(capability.limits.maxItems) ||
                capability.limits.maxItems < 1 ||
                checked.limits.maxItems > capability.limits.maxItems ||
                BigInt(checked.limits.maxBytes) > maxBytes
            ) {
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Limit,
                    'Reduce the requested output limits to the connector allowance.',
                );
            }
        }
        if (checked.maxAgeMs !== null) {
            if (descriptor.observedAtMs === null) {
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.FreshnessUnknown,
                    'The source has no observation timestamp.',
                );
            }
            const observed: bigint = BigInt(ResourceBindingCodec.decimal(descriptor.observedAtMs));
            if (observed > nowMs) {
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.FreshnessUnknown,
                    'The source observation is in the future.',
                );
            }
            if (nowMs - observed > BigInt(checked.maxAgeMs)) {
                return this.#block(
                    checked,
                    mode,
                    ResourceIssue.Stale,
                    'Refresh the selected data before running.',
                );
            }
        }
        return { ready: true, mode, bindingId: checked.id };
    }

    static #block(
        binding: ResourceBinding,
        mode: ResourceMode,
        issue: ResourceIssue,
        message: string,
    ): ResourceBlocked {
        return { ready: false, mode, bindingId: binding.id, issue, message };
    }
}
