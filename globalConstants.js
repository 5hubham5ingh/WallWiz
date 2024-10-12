import * as std from "std";
import * as os from "os";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";

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

/**
 * Represents a system-level error that extends the built-in Error class.
 * Provides a method to log the error in a formatted style.
 *
 * @class
 * @extends Error
 */
globalThis.SystemError = class SystemError extends Error {
  /**
   * Creates an instance of SystemError.
   *
   * @param {string} error - The error message describing the issue.
   * @param {string} [description] - Additional description about the error (optional).
   */
  constructor(error, description = "") {
    super(error);
    this.name = "SystemError";
    this.description = description;

    // Capture the stack trace (optional)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError);
    }
  }

  /**
   * Logs the error in a formatted style, using ANSI codes for styling.
   */
  log() {
    print(
      "\n",
      ansi.styles(["bold", "red"]),
      this.error,
      ":",
      ansi.style.reset,
      "\n",
      ansi.style.red,
      this.message,
      ansi.style.reset,
      "\n",
      cursorShow,
    );
  }
};
