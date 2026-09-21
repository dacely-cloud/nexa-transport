/** Materializes lazy engine stack frames so saved errors do not retain their receivers. */
export function materializeError(error: Error): Error {
    error.stack = error.stack ?? `${error.name}: ${error.message}`;
    return error;
}
/** Preserves a rejection's type and identity while releasing lazy stack frame references. */
export function rethrow(error: unknown): never {
    if (error instanceof Error) {
        materializeError(error);
    }
    throw error;
}
