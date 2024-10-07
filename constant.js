import * as std from 'std'
/**
 * @typedef {import("./types.ts").IStd} IStd
 * */

/**
 * @type {IStd}
 */
const std = std;

export const HOME_DIR = std.getenv("HOME")
