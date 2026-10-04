// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Public construction pieces use half-metre grid coordinates and quarter turns. */
export interface OfficePlacement {
    readonly id: number;
    readonly kind: 'wall' | 'window' | 'door' | 'plant' | 'sofa' | 'table' | 'team';
    readonly floor: number;
    readonly x: number;
    readonly z: number;
    readonly rotation: number;
}
/** Shared limits for durable owner edits and public geometry decoding. */
export class OfficeConstruction {
    /** Reject unbounded coordinates, unknown assets, and ambiguous identities. */
    public static validate(items: readonly OfficePlacement[]): void {
        if (items.length > 128) {
            throw new Error('An office can contain up to 128 construction pieces.');
        }
        const ids: Set<number> = new Set();
        for (const item of items) {
            if (
                !Number.isInteger(item.id) ||
                item.id < 0 ||
                item.id > 255 ||
                ids.has(item.id) ||
                !['wall', 'window', 'door', 'plant', 'sofa', 'table', 'team'].includes(item.kind) ||
                !Number.isInteger(item.floor) ||
                item.floor < 0 ||
                item.floor > 5 ||
                !Number.isInteger(item.x) ||
                Math.abs(item.x) > 128 ||
                !Number.isInteger(item.z) ||
                Math.abs(item.z) > 128 ||
                !Number.isInteger(item.rotation) ||
                item.rotation < 0 ||
                item.rotation > 3
            ) {
                throw new Error('Invalid office construction piece.');
            }
            ids.add(item.id);
        }
    }
}
/** Saved workstation coordinates on the half-metre grid, independent of execution state. */
export interface OfficeDeskPoint {
    readonly x: number;
    readonly z: number;
}
/** A placement names a public desk address, never an employee or account identifier. */
export interface OfficeDeskPlacement extends OfficeDeskPoint {
    readonly desk: number;
}
/** Shared bounded validation for owner edits and visual packets. */
export class OfficeDesks {
    /** Validate coordinates before allocation; desk addresses use stable 48-desk floors. */
    public static validate(items: readonly OfficeDeskPlacement[]): void {
        if (items.length > 256) {
            throw new Error('Too many desk positions.');
        }
        const used = new Set<number>();
        for (const item of items) {
            if (
                !Number.isInteger(item.desk) ||
                item.desk < 0 ||
                item.desk > 255 ||
                used.has(item.desk) ||
                !Number.isInteger(item.x) ||
                Math.abs(item.x) > 128 ||
                !Number.isInteger(item.z) ||
                Math.abs(item.z) > 128
            ) {
                throw new Error('Invalid desk position.');
            }
            used.add(item.desk);
        }
        for (let i = 0; i < items.length; i++) {
            const a = items[i];
            if (!a) {
                continue;
            }
            for (const b of items.slice(i + 1)) {
                if (
                    Math.floor(a.desk / 48) === Math.floor(b.desk / 48) &&
                    Math.abs(a.x - b.x) < 7 &&
                    Math.abs(a.z - b.z) < 7
                ) {
                    throw new Error('Leave space between desks and their chairs.');
                }
            }
        }
    }
    /** Definitions originate from owned company records, with no user-supplied metadata accepted. */
    public static metadata(point: OfficeDeskPoint | undefined): Readonly<Record<string, string>> {
        return point ? { officeDeskX: String(point.x), officeDeskZ: String(point.z) } : {};
    }
}
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
/** A stable, bounded cosmetic value; only the value is shared with visitors, never the identity text. */
export class OfficeAppearance {
    /** Derive permanent visual variation from an immutable employee identity, independent of tasks or desks. */
    public static seed(identity: string): number {
        let value = 2166136261;
        for (let i = 0; i < identity.length; i++) {
            value = Math.imul(value ^ identity.charCodeAt(i), 16777619) >>> 0;
        }
        return (value ^ (value >>> 16)) & 65535;
    }
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
    /** Saved visual desk address, independent of temporary execution IDs. */
    readonly desk?: number;
    /** Optional owner-positioned workstation on the half-metre grid. */
    readonly deskPosition?: OfficeDeskPoint;
    /** Public cosmetic seed, independent of saved desk and temporary run identifiers. */
    readonly appearance?: number;
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
/** Account-scoped scheduler state; slots are approved assignment concurrency, not hardware capacity. */
export interface OfficeExecution {
    readonly running: number;
    readonly ready: number;
    readonly waiting: number;
    readonly blocked: number;
    readonly slots: number;
    readonly paused: boolean;
    readonly phase:
        | 'draft'
        | 'planning'
        | 'plan-review'
        | 'running'
        | 'delivery-review'
        | 'accepted'
        | 'blocked';
}
/** OfficeProject in the fixed-schema office protocol. */
export interface OfficeProject {
    readonly id: string;
    readonly owner: string;
    readonly sessionId?: string;
    readonly goal: string;
    readonly execution?: OfficeExecution;
    readonly showcase?: OfficeShowcase;
    readonly declaredItemCount?: number;
    readonly state: 'running' | 'ended' | 'interrupted';
    readonly items: readonly OfficeWorkItem[];
    readonly agents: readonly OfficeAssignment[];
    readonly outcome?: { done: number; failed: number; skipped: number; stoppedBy: string };
    readonly steering?: { round: number; summary: string };
}
/** Owner-published labels of an accepted product; no private work or file references. */
export interface OfficeShowcase {
    readonly name: string;
    readonly description: string;
}
/** OfficeReactionReason in the fixed-schema office protocol. */
export type OfficeReactionReason = 'error' | 'feedback' | 'self-correction' | 'accepted';
/** OfficeReaction in the fixed-schema office protocol. */
export interface OfficeReaction {
    readonly id: string;
    readonly startedAt: bigint;
    readonly expiresAt: bigint;
    readonly reason: OfficeReactionReason;
    readonly phrase: 'FUCK!' | 'WTF?!' | 'WHAT IS THIS SHIT?!' | 'WE DID IT!';
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
export const OFFICE_GAME_VERSION = 9;
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
    readonly construction?: readonly OfficePlacement[];
    readonly agents: readonly OfficeAgent[];
    readonly projects: readonly OfficeProject[];
}
/** OfficeGamePacket in the fixed-schema office protocol. */
export interface OfficeGamePacket extends OfficeGameState {
    /** Present for an older peer; absent means the current protocol. */
    readonly version?: 2 | 3 | 4 | 5 | 6 | 7 | 8;
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
    reason: enumeration(['error', 'feedback', 'self-correction', 'accepted']),
    phrase: enumeration(['FUCK!', 'WTF?!', 'WHAT IS THIS SHIT?!', 'WE DID IT!']),
});
const agent = record<Omit<OfficeAgent, 'desk' | 'appearance' | 'deskPosition'>>({
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
const project = record<Omit<OfficeProject, 'execution' | 'showcase'>>({
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
const executionCount: Codec<number> = {
    write(w, value) {
        if (!Number.isInteger(value) || value < 0 || value > 128) {
            throw new Error('Invalid office execution count');
        }
        w.u8(value);
    },
    read(r) {
        const value = r.u8();
        if (value > 128) {
            throw new Error('Invalid office execution count');
        }
        return value;
    },
};
const execution = optional(
    record<OfficeExecution>({
        running: executionCount,
        ready: executionCount,
        waiting: executionCount,
        blocked: executionCount,
        slots: executionCount,
        paused: boolean,
        phase: enumeration([
            'draft',
            'planning',
            'plan-review',
            'running',
            'delivery-review',
            'accepted',
            'blocked',
        ]),
    }),
);
const executionProjects = list<OfficeProject>({
    write(w, value) {
        project.write(w, value);
        execution.write(w, value.execution);
    },
    read(r) {
        const value = project.read(r),
            status = execution.read(r);
        return status === undefined ? value : { ...value, execution: status };
    },
});
const showcasedProjects = list<OfficeProject>({
    write(w, value) {
        project.write(w, value);
        execution.write(w, value.execution);
        w.u8(value.showcase ? 1 : 0);
        if (value.showcase) {
            if (
                value.execution?.phase !== 'accepted' ||
                !value.showcase.name ||
                value.showcase.name.length > 64 ||
                value.showcase.description.length > 280
            ) {
                throw new Error('Invalid office showcase');
            }
            string.write(w, value.showcase.name);
            string.write(w, value.showcase.description);
        }
    },
    read(r) {
        const value = project.read(r),
            status = execution.read(r),
            present = r.u8();
        if (present > 1) {
            throw new Error('Invalid office showcase presence');
        }
        const showcase = present
            ? { name: string.read(r), description: string.read(r) }
            : undefined;
        if (
            showcase &&
            (status?.phase !== 'accepted' ||
                !showcase.name ||
                showcase.name.length > 64 ||
                showcase.description.length > 280)
        ) {
            throw new Error('Invalid office showcase');
        }
        return {
            ...value,
            ...(status ? { execution: status } : {}),
            ...(showcase ? { showcase } : {}),
        };
    },
});
const desk: Codec<number | undefined> = optional({
    write(w, value) {
        if (!Number.isInteger(value) || value < 0 || value > 255) {
            throw new Error('Invalid office desk');
        }
        number.write(w, value);
    },
    read(r) {
        const value = number.read(r);
        if (!Number.isInteger(value) || value < 0 || value > 255) {
            throw new Error('Invalid office desk');
        }
        return value;
    },
});
const assignedAgent: Codec<OfficeAgent> = {
    write(w, value) {
        agent.write(w, value);
        desk.write(w, value.desk);
    },
    read(r) {
        const value = agent.read(r),
            address = desk.read(r);
        return address === undefined ? value : { ...value, desk: address };
    },
};
const appearance: Codec<number | undefined> = optional({
    write(w, value) {
        if (!Number.isInteger(value) || value < 0 || value > 65535) {
            throw new Error('Invalid office appearance');
        }
        w.u32(value);
    },
    read(r) {
        const value = r.u32();
        if (value > 65535) {
            throw new Error('Invalid office appearance');
        }
        return value;
    },
});
const dressedAgent: Codec<OfficeAgent> = {
    write(w, value) {
        assignedAgent.write(w, value);
        appearance.write(w, value.appearance);
    },
    read(r) {
        const value = assignedAgent.read(r),
            seed = appearance.read(r);
        return seed === undefined ? value : { ...value, appearance: seed };
    },
};
const dressedAgents = list(dressedAgent);
const positionedAgents = list<OfficeAgent>({
    write(w, value) {
        dressedAgent.write(w, value);
        w.u8(value.deskPosition ? 1 : 0);
        if (value.deskPosition) {
            OfficeDesks.validate([{ desk: value.desk ?? 0, ...value.deskPosition }]);
            w.number(value.deskPosition.x);
            w.number(value.deskPosition.z);
        }
    },
    read(r) {
        const value = dressedAgent.read(r),
            flag = r.u8();
        if (flag > 1) {
            throw new Error('Invalid desk position flag');
        }
        if (!flag) {
            return value;
        }
        const deskPosition = { x: r.number(), z: r.number() };
        OfficeDesks.validate([{ desk: value.desk ?? 0, ...deskPosition }]);
        return { ...value, deskPosition };
    },
});
const assignedAgents = list(assignedAgent);
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
function encodeOfficeGame(
    packet: OfficeGamePacket,
    version: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
): Uint8Array<ArrayBuffer> {
    if (
        version !== 2 &&
        version !== 3 &&
        version !== 4 &&
        version !== 5 &&
        version !== 6 &&
        version !== 7 &&
        version !== 8 &&
        version !== 9
    ) {
        throw new Error('Unsupported office protocol');
    }
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
        (version >= 8
            ? positionedAgents
            : version >= 7
              ? dressedAgents
              : version >= 4
                ? assignedAgents
                : agents
        ).write(
            w,
            version === 2
                ? packet.agents.map((agent) => {
                      if (
                          agent.reaction?.reason !== 'accepted' &&
                          agent.reaction?.phrase !== 'WE DID IT!'
                      ) {
                          return agent;
                      }
                      const { reaction: _reaction, ...visible } = agent;
                      return visible;
                  })
                : packet.agents,
        );
        (version >= 9 ? showcasedProjects : version >= 6 ? executionProjects : projects).write(
            w,
            packet.projects,
        );
        if (version >= 5 && packet.op === OfficeGameOp.Snapshot) {
            const items = packet.construction ?? [];
            OfficeConstruction.validate(items);
            w.u32(items.length);
            for (const item of items) {
                w.u8(item.id);
                string.write(w, item.kind);
                w.u8(item.floor);
                w.number(item.x);
                w.number(item.z);
                w.u8(item.rotation);
            }
        }
        if (packet.op === OfficeGameOp.Delta) {
            ids.write(w, packet.removedAgents);
            ids.write(w, packet.removedProjects);
        }
    }
    const bytes = w.bytes.slice(0, w.offset),
        header = new DataView(bytes.buffer);
    header.setUint32(0, 0x504f474e, true); /** NGOP */
    header.setUint8(4, version);
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
        (h.getUint8(4) !== OFFICE_GAME_VERSION &&
            h.getUint8(4) !== 8 &&
            h.getUint8(4) !== 7 &&
            h.getUint8(4) !== 6 &&
            h.getUint8(4) !== 5 &&
            h.getUint8(4) !== 4 &&
            h.getUint8(4) !== 3 &&
            h.getUint8(4) !== 2) ||
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
        ...(h.getUint8(4) < 9 ? { version: h.getUint8(4) as 2 | 3 | 4 | 5 | 6 | 7 | 8 } : {}),
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
        packet.agents = (
            h.getUint8(4) >= 8
                ? positionedAgents
                : h.getUint8(4) >= 7
                  ? dressedAgents
                  : h.getUint8(4) >= 4
                    ? assignedAgents
                    : agents
        ).read(r);
        if (
            packet.version === 2 &&
            packet.agents.some(
                (agent) =>
                    agent.reaction?.reason === 'accepted' ||
                    agent.reaction?.phrase === 'WE DID IT!',
            )
        ) {
            throw new Error('Celebrations require office protocol v3');
        }
        packet.projects = (
            h.getUint8(4) >= 9
                ? showcasedProjects
                : h.getUint8(4) >= 6
                  ? executionProjects
                  : projects
        ).read(r);
        if (h.getUint8(4) >= 5 && op === OfficeGameOp.Snapshot) {
            const count: number = r.u32();
            if (count > 128) {
                throw new Error('Too many construction pieces');
            }
            const items: OfficePlacement[] = [];
            for (let i = 0; i < count; i++) {
                items.push({
                    id: r.u8(),
                    kind: string.read(r) as OfficePlacement['kind'],
                    floor: r.u8(),
                    x: r.number(),
                    z: r.number(),
                    rotation: r.u8(),
                });
            }
            OfficeConstruction.validate(items);
            packet.construction = items;
        }
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
    public static encode(
        packet: OfficeGamePacket,
        version: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 = packet.version ?? OFFICE_GAME_VERSION,
    ): Uint8Array<ArrayBuffer> {
        return encodeOfficeGame(packet, version);
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

/** Private layout commands use OLAY frames on the existing authenticated socket. */
export interface OfficeLayoutState {
    readonly revision: bigint;
    readonly pieces: readonly OfficePlacement[];
    /** Omitted by legacy geometry-only clients; an empty list restores automatic placement. */
    readonly desks?: readonly OfficeDeskPlacement[];
}
/** Read=1, save=2, snapshot=3, error=4. No account ID is accepted from the client. */
export interface OfficeLayoutPacket extends OfficeLayoutState {
    readonly op: 1 | 2 | 3 | 4;
    readonly id: number;
    readonly message?: string;
}
/** Bounded binary geometry codec shared by gateway and browser. */
export class OfficeLayoutProtocol {
    /** Recognize the independent layout discriminator. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0) ===
                0x4f4c4159
        );
    }
    /** Encode half-metre coordinates without JSON or private agent content. */
    public static encode(
        packet: OfficeLayoutPacket,
        version: 1 | 2 = packet.desks === undefined ? 1 : 2,
    ): Uint8Array<ArrayBuffer> {
        OfficeConstruction.validate(packet.pieces);
        const desks: readonly OfficeDeskPlacement[] = version === 2 ? (packet.desks ?? []) : [];
        OfficeDesks.validate(desks);
        if (
            !Number.isInteger(packet.id) ||
            packet.id < 0 ||
            packet.id > 0xffffffff ||
            packet.revision < 0n ||
            packet.revision > 0xffffffffffffffffn
        ) {
            throw new Error('Invalid layout identity');
        }
        const message = new TextEncoder().encode(packet.message ?? '');
        if (
            message.length > 512 ||
            (packet.op !== 4 && message.length) ||
            ![1, 2, 3, 4].includes(packet.op) ||
            ((packet.op === 1 || packet.op === 4) && (packet.pieces.length || desks.length))
        ) {
            throw new Error('Invalid layout payload');
        }
        const header: number = version === 2 ? 22 : 20;
        const bytes = new Uint8Array(
            header + packet.pieces.length * 8 + desks.length * 5 + message.length,
        );
        const view = new DataView(bytes.buffer);
        view.setUint32(0, 0x4f4c4159);
        view.setUint8(4, version);
        view.setUint8(5, packet.op);
        view.setUint32(6, packet.id);
        view.setBigUint64(10, packet.revision);
        view.setUint16(18, packet.op === 4 ? message.length : packet.pieces.length);
        if (version === 2) {
            view.setUint16(20, desks.length);
        }
        const kinds = ['wall', 'window', 'door', 'plant', 'sofa', 'table', 'team'];
        packet.pieces.forEach((piece, index) => {
            const offset = header + index * 8;
            view.setUint8(offset, piece.id);
            view.setUint8(offset + 1, kinds.indexOf(piece.kind));
            view.setUint8(offset + 2, piece.floor);
            view.setUint8(offset + 3, piece.rotation);
            view.setInt16(offset + 4, piece.x);
            view.setInt16(offset + 6, piece.z);
        });
        desks.forEach((desk, index) => {
            const offset: number = header + packet.pieces.length * 8 + index * 5;
            view.setUint8(offset, desk.desk);
            view.setInt16(offset + 1, desk.x);
            view.setInt16(offset + 3, desk.z);
        });
        if (packet.op === 4) {
            bytes.set(message, header);
        }
        return bytes;
    }
    /** Reject unknown versions, opcodes, trailing bytes and oversized input before allocation. */
    public static decode(bytes: Uint8Array): OfficeLayoutPacket {
        if (
            !this.isFrame(bytes) ||
            bytes.length < 20 ||
            bytes.length > 2326 ||
            (bytes[4] !== 1 && bytes[4] !== 2)
        ) {
            throw new Error('Invalid layout frame');
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const op = view.getUint8(5);
        const header: number = bytes[4] === 2 ? 22 : 20;
        if (bytes.length < header) {
            throw new Error('Invalid layout header');
        }
        const count = view.getUint16(18);
        const deskCount: number = header === 22 ? view.getUint16(20) : 0;
        if (op !== 1 && op !== 2 && op !== 3 && op !== 4) {
            throw new Error('Invalid layout operation');
        }
        if (
            (op === 1 && count !== 0) ||
            count > (op === 4 ? 512 : 128) ||
            deskCount > 256 ||
            ((op === 1 || op === 4) && deskCount !== 0) ||
            bytes.length !== header + count * (op === 4 ? 1 : 8) + deskCount * 5
        ) {
            throw new Error('Invalid layout length');
        }
        const pieces: OfficePlacement[] = [];
        const kinds: readonly OfficePlacement['kind'][] = [
            'wall',
            'window',
            'door',
            'plant',
            'sofa',
            'table',
            'team',
        ];
        if (op !== 4) {
            for (let index = 0; index < count; index++) {
                const offset = header + index * 8;
                const kind = kinds[view.getUint8(offset + 1)];
                if (!kind) {
                    throw new Error('Invalid layout asset');
                }
                pieces.push({
                    id: view.getUint8(offset),
                    kind,
                    floor: view.getUint8(offset + 2),
                    rotation: view.getUint8(offset + 3),
                    x: view.getInt16(offset + 4),
                    z: view.getInt16(offset + 6),
                });
            }
        }
        OfficeConstruction.validate(pieces);
        const desks: OfficeDeskPlacement[] = [];
        for (let index: number = 0; index < deskCount; index++) {
            const offset: number = header + count * 8 + index * 5;
            desks.push({
                desk: view.getUint8(offset),
                x: view.getInt16(offset + 1),
                z: view.getInt16(offset + 3),
            });
        }
        OfficeDesks.validate(desks);
        return {
            op,
            id: view.getUint32(6),
            revision: view.getBigUint64(10),
            pieces,
            ...(header === 22 ? { desks } : {}),
            ...(op === 4
                ? {
                      message: new TextDecoder('utf-8', { fatal: true }).decode(
                          bytes.subarray(header),
                      ),
                  }
                : {}),
        };
    }
}
