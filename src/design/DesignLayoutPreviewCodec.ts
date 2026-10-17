// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignOperationCodec } from './DesignOperationCodec.js';
import { DesignOperationKind, type DesignOperation } from './DesignOperationTypes.js';
import { DesignViewCodec } from './DesignViewCodec.js';
import { DesignCanvasCodec } from './DesignCanvasCodec.js';
import { DesignTextWindowCodec } from './DesignTextWindowCodec.js';
import {
    DesignLayoutPreviewAction as Action,
    type DesignLayoutPreviewRequest,
} from './DesignLayoutPreviewTypes.js';

/** Native previews have a closed boundary and cannot replace source bodies, alter ownership or persist command identity. */
export class DesignLayoutPreviewCodec {
    /** Continuations require their projection key and every query pins an existing saved revision. */
    public static request(raw: unknown): DesignLayoutPreviewRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'action',
            'operation',
            'params',
            'key',
        ]);
        const operation: DesignOperation | undefined = DesignOperationCodec.operations([
            value['operation'],
        ])[0];
        if (
            operation?.op !== DesignOperationKind.Layout &&
            operation?.op !== DesignOperationKind.Recolor &&
            operation?.op !== DesignOperationKind.Reparent &&
            operation?.op !== DesignOperationKind.Tidy &&
            operation?.op !== DesignOperationKind.Resize
        ) {
            throw new Error(
                'Preview requires one native layout, tidy, recolor, reparent or resize operation.',
            );
        }
        const key: string | null = value['key'] === null ? null : V.text(value['key'], 64);
        const action: Action = V.choice(value['action'], Object.values(Action));
        const result: DesignLayoutPreviewRequest =
            action === Action.Canvas
                ? { action, operation, key, params: DesignViewCodec.request(value['params']) }
                : action === Action.Metrics
                  ? { action, operation, key, params: DesignCanvasCodec.metrics(value['params']) }
                  : {
                        action,
                        operation,
                        key,
                        params: DesignTextWindowCodec.request(value['params']),
                    };
        if (result.params.revision === null || result.params.pageId !== operation.pageId) {
            throw new Error('Preview requires the source revision and matching page.');
        }
        if ('includeIds' in result.params && result.params.includeIds.length > 0) {
            throw new Error('Preview cannot hydrate source bodies.');
        }
        if (
            key === null &&
            (action !== Action.Canvas ||
                (result.action === Action.Canvas && result.params.cursor !== null))
        ) {
            throw new Error('Start a preview with its first canvas page.');
        }
        return result;
    }
}
