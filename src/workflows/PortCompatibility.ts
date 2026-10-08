// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { PortDirection, type ComponentPort } from './ComponentTypes.js';
import type { WorkflowEdgeKind } from './WorkflowTypes.js';
import { SchemaCompatibility } from './SchemaCompatibility.js';

/** One connection rule shared by the wire picker and authoritative graph validation. */
export class PortCompatibility {
    public static problem(
        source: ComponentPort,
        target: ComponentPort,
        kind: WorkflowEdgeKind,
    ): string | null {
        if (source.direction !== PortDirection.Output || target.direction !== PortDirection.Input) {
            return 'Connect an output to an input';
        }
        if (source.kind !== kind || target.kind !== kind) {
            return 'Execution, data and resource connections are distinct';
        }
        if (source.cardinality !== target.cardinality) {
            return 'Item, list and stream ports need an explicit conversion';
        }
        if (!SchemaCompatibility.accepts(target.schema, source.schema)) {
            return 'Port types are incompatible; add an explicit conversion';
        }
        return null;
    }
}
