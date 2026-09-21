import type {
    ApprovalRequestedData,
    ApprovalResolvedData,
    ChangedData,
    ConnectChallengeData,
    SessionMessageData,
    TurnEndData,
    TurnEventData,
    VoiceCallEvent,
} from './Protocol.js';
import * as validators from './Validators.js';
import type { Validator } from './Validators.js';
/** The gateway's catalogued event names. */
export const EventName = {
    Challenge: 'connect.challenge',
    TurnEvent: 'turn.event',
    TurnEnd: 'turn.end',
    SessionMessage: 'session.message',
    ApprovalRequested: 'approval.requested',
    ApprovalResolved: 'approval.resolved',
    JobsChanged: 'jobs.changed',
    AgentsChanged: 'agents.changed',
    VoiceAudio: 'voice.audio',
    VoiceEvent: 'voice.event',
    Shutdown: 'gateway.shutdown',
} as const;
/** PCM16 voice frame delivered by Nexa. */
export interface VoiceAudio {
    /** Active server voice call. */
    readonly callId: string;
    /** Base64 PCM16 bytes. */
    readonly pcm: string;
    /** Audio sampling rate. */
    readonly sampleRate: number;
}
/** Identifies the originating voice call. */
export interface VoiceIdentity {
    readonly callId: string;
}
/** Typed voice status or transcript. */
export type VoiceEvent = VoiceCallEvent & VoiceIdentity;
/** Server shutdown notice. */
export interface Shutdown {
    readonly reason: string;
}
/** Exact payload associated with each event name. */
export interface EventMap {
    readonly 'connect.challenge': ConnectChallengeData;
    readonly 'turn.event': TurnEventData;
    readonly 'turn.end': TurnEndData;
    readonly 'session.message': SessionMessageData;
    readonly 'approval.requested': ApprovalRequestedData;
    readonly 'approval.resolved': ApprovalResolvedData;
    readonly 'jobs.changed': ChangedData;
    readonly 'agents.changed': ChangedData;
    readonly 'voice.audio': VoiceAudio;
    readonly 'voice.event': VoiceEvent;
    readonly 'gateway.shutdown': Shutdown;
}
const eventValidators: Readonly<Record<keyof EventMap, Validator>> = {
    'connect.challenge': validators.challenge,
    'turn.event': validators.turnEvent,
    'turn.end': validators.turnEnd,
    'session.message': validators.sessionMessage,
    'approval.requested': validators.approvalRequested,
    'approval.resolved': validators.approvalResolved,
    'jobs.changed': validators.changed,
    'agents.changed': validators.changed,
    'voice.audio': (value: unknown): boolean =>
        isRecord(value) &&
        typeof value['callId'] === 'string' &&
        typeof value['pcm'] === 'string' &&
        typeof value['sampleRate'] === 'number' &&
        Number.isSafeInteger(value['sampleRate']) &&
        value['sampleRate'] > 0,
    'voice.event': (value: unknown): boolean =>
        isRecord(value) && typeof value['callId'] === 'string' && validators.voice(value),
    'gateway.shutdown': (value: unknown): boolean =>
        isRecord(value) && typeof value['reason'] === 'string',
};
/** Narrows an external payload using the validator for its catalogued event. */
export function isEventData<E extends keyof EventMap>(name: E, data: unknown): data is EventMap[E] {
    return Object.hasOwn(eventValidators, name) && eventValidators[name](data);
}
/** Narrows only at the incoming JSON boundary. */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
