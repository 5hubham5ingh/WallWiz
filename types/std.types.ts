/** @format */
// @ts-check
// @ts-ignore
import * as std from 'std';

/*
  The std module provides wrappers to the libc stdlib.h and stdio.h and a few other utilities
 */

/**
 * Exit the process
 *
 * @param {number} exitCode
 */
export const exit = /** @type {(exitCode: number) => void}*/ (std.exit);

/**
 * @typedef {Object} EvalScriptOptions
 * @property {boolean} [backtrace_barrier=false] - if true, error backtraces do not list the stack frames
 *                                                 below the evalScript (default = false)
 * @property {boolean} [async=false] - if true, await is accepted in the script and a promise is returned (default = false)
 */

/**
 * Evaluate the string "str" as a script (global eval)
 *
 * @param {string} str
 * @param {EvalScriptOptions} [options]
 *
 * @returns {any | Promise<any>}
 */
export const evalScript =
  /** @type {(str: string, options?: EvalScriptOptions) => any | Promise<any>} */ (
    std.evalScript
  );

/**
 * Evaluate the file "filename" as a script (global eval)
 *
 * @param {string} filename
 *
 * @returns {any}
 */
export const loadScript = /** @type {(filename: string) => any} */ (
  std.loadScript
);

/**
 * Load the file "filename" and return it as a string assuming UTF-8 encoding
 *
 * @param {string} filename
 *
 * @returns {string | null} file content or null in case of I/O error
 */
export const loadFile = /** @type {(filename: string) => string | null} */ (
  std.loadFile
);

/**
 * @typedef {Object} StdFile
 * @property {() => number} close - close the file. Return 0 if OK or -errno in case of I/O error
 * @property {(str: string) => void} puts - outputs the string "str" with the UTF-8 encoding
 * @property {(fmt: string, ...args: string[]) => number} printf - formatted printf. The same formats as the standard C library
 *                                                                 printf are supported
 * @property {() => void} flush - Flush the buffered file
 * @property {(offset: number, whence: number) => number} seek - seek to a given file position ("whence" is std.SEEK_*).
 *                                                               Return 0 if OK or -errno in case of I/O error
 * @property {() => number} tell - return the current file position
 * @property {() => number} tello - return the current file position as a bigint
 * @property {() => boolean} eof - return true if end of file
 * @property {() => number} fileno - return the associated OS handle
 * @property {() => boolean} error - return true if there was an error
 * @property {() => void} clearerr - clear the error indication
 * @property {(buffer: ArrayBuffer, position: number,
 *             length: number) => number} read - read "length" bytes from the file to the ArrayBuffer "buffer"
 *                                               at byte position "position" (wrapper to the libc fread)
 * @property {(buffer: ArrayBuffer, position: number,
 *             length: number) => number} write - write "length" bytes to the file from the ArrayBuffer "buffer"
 *                                                at byte position "position" (wrapper to the libc fwrite)
 * @property {() => string | null} getline - return the next line from the file, assuming UTF-8 encoding, excluding the trailing line feed.
 *                                           Return null if the end of file is reached
 * @property {(max_size?: number) => string} readAsString - read "max_size" bytes from the file and return them as a string assuming UTF-8 encoding.
 *                                                          If "max_size" is not present, the file is read entirely
 * @property {() => number} getByte - return the next byte from the file. Return -1 if the end of file is reached
 * @property {(c: number) => number} putByte - write one byte to the file
 */

/*
  Constants for seek()
 */

/** @type {number} */
export const SEEK_CUR = std.SEEK_CUR;

/** @type {number} */
export const SEEK_END = std.SEEK_END;

/** @type {number} */
export const SEEK_SET = std.SEEK_SET;

/**
 * Open a file (wrapper to the libc fopen())
 *
 * @param {string} filename
 * @param {string} flags - ex: "r" for read, "w" for write ...
 * @param {{errno: number}} [errorObj] - if defined, set its "errno" property to the error code or to 0 if no error occured
 *
 * @returns {StdFile | null} FILE object or null in case of I/O error
 */
export const open =
  /** @type {(filename: string, flags: string, errorObj?: {errno: number}) => StdFile | null} */ (
    std.open
  );

/**
 * Open a process by creating a pipe (wrapper to the libc popen())
 *
 * @param {string} command
 * @param {string} flags - ex: "r" for read, "w" for write ...
 * @param {{errno: number}} [errorObj] - if defined, set its "errno" property to the error code or to 0 if no error occured
 *
 * @returns {StdFile | null} FILE object or null in case of I/O error
 */
export const popen =
  /** @type {(command: string, flags: string, errorObj?: {errno: number}) => StdFile | null} */ (
    std.popen
  );

/**
 * Open a file from a file handle (wrapper to the libc fdopen())
 *
 * @param {number} fd
 * @param {string} flags - ex: "r" for read, "w" for write ...
 * @param {{errno: number}} [errorObj] - if defined, set its "errno" property to the error code or to 0 if no error occured
 *
 * @returns {StdFile | null} FILE object or null in case of I/O error
 */
export const fdopen =
  /** @type {(fd: number, flags: string, errorObj?: {errno: number}) => StdFile | null} */ (
    std.fdopen
  );

/**
 * Open a temporary file
 *
 * @param {number} fd
 * @param {string} flags - ex: "r" for read, "w" for write ...
 * @param {{errno: number}} [errorObj] - if defined, set its "errno" property to the error code or to 0 if no error occured
 *
 * @returns {StdFile | null} FILE object or null in case of I/O error
 */
export const tmpfile =
  /** @type {(errorObj?: {errno: number}) => StdFile | null} */ (std.tmpfile);

/**
 * Outputs the string "str" with the UTF-8 encoding.
 * Equivalent to std.out.puts(str)
 *
 * @param {string} str
 */
export const puts = /** @type {(str: string) => void} */ (std.puts);

/**
 * Formatted printf.
 * The same formats as the standard C library printf are supported.
 * Equivalent to std.out.printf(fmt, ...args)
 *
 * @param {string} fmt
 * @param {...string} args
 *
 * @returns {number}
 */
export const printf =
  /** @type {(fmt: string, ...args: string[]) => number} */ (std.printf);

/**
 * Equivalent to the libc sprintf()
 *
 * @param {string} fmt
 * @param {...string} args
 *
 * @returns {string}
 */
export const sprintf =
  /** @type {(fmt: string, ...args: string[]) => string} */ (std.sprintf);

/**
 * Wrappers to the libc file stdin
 */
const _in = /** @type {StdFile} */ (std.in);
/**
 * Wrappers to the libc file stdout
 */
const _out = /** @type {StdFile} */ (std.out);
/**
 * Wrappers to the libc file stderr
 */
const _err = /** @type {StdFile} */ (std.err);
export { _in as in, _out as out, _err as err };

/**
 * Enumeration object containing the integer value of common errors
 *
 * @readonly
 * @enum {number}
 */
export const Error = {
  EACCES: std.Error.EACCES,
  EBADF: std.Error.EBADF,
  EBUSY: std.Error.EBUSY,
  EEXIST: std.Error.EEXIST,
  EINTR: std.Error.EINTR,
  EINVAL: std.Error.EINVAL,
  EIO: std.Error.EIO,
  ENOENT: std.Error.ENOENT,
  ENOLCK: std.Error.ENOLCK,
  ENOSPC: std.Error.ENOSPC,
  ENOSYS: std.Error.ENOSYS,
  EPERM: std.Error.EPERM,
  EPIPE: std.Error.EPIPE,
  EWOULDBLOCK: std.Error.EWOULDBLOCK,
};

/**
 * Return a string that describes the error "errno"
 *
 * @param {number} errno
 *
 * @returns {string}
 */
export const strerror = /** @type {(errno: number) => string} */ (std.strerror);

/**
 * Manually invoke the cycle removal algorithm.
 * The cycle removal algorithm is automatically started when needed,
 * so this function is useful in case of specific memory constraints
 * or for testing
 */
export const gc = /** @type {() => void} */ (std.gc);

/**
 * Return the value of the environment variable "name" or undefined if it is not defined
 *
 * @param {string} name
 *
 * @returns {string | undefined}
 */
export const getenv = /** @type {(name: string) => string | undefined} */ (
  std.getenv
);

/**
 * Set the value of the environment variable "name" to the string "value"
 *
 * @param {string} name
 * @param {string} value
 */
export const setenv = /** @type {(name: string, value: string) => void} */ (
  std.setenv
);

/**
 * Delete the environment variable "name"
 *
 * @param {string} name
 */
export const unsetenv = /** @type {(name: string) => void} */ (std.unsetenv);

/**
 * Return an object containing the environment variables as key-value pairs
 *
 * @returns {Record<string, string>}
 */
export const getenviron = /** @type {() => Record<string, string>} */ (
  std.getenviron
);

/**
 * @typedef {Object} UrlGetOptions
 * @property {boolean} [binary=false] - if true, the response is an ArrayBuffer instead of a string. When a string is returned,
 *                                      the data is assumed to be UTF-8 encoded (default = false)
 * @property {boolean} [full=false] - if true, the response is a UrlGetResponse object. Response is null is case of protocol or network error.
 *                                    If false, the response is a string (response content), if the status is between 200 and 299, null otherwise.
 */

/**
 * @typedef {Object} UrlGetResponse
 * @property {string | ArrayBuffer | null} response - response content
 * @property {string} responseHeaders - headers separated by CRLF
 * @property {number} status - status code
 */

/**
 * Return the value of the environment variable "name" or undefined if it is not defined
 *
 * @param {string} url
 * @param {UrlGetOptions} [options]
 *
 * @returns {string | ArrayBuffer | UrlGetResponse | null}
 */
export const urlGet =
  /** @type {(url: string, options?: UrlGetOptions) => string | ArrayBuffer | UrlGetResponse | null} */ (
    std.urlGet
  );

/**
 * Parse "str" using a superset of JSON.parse.
 * The following extensions are accepted:
 *
 * - single line and multiline comments
 * - unquoted properties (ASCII-only Javascript identifiers)
 * - trailing comma in array and object definitions
 * - single quoted strings
 * - \f and \v are accepted as space characters
 * - leading plus in numbers
 * - octal (0o prefix) and hexadecimal (0x prefix) numbers
 *
 * @param {string} str
 *
 * @returns {any}
 */
export const parseExtJSON = /** @type {(str: string) => any} */ (
  std.parseExtJSON
);
