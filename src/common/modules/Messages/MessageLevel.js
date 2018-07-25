/**
 * Specifies the message level to use,
 *
 * @readonly
 * @enum {int}
 * @default
 */
export const MESSAGE_LEVEL = Object.freeze({
    ERROR: Symbol("3 (error)"),
    WARN: Symbol("2 (warn)"),
    INFO: Symbol("1 (info)"),
    LOADING: Symbol("-2 (loading)"),
    SUCCESS: Symbol("-3 (success)"),
});
