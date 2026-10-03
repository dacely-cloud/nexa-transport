import { afterEach, expect, it, vi } from 'vitest';
import { CompanyChannel } from '../src/networking/CompanyChannel.js';
import { CompanyProtocol } from '../src/company/CompanyProtocol.js';
import { CompanyOp, type CompanyCommand } from '../src/company/CompanyTypes.js';

afterEach(() => vi.useRealTimers());
const command: CompanyCommand = {
    op: CompanyOp.Configure,
    id: 'durable-command',
    revision: 9n,
    name: 'Studio',
};

it('preserves exact command IDs and revisions and correlates binary responses', async () => {
    const channel = new CompanyChannel();
    const send = vi.fn<(bytes: Uint8Array<ArrayBuffer>) => void>();
    const response = channel.request(command, send);
    expect(CompanyProtocol.decode(send.mock.calls[0]?.[0] ?? new Uint8Array())).toEqual(command);
    await expect(channel.request(command, send)).rejects.toThrow('pending');
    const state = { revision: 10n, name: 'Studio', employees: [], departments: [], projects: [] };
    channel.receive({ op: CompanyOp.Snapshot, id: command.id, state });
    expect(await response).toEqual(state);
    expect(send).toHaveBeenCalledTimes(1);
});

it('releases failed and timed-out waits without automatically repeating a mutation', async () => {
    vi.useFakeTimers();
    const channel = new CompanyChannel();
    const send = vi.fn<(bytes: Uint8Array<ArrayBuffer>) => void>();
    const response = channel.request(command, send);
    const rejected = expect(response).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15001);
    await rejected;
    expect(send).toHaveBeenCalledTimes(1);
    const retry = channel.request(command, send);
    channel.close(new Error('Disconnected'));
    await expect(retry).rejects.toThrow('Disconnected');
    expect(vi.getTimerCount()).toBe(0);
    expect(CompanyProtocol.decode(send.mock.calls[1]?.[0] ?? new Uint8Array())).toEqual(command);
});
