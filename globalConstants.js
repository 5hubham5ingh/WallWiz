import * as std from "std";
import * as os from "os";
/**
 * @typedef {import('./types.d.ts').IOs} IOs
 * @typedef {import('./types.d.ts').IStd} IStd
 * @typedef {import('./types.d.ts').UserArguments} UserArguments
 */

/**
 * @type {IOs}
 */
globalThis.OS = os;

/**
 * @type {IStd}
 */
globalThis.STD = std;

/**
 * @type {string}
 */
globalThis.HOME_DIR = std.getenv("HOME");
