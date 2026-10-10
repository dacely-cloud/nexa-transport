// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignNodeCodec } from './DesignNodeCodec.js';
import { DesignCodec } from './DesignCodec.js';
import { DesignRecordKind as Kind, type DesignRecord } from './DesignRequests.js';

/** Record fragments are validated after assembly before entering editor state. */
export class DesignRecordCodec {
    /** Parses a complete canonical record or tombstone with matching identity. */
    public static record(raw: unknown): DesignRecord {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['kind', 'id', 'value']);
        const kind: Kind = V.choice(value['kind'], Object.values(Kind));
        const id: string = V.id(value['id']);
        let record: DesignRecord;
        switch (kind) {
            case Kind.Node:
                record = {
                    kind,
                    id,
                    value: value['value'] === null ? null : DesignNodeCodec.node(value['value']),
                };
                break;
            case Kind.Page:
                record = {
                    kind,
                    id,
                    value: value['value'] === null ? null : DesignCodec.page(value['value']),
                };
                break;
            case Kind.Token:
                record = {
                    kind,
                    id,
                    value: value['value'] === null ? null : DesignCodec.token(value['value']),
                };
                break;
            case Kind.Interaction:
                record = {
                    kind,
                    id,
                    value: value['value'] === null ? null : DesignCodec.interaction(value['value']),
                };
                break;
            case Kind.Comment:
                record = {
                    kind,
                    id,
                    value: value['value'] === null ? null : DesignCodec.comment(value['value']),
                };
                break;
        }
        if (record.value !== null && record.value.id !== id) {
            throw new Error('Design record identity mismatch');
        }
        return record;
    }
}
