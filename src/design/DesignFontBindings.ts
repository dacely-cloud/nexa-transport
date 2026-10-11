// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignDocument, DesignText, DesignTextRun } from './DesignTypes.js';
import type { DesignFontBinding } from './DesignFontTypes.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import { DesignOperationKind, type DesignOperation } from './DesignOperationTypes.js';

/** The same saved face resolution applies to native shaping, browser pixels and export. */
export class DesignFontBindings {
    /** Includes transient inserted or edited faces so a later resize in the same transaction shapes the exact fonts. */
    public static styles(
        documents: readonly DesignDocument[],
        operations: readonly DesignOperation[] = [],
    ): readonly DesignTextSpanStyle[] {
        const result: DesignTextSpanStyle[] = [];
        const append: (text: DesignText | null | undefined) => void = (
            text: DesignText | null | undefined,
        ): void => {
            if (text == null) {
                return;
            }
            result.push(this.base(text, '#000000'));
            for (const run of text.runs) {
                result.push(this.run(text, run));
            }
        };
        for (const document of documents) {
            for (const node of document.nodes) {
                append(node.text);
            }
        }
        for (const operation of operations) {
            if (operation.op === DesignOperationKind.Insert) {
                append(operation.node.text);
            } else if (operation.op === DesignOperationKind.Update) {
                append(operation.changes.text);
            }
        }
        return result;
    }
    /** A rich run inherits only when its family and italic style agree with the base text. */
    public static resolve(
        text: DesignText,
        run: DesignTextRun | null = null,
    ): DesignFontBinding | null {
        if (run === null) {
            return text.font ?? null;
        }
        if (run.font !== undefined) {
            return run.font;
        }
        return run.family.toLowerCase() === text.family.toLowerCase() && run.italic === text.italic
            ? (text.font ?? null)
            : null;
    }
    /** Deterministic CSS names keep distinct files with the same display family separate. */
    public static family(family: string, binding: DesignFontBinding | null | undefined): string {
        return binding == null ? family : 'Nexa Design Font ' + binding.sha256;
    }
    /** The complete base style is shared by layout and private-face validation. */
    public static base(text: DesignText, color: string): DesignTextSpanStyle {
        return {
            rich: false,
            family: text.family,
            size: text.size,
            weight: text.weight,
            italic: text.italic,
            color,
            underline: false,
            ...(text.font === undefined ? {} : { font: text.font }),
        };
    }
    /** Explicit rich bindings override inheritance without rewriting the saved rich range. */
    public static run(text: DesignText, run: DesignTextRun): DesignTextSpanStyle {
        const font: DesignFontBinding | null = this.resolve(text, run);
        return {
            rich: true,
            family: run.family,
            size: run.size,
            weight: run.weight,
            italic: run.italic,
            color: run.color,
            underline: run.underline,
            ...(font === null && run.font === undefined ? {} : { font }),
        };
    }
}
