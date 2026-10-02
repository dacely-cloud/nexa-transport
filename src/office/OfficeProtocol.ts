// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** OfficeState in the fixed-schema office protocol. */
export type OfficeState = 'working' | 'idle' | 'sleeping' | 'waiting' | 'failed' | 'unknown';
/** OfficePhase in the fixed-schema office protocol. */
export interface OfficePhase {
    readonly id: string;
    readonly title: string;
    readonly status: 'pending' | 'active' | 'done' | 'failed' | 'blocked' | 'skipped';
}
/** OfficeTask in the fixed-schema office protocol. */
export interface OfficeTask {
    readonly id: string;
    readonly title: string;
    readonly activity: string;
}
/** OfficeAgent in the fixed-schema office protocol. */
export interface OfficeAgent {
    readonly id: string;
    readonly agentId: string;
    readonly name: string;
    readonly state: OfficeState;
    readonly activity: string;
    readonly goal: string;
    readonly source?: string;
    readonly sessionId?: string;
    readonly streamId?: string;
    readonly workerId?: string;
    readonly parentWorkerId?: string;
    readonly rank?: 'lead' | 'member';
    readonly phases?: readonly OfficePhase[];
    readonly tasks?: readonly OfficeTask[];
    readonly discussionWith?: string;
    readonly phaseStatus?: OfficePhase['status'];
    readonly reaction?: OfficeReaction;
}
/** OfficeWorkItem in the fixed-schema office protocol. */
export interface OfficeWorkItem {
    readonly id: number;
    readonly title: string;
    readonly status: string;
    readonly kind: string;
    readonly parent: number | null;
    readonly dependsOn: readonly number[];
    readonly acceptance: readonly string[];
    readonly points?: number;
    readonly activity: string;
    readonly turn: number;
    readonly findings: number;
    readonly updated: boolean;
}
/** OfficeProject in the fixed-schema office protocol. */
export interface OfficeProject {
    readonly id: string;
    readonly owner: string;
    readonly sessionId?: string;
    readonly goal: string;
    readonly declaredItemCount?: number;
    readonly state: 'running' | 'ended' | 'interrupted';
    readonly items: readonly OfficeWorkItem[];
    readonly agents: readonly OfficeAssignment[];
    readonly outcome?: { done: number; failed: number; skipped: number; stoppedBy: string };
    readonly steering?: { round: number; summary: string };
}
/** OfficeReactionReason in the fixed-schema office protocol. */
export type OfficeReactionReason = 'error' | 'feedback' | 'self-correction';
/** OfficeReaction in the fixed-schema office protocol. */
export interface OfficeReaction {
    readonly id: string;
    readonly startedAt: bigint;
    readonly expiresAt: bigint;
    readonly reason: OfficeReactionReason;
    readonly phrase: 'FUCK!' | 'WTF?!' | 'WHAT IS THIS SHIT?!';
}
/** One runtime-reported Agile assignment. */
/** OfficeAssignment in the fixed-schema office protocol. */
export interface OfficeAssignment {
    readonly item: number;
    readonly expert: string;
    readonly role: string;
    readonly state: string;
    readonly activity: string;
    readonly findings: number;
    readonly tokens: number;
    readonly turn: number;
}
/** NGOP: fixed-field binary office packets multiplexed on the authenticated gateway socket. */
/** OFFICE_GAME_VERSION in the fixed-schema office protocol. */
export const OFFICE_GAME_VERSION = 2;
/** OFFICE_GAME_LIMIT in the fixed-schema office protocol. */
export const OFFICE_GAME_LIMIT = 4 * 1024 * 1024;
/** OfficeGameOp in the fixed-schema office protocol. */
export const OfficeGameOp = {
    Request: 1,
    Snapshot: 2,
    Delta: 3,
    Leave: 4,
    Heartbeat: 5,

    Ready: 7,
    Player: 8,
} as const;
/** OfficePlayer in the fixed-schema office protocol. */
export interface OfficePlayer {
    readonly name: string;
    readonly x: number;
    readonly z: number;
    readonly yaw: number;
    /** Height above the floor during a jump, in world units. */
    readonly jumpHeight?: number;
    readonly floor: number;
    readonly active: boolean;
}
/** OfficeGameState in the fixed-schema office protocol. */
export interface OfficeGameState {
    readonly agents: readonly OfficeAgent[];
    readonly projects: readonly OfficeProject[];
}
/** OfficeGamePacket in the fixed-schema office protocol. */
export interface OfficeGamePacket extends OfficeGameState {
    readonly op: (typeof OfficeGameOp)[keyof typeof OfficeGameOp];
    readonly sequence: number;
    readonly peer: string;
    readonly removedAgents: readonly string[];
    readonly removedProjects: readonly string[];
    readonly player?: OfficePlayer;
}

class Writer {
    bytes = new Uint8Array(1024);
    offset = 16;
    reserve(size: number) {
        if (size < 0 || this.offset + size > OFFICE_GAME_LIMIT) {
            throw new Error('Office packet is too large');
        }
        if (this.offset + size > this.bytes.length) {
            const grown = new Uint8Array(
                Math.min(OFFICE_GAME_LIMIT, Math.max(this.bytes.length * 2, this.offset + size)),
            );
            grown.set(this.bytes);
            this.bytes = grown;
        }
    }
    u8(value: number) {
        this.reserve(1);
        this.bytes[this.offset++] = value;
    }
    u32(value: number) {
        this.reserve(4);
        new DataView(this.bytes.buffer).setUint32(this.offset, value, true);
        this.offset += 4;
    }
    number(value: number) {
        if (!Number.isFinite(value)) {
            throw new Error('Invalid office number');
        }
        this.reserve(8);
        new DataView(this.bytes.buffer).setFloat64(this.offset, value, true);
        this.offset += 8;
    }
}
class Reader {
    offset = 16;
    view: DataView;
    readonly bytes: Uint8Array;
    constructor(bytes: Uint8Array) {
        this.bytes = bytes;
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    take(size: number) {
        if (size < 0 || size > this.bytes.length - this.offset) {
            throw new Error('Truncated office packet');
        }
        const start = this.offset;
        this.offset += size;
        return start;
    }
    u8() {
        return this.view.getUint8(this.take(1));
    }
    u32() {
        return this.view.getUint32(this.take(4), true);
    }
    number() {
        const value = this.view.getFloat64(this.take(8), true);
        if (!Number.isFinite(value)) {
            throw new Error('Invalid office number');
        }
        return value;
    }
}
interface Codec<T> {
    write(writer: Writer, value: T): void;
    read(reader: Reader): T;
}
const utf8 = new TextEncoder();
const text = new TextDecoder('utf-8', { fatal: true });
const string: Codec<string> = {
    write(w, value) {
        const bytes = utf8.encode(value);
        if (bytes.length > 256 * 1024) {
            throw new Error('Office string is too large');
        }
        w.u32(bytes.length);
        w.reserve(bytes.length);
        w.bytes.set(bytes, w.offset);
        w.offset += bytes.length;
    },
    read(r) {
        const length = r.u32();
        if (length > 256 * 1024) {
            throw new Error('Office string is too large');
        }
        const start = r.take(length);
        return text.decode(r.bytes.subarray(start, start + length));
    },
};
const number: Codec<number> = { write: (w, v) => w.number(v), read: (r) => r.number() };
const boolean: Codec<boolean> = {
    write: (w, v) => w.u8(v ? 1 : 0),
    read(r) {
        const value = r.u8();
        if (value > 1) {
            throw new Error('Invalid office flag');
        }
        return value === 1;
    },
};
function optional<T>(codec: Codec<T>): Codec<T | undefined> {
    return {
        write(w, v) {
            boolean.write(w, v !== undefined);
            if (v !== undefined) {
                codec.write(w, v);
            }
        },
        read: (r) => (boolean.read(r) ? codec.read(r) : undefined),
    };
}
function list<T>(codec: Codec<T>): Codec<readonly T[]> {
    return {
        write(w, values) {
            if (values.length > 4096) {
                throw new Error('Too many office records');
            }
            w.u32(values.length);
            for (const value of values) {
                codec.write(w, value);
            }
        },
        read(r) {
            const count = r.u32();
            if (count > 4096 || count > r.bytes.length - r.offset) {
                throw new Error('Invalid office record count');
            }
            return Array.from({ length: count }, () => codec.read(r));
        },
    };
}
function enumeration<T extends string>(values: readonly T[]): Codec<T> {
    return {
        write(w, v) {
            const index = values.indexOf(v);
            if (index < 0) {
                throw new Error('Invalid office enum');
            }
            w.u8(index);
        },
        read(r) {
            const value = values[r.u8()];
            if (value === undefined) {
                throw new Error('Invalid office enum');
            }
            return value;
        },
    };
}
function record<T extends Partial<Record<keyof T, unknown>>>(fields: {
    [K in keyof T]-?: Codec<T[K]>;
}): Codec<T> {
    /** The fixed schema controls both keys and field types; received data never supplies property names. */
    const keys = Object.keys(fields) as (keyof T)[];
    return {
        write(w, value) {
            for (const key of keys) {
                fields[key].write(w, value[key]);
            }
        },
        read(r) {
            const value: Partial<T> = {};
            for (const key of keys) {
                const field = fields[key].read(r);
                if (field !== undefined) {
                    value[key] = field;
                }
            }
            return value as T;
        },
    };
}
const phaseStatus = enumeration<OfficePhase['status']>([
    'pending',
    'active',
    'done',
    'failed',
    'blocked',
    'skipped',
]);
const phase = record<OfficePhase>({ id: string, title: string, status: phaseStatus });
const task = record<OfficeTask>({ id: string, title: string, activity: string });
const timestamp: Codec<bigint> = {
    write(w, value) {
        if (value < 0n || value > 0xffffffffffffffffn) {
            throw new Error('Invalid office timestamp');
        }
        w.reserve(8);
        new DataView(w.bytes.buffer).setBigUint64(w.offset, value, true);
        w.offset += 8;
    },
    read(r) {
        return r.view.getBigUint64(r.take(8), true);
    },
};
const reaction = record<OfficeReaction>({
    id: string,
    startedAt: timestamp,
    expiresAt: timestamp,
    reason: enumeration(['error', 'feedback', 'self-correction']),
    phrase: enumeration(['FUCK!', 'WTF?!', 'WHAT IS THIS SHIT?!']),
});
const agent = record<OfficeAgent>({
    id: string,
    agentId: string,
    name: string,
    state: enumeration(['working', 'idle', 'sleeping', 'waiting', 'failed', 'unknown']),
    activity: string,
    goal: string,
    source: optional(string),
    sessionId: optional(string),
    streamId: optional(string),
    workerId: optional(string),
    parentWorkerId: optional(string),
    rank: optional(enumeration(['lead', 'member'])),
    phases: optional(list(phase)),
    tasks: optional(list(task)),
    discussionWith: optional(string),
    phaseStatus: optional(phaseStatus),
    reaction: optional(reaction),
});
const nullableNumber: Codec<number | null> = {
    write(w, v) {
        boolean.write(w, v !== null);
        if (v !== null) {
            number.write(w, v);
        }
    },
    read: (r) => (boolean.read(r) ? number.read(r) : null),
};
const item = record<OfficeWorkItem>({
    id: number,
    title: string,
    status: string,
    kind: string,
    parent: nullableNumber,
    dependsOn: list(number),
    acceptance: list(string),
    points: optional(number),
    activity: string,
    turn: number,
    findings: number,
    updated: boolean,
});
const assignment = record<OfficeProject['agents'][number]>({
    item: number,
    expert: string,
    role: string,
    state: string,
    activity: string,
    findings: number,
    tokens: number,
    turn: number,
});
const project = record<OfficeProject>({
    id: string,
    owner: string,
    sessionId: optional(string),
    goal: string,
    declaredItemCount: optional(number),
    state: enumeration(['running', 'ended', 'interrupted']),
    items: list(item),
    agents: list(assignment),
    outcome: optional(record({ done: number, failed: number, skipped: number, stoppedBy: string })),
    steering: optional(record({ round: number, summary: string })),
});
const agents = list(agent),
    projects = list(project),
    ids = list(string);
const player: Codec<OfficePlayer> = {
    write(w, value) {
        const jumpHeight = value.jumpHeight ?? 0;
        if (
            ![jumpHeight, value.x, value.z, value.yaw].every(Number.isFinite) ||
            jumpHeight < 0 ||
            jumpHeight > 2 ||
            Math.abs(value.x) > 500 ||
            Math.abs(value.z) > 500 ||
            Math.abs(value.yaw) > Math.PI * 2 ||
            !Number.isInteger(value.floor) ||
            value.floor < 0 ||
            value.floor > 255 ||
            value.name.length > 80
        ) {
            throw new Error('Invalid player pose');
        }
        w.reserve(18);
        const view = new DataView(w.bytes.buffer);
        for (const valuePart of [value.x, value.z, value.yaw, jumpHeight]) {
            view.setFloat32(w.offset, valuePart, true);
            w.offset += 4;
        }
        w.u8(value.floor);
        boolean.write(w, value.active);
        string.write(w, value.name);
    },
    read(r) {
        const x = r.view.getFloat32(r.take(4), true),
            z = r.view.getFloat32(r.take(4), true),
            yaw = r.view.getFloat32(r.take(4), true),
            jumpHeight = r.view.getFloat32(r.take(4), true);
        const floor = r.u8(),
            active = boolean.read(r),
            name = string.read(r);
        if (
            ![x, z, yaw, jumpHeight].every(Number.isFinite) ||
            jumpHeight < 0 ||
            jumpHeight > 2 ||
            Math.abs(x) > 500 ||
            Math.abs(z) > 500 ||
            Math.abs(yaw) > Math.PI * 2 ||
            name.length > 80
        ) {
            throw new Error('Invalid player pose');
        }
        return { x, z, yaw, floor, active, name, ...(jumpHeight === 0 ? {} : { jumpHeight }) };
    },
};
function encodeOfficeGame(packet: OfficeGamePacket): Uint8Array<ArrayBuffer> {
    if (!Number.isInteger(packet.sequence) || packet.sequence < 0 || packet.sequence > 0xffffffff) {
        throw new Error('Invalid office sequence');
    }
    if (packet.op < 1 || packet.op > 8 || !Number.isInteger(packet.op)) {
        throw new Error('Invalid office opcode');
    }
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(packet.peer)) {
        throw new Error('Invalid office peer');
    }
    const w = new Writer();
    string.write(w, packet.peer);

    if (packet.op === OfficeGameOp.Player || packet.op === OfficeGameOp.Ready) {
        if (!packet.player) {
            throw new Error('Missing player pose');
        }
        player.write(w, packet.player);
    }
    if (packet.op === OfficeGameOp.Snapshot || packet.op === OfficeGameOp.Delta) {
        agents.write(w, packet.agents);
        projects.write(w, packet.projects);
        if (packet.op === OfficeGameOp.Delta) {
            ids.write(w, packet.removedAgents);
            ids.write(w, packet.removedProjects);
        }
    }
    const bytes = w.bytes.slice(0, w.offset),
        header = new DataView(bytes.buffer);
    header.setUint32(0, 0x504f474e, true); /** NGOP */
    header.setUint8(4, OFFICE_GAME_VERSION);
    header.setUint8(5, packet.op);
    header.setUint32(8, packet.sequence, true);
    header.setUint32(12, bytes.length - 16, true);
    return bytes;
}
function decodeOfficeGame(bytes: Uint8Array): OfficeGamePacket {
    if (bytes.byteLength < 16 || bytes.byteLength > OFFICE_GAME_LIMIT) {
        throw new Error('Invalid office frame size');
    }
    const r = new Reader(bytes),
        h = r.view;
    if (
        h.getUint32(0, true) !== 0x504f474e ||
        h.getUint8(4) !== OFFICE_GAME_VERSION ||
        h.getUint16(6, true) !== 0
    ) {
        throw new Error('Unsupported office protocol');
    }
    if (h.getUint32(12, true) !== bytes.length - 16) {
        throw new Error('Invalid office frame length');
    }
    const op = h.getUint8(5);
    if (op !== 1 && op !== 2 && op !== 3 && op !== 4 && op !== 5 && op !== 7 && op !== 8) {
        throw new Error('Unknown office opcode');
    }
    const peer = string.read(r);
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(peer)) {
        throw new Error('Invalid office peer');
    }
    const packet: { -readonly [K in keyof OfficeGamePacket]: OfficeGamePacket[K] } = {
        op,
        peer,
        sequence: h.getUint32(8, true),
        agents: [],
        projects: [],
        removedAgents: [],
        removedProjects: [],
    };

    if (op === OfficeGameOp.Player || op === OfficeGameOp.Ready) {
        packet.player = player.read(r);
    }
    if (op === OfficeGameOp.Snapshot || op === OfficeGameOp.Delta) {
        packet.agents = agents.read(r);
        packet.projects = projects.read(r);
        if (op === OfficeGameOp.Delta) {
            packet.removedAgents = ids.read(r);
            packet.removedProjects = ids.read(r);
        }
    }
    if (r.offset !== bytes.length) {
        throw new Error('Trailing office packet data');
    }
    return packet;
}

/** Bounded fixed-schema binary codec shared with the browser SDK. */
export class OfficeProtocol {
    /** Whether the frame belongs to this protocol. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.byteLength >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                0x504f474e
        );
    }
    /** Encode one complete packet. */
    public static encode(packet: OfficeGamePacket): Uint8Array<ArrayBuffer> {
        return encodeOfficeGame(packet);
    }
    /** Decode and validate a complete packet. */
    public static decode(bytes: Uint8Array): OfficeGamePacket {
        return decodeOfficeGame(bytes);
    }
    /** Construct an empty control packet. */
    public static control(
        op: OfficeGamePacket['op'],
        peer = 'server',
        sequence = 0,
    ): OfficeGamePacket {
        return {
            op,
            peer,
            sequence,
            agents: [],
            projects: [],
            removedAgents: [],
            removedProjects: [],
        };
    }
}
