// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { resolveBridgeInput, type ToolCallInput } from '../src/toolsearch/BridgeInput.js';

it('shares the executed native bridge resolver without server runtime imports', async (): Promise<void> => {
    const native: string = await readFile(
        new URL('../../nexa/src/toolsearch/BridgeInput.ts', import.meta.url),
        'utf8',
    );
    const sdk: string = await readFile(
        new URL('../src/toolsearch/BridgeInput.ts', import.meta.url),
        'utf8',
    );
    expect(sdk).toBe(native.replace("'../providers/Types'", "'../protocol/Protocol.js'"));
});

it('retains target names and arguments through supported redundant envelopes', (): void => {
    const leaf: ToolCallInput = {
        name: 'design_text_fit',
        arguments: { id: 'layout', revision: '24', offset: 96, limit: 32 },
    };
    expect(
        resolveBridgeInput({
            name: 'tool_call',
            arguments: { name: 'tool_call', arguments: { ...leaf } },
        }),
    ).toEqual(leaf);
    expect(
        resolveBridgeInput({
            name: 'tool_call',
            arguments: { name: 'design_create', arguments: { name: 'A document named tool_call' } },
        }),
    ).toEqual({ name: 'design_create', arguments: { name: 'A document named tool_call' } });
    expect(
        resolveBridgeInput({ name: 'tool_call', arguments: { name: 'design_read', id: 'layout' } }),
    ).toEqual({ name: 'design_read', arguments: { id: 'layout' } });
});

it('rejects ambiguous, incomplete and over-depth envelopes', (): void => {
    expect(
        resolveBridgeInput({
            name: 'tool_call',
            arguments: { name: 'design_read', arguments: {}, id: 'layout' },
        }),
    ).toBeNull();
    expect(resolveBridgeInput({ name: 'tool_call', arguments: { id: 'layout' } })).toBeNull();
    let input: ToolCallInput = { name: 'design_read', arguments: { id: 'layout' } };
    for (let depth: number = 0; depth < 10; depth++) {
        input = { name: 'tool_call', arguments: { ...input } };
    }
    expect(resolveBridgeInput(input)).toBeNull();
});
