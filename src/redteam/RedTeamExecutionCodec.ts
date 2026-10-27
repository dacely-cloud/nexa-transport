// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RedTeamInput } from './RedTeamInput.js';
import {
    RedTeamActionKind,
    RedTeamActionState,
    RedTeamTargetKind,
    type RedTeamExecutionAction,
    type RedTeamActionTarget,
    type RedTeamHistorySelection,
} from './RedTeamExecutionTypes.js';

/** Validate every execution reference before it crosses storage or the gateway. */
export class RedTeamExecutionCodec {
    /** Require both selectors before a native frame can be opened from its actual parent. */
    public static historySelection(raw: unknown): RedTeamHistorySelection {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'workerId',
            'streamId',
        ]);
        return {
            workerId: RedTeamInput.id(value['workerId']),
            streamId: RedTeamInput.id(value['streamId']),
        };
    }
    /** Validate one bounded target without granting access to its supplied path. */
    public static target(raw: unknown): RedTeamActionTarget {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['targetId', 'kind', 'label', 'sessionKey', 'toolCallId', 'fileId', 'path', 'line'],
            ['historySelection'],
        );
        return {
            ...(Object.hasOwn(value, 'historySelection')
                ? { historySelection: this.historySelection(value['historySelection']) }
                : {}),
            targetId: RedTeamInput.id(value['targetId']),
            kind: RedTeamInput.choice(value['kind'], RedTeamTargetKind),
            label: RedTeamInput.text(value['label'], 256),
            sessionKey: RedTeamInput.id(value['sessionKey']),
            toolCallId:
                value['toolCallId'] === null ? null : RedTeamInput.text(value['toolCallId'], 256),
            fileId: value['fileId'] === null ? null : RedTeamInput.id(value['fileId']),
            path: value['path'] === null ? null : RedTeamInput.text(value['path'], 4096),
            line:
                value['line'] === null
                    ? null
                    : RedTeamInput.integer(value['line'], 1, 1_000_000_000),
        };
    }
    public static action(raw: unknown): RedTeamExecutionAction {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'effortId',
            'agentId',
            'parentAgentId',
            'actionId',
            'kind',
            'state',
            'target',
            'relatedTargetId',
        ]);
        return {
            effortId: RedTeamInput.id(value['effortId']),
            agentId: RedTeamInput.id(value['agentId']),
            parentAgentId:
                value['parentAgentId'] === null ? null : RedTeamInput.id(value['parentAgentId']),
            actionId: RedTeamInput.id(value['actionId']),
            kind: RedTeamInput.choice(value['kind'], RedTeamActionKind),
            state: RedTeamInput.choice(value['state'], RedTeamActionState),
            target: this.target(value['target']),
            relatedTargetId:
                value['relatedTargetId'] === null
                    ? null
                    : RedTeamInput.id(value['relatedTargetId']),
        };
    }
}
