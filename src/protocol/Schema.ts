/** JSON Schema subset emitted from Nexa's TypeScript contracts. */
export interface Schema {
    readonly $ref?: string;
    readonly type?: string | readonly string[];
    readonly const?: string | number | boolean | null;
    readonly enum?: readonly (string | number | boolean | null)[];
    readonly anyOf?: readonly Schema[];
    readonly allOf?: readonly Schema[];
    readonly properties?: Readonly<Record<string, Schema>>;
    readonly required?: readonly string[];
    readonly items?: Schema;
    readonly additionalProperties?: boolean | Schema;
    readonly definitions?: Readonly<Record<string, Schema>>;
    readonly description?: string;
    readonly minimum?: number;
    readonly maximum?: number;
    readonly $id?: string;
    readonly $schema?: string;
}

/** Mutually exclusive required string tags select one complete union branch. */
interface DiscriminatedSchema {
    readonly key: string;
    readonly branches: ReadonlyMap<string, Schema>;
}
/** Validates JSON contracts without runtime code generation, suitable for browser CSPs. */
export class SchemaValidator {
    /** Owns a schema snapshot independent of the running Nexa installation. */
    readonly #root: Schema;
    readonly #resolved: Map<string, Schema | undefined> = new Map();
    readonly #unions: WeakMap<Schema, DiscriminatedSchema | null> = new WeakMap();
    public constructor(root: Schema) {
        this.#root = root;
    }
    /** Validates an untrusted payload at an emitted schema location. */
    public validate(path: string, value: unknown): boolean {
        const schema: Schema | undefined = this.#resolve(path);
        return schema !== undefined && this.#check(schema, value, 0);
    }
    #resolve(path: string): Schema | undefined {
        if (this.#resolved.has(path)) return this.#resolved.get(path);
        const parts: string[] = path.replace(/^.*#\//, '').split('/');
        let schema: Schema | undefined = this.#root;
        for (let i: number = 0; i < parts.length; i += 2) {
            const key: string | undefined = parts[i + 1];
            if (key === undefined) {
                return undefined;
            }
            const decoded: string = decodeURIComponent(key)
                .replaceAll('~1', '/')
                .replaceAll('~0', '~');
            if (parts[i] === 'definitions') {
                schema = schema?.definitions?.[decoded];
            } else if (parts[i] === 'properties') {
                schema = schema?.properties?.[decoded];
            } else {
                return undefined;
            }
        }
        if (schema !== undefined && this.#resolved.size < 4096) this.#resolved.set(path, schema);
        return schema;
    }

    /** Index only branches whose required, distinct constants prove all other branches impossible. */
    #discriminator(schema: Schema): DiscriminatedSchema | null {
        const cached: DiscriminatedSchema | null | undefined = this.#unions.get(schema);
        if (cached !== undefined) return cached;
        this.#unions.set(schema, null);
        const alternatives: readonly Schema[] | undefined = schema.anyOf;
        if (alternatives === undefined || alternatives.length < 2) return null;
        const resolved: Schema[] = [];
        for (const alternative of alternatives) {
            let branch: Schema | undefined = alternative;
            for (let depth: number = 0; branch?.$ref !== undefined && depth <= 256; depth++) {
                branch = this.#resolve(branch.$ref);
            }
            if (branch === undefined || branch.$ref !== undefined) return null;
            resolved.push(branch);
        }
        const first: Schema | undefined = resolved[0];
        for (const key of first?.required ?? []) {
            const branches: Map<string, Schema> = new Map();
            for (let index: number = 0; index < resolved.length; index++) {
                const branch: Schema | undefined = resolved[index];
                const original: Schema | undefined = alternatives[index];
                const tag: Schema | undefined = branch?.properties?.[key];
                if (
                    !branch?.required?.includes(key) ||
                    typeof tag?.const !== 'string' ||
                    branches.has(tag.const) ||
                    original === undefined
                )
                    break;
                branches.set(tag.const, original);
            }
            if (branches.size === alternatives.length) {
                const discriminator: DiscriminatedSchema = { key, branches };
                this.#unions.set(schema, discriminator);
                return discriminator;
            }
        }
        return null;
    }
    #check(schema: Schema, value: unknown, depth: number): boolean {
        // This counts schema references and union branches as well as data nesting. A valid
        // 32-level workflow configuration traverses more than 128 schema nodes. Keep a finite
        // stack budget with room for its enclosing method/patch/node schemas.
        if (depth > 256) {
            return false;
        }
        if (schema.$ref !== undefined) {
            const resolved: Schema | undefined = this.#resolve(schema.$ref);
            return resolved !== undefined && this.#check(resolved, value, depth + 1);
        }
        if ('const' in schema && value !== schema.const) {
            return false;
        }
        if (
            schema.enum !== undefined &&
            !schema.enum.some((item: string | number | boolean | null): boolean => value === item)
        ) {
            return false;
        }
        if (schema.anyOf !== undefined) {
            const discriminator: DiscriminatedSchema | null = this.#discriminator(schema);
            if (discriminator !== null && isRecord(value)) {
                const tag: unknown = value[discriminator.key];
                const branch: Schema | undefined =
                    typeof tag === 'string' ? discriminator.branches.get(tag) : undefined;
                if (branch === undefined || !this.#check(branch, value, depth + 1)) return false;
            } else if (
                !schema.anyOf.some((item: Schema): boolean => this.#check(item, value, depth + 1))
            ) {
                return false;
            }
        }
        if (
            schema.allOf !== undefined &&
            !schema.allOf.every((item: Schema): boolean => this.#check(item, value, depth + 1))
        ) {
            return false;
        }
        if (Array.isArray(schema.type)) {
            if (!schema.type.some((item: string): boolean => this.#matchesType(item, value))) {
                return false;
            }
        } else if (typeof schema.type === 'string' && !this.#matchesType(schema.type, value)) {
            return false;
        }
        if (
            typeof value === 'number' &&
            ((schema.minimum !== undefined && value < schema.minimum) ||
                (schema.maximum !== undefined && value > schema.maximum))
        ) {
            return false;
        }
        if (Array.isArray(value) && schema.items !== undefined) {
            for (const item of value) {
                if (!this.#check(schema.items, item, depth + 1)) {
                    return false;
                }
            }
        }
        if (isRecord(value)) {
            for (const key of schema.required ?? []) {
                if (!Object.hasOwn(value, key)) {
                    return false;
                }
            }
            for (const key of Object.keys(value)) {
                const property: Schema | undefined =
                    schema.properties !== undefined && Object.hasOwn(schema.properties, key)
                        ? schema.properties[key]
                        : undefined;
                if (property !== undefined && !this.#check(property, value[key], depth + 1)) {
                    return false;
                }
                if (property === undefined) {
                    if (schema.additionalProperties === false) {
                        return false;
                    }
                    if (
                        typeof schema.additionalProperties === 'object' &&
                        !this.#check(schema.additionalProperties, value[key], depth + 1)
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    #matchesType(type: string, value: unknown): boolean {
        switch (type) {
            case 'null':
                return value === null;
            case 'object':
                return isRecord(value);
            case 'array':
                return Array.isArray(value);
            case 'number':
                return (
                    typeof value === 'number' &&
                    Number.isFinite(value) &&
                    (!Number.isInteger(value) || Number.isSafeInteger(value))
                );
            case 'integer':
                return typeof value === 'number' && Number.isSafeInteger(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'string':
                return typeof value === 'string';
            default:
                return false;
        }
    }
}
/** Narrows objects only at the schema trust boundary. */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
