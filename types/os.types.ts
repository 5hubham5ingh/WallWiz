/** @format */
// @ts-ignore
import * as _os from 'os';

const os = /** @type {any} **/ (_os);

/*
  The os module provides Operating System specific functions:

  - low level file access
  - signals
  - timers
  - asynchronous I/O
  - workers (threads)
  
  The OS functions usually return 0 if OK or an OS specific negative error code.
 */

/**
 * Open a file
 *
 * @param {string} filename
 * @param {number} flags
 * @param {number} [mode=0o666] (default = 0o666)
 *
 * @returns {number} handle or < 0 if error.
 */
export const open =
  /** @type {(filename: string, flags: number, mode?: number) => number} */ (
    os.open
  );

/*
  POSIX open flags
 */

/** @type {number} - open for reading only */
export const O_RDONLY = os.O_RDONLY;

/** @type {number} - open for writing only */
export const O_WRONLY = os.O_WRONLY;

/** @type {number} - open for reading and writing. The result is undefined if this flag is applied to a FIFO */
export const O_RDWR = os.O_RDWR;

/** @type {number} - if set, the file offset shall be set to the end of the file prior to each write */
export const O_APPEND = os.O_APPEND;

/**
 * @type {number} - if the file exists, this flag has no effect except as noted under O_EXCL below.
 *                  Otherwise, the file shall be created
 */
export const O_CREAT = os.O_CREAT;

/** @type {number} - if O_CREAT and O_EXCL are set, open() shall fail if the file exists */
export const O_EXCL = os.O_EXCL;

/**
 * @type {number} - if the file exists and is a regular file, and the file is successfully opened
 *                  with O_RDWR or O_WRONLY, its length shall be truncated to 0
 */
export const O_TRUNC = os.O_TRUNC;

/**
 * Close a file
 *
 * @param {number} fd - file handle
 *
 * @returns {number} 0 if OK or -errno in case of I/O error
 */
export const close = /** @type {(fd: number) => number} */ (os.close);

/**
 * Seek in the file. Use std.SEEK_* for whence
 *
 * @param {number} fd - file handle
 * @param {number} offset
 * @param {number} whence
 *
 * @returns {number} 0 if OK or -errno in case of I/O error
 */
export const seek =
  /** @type {(fd: number, offset: number, whence: number) => number} */ (
    os.seek
  );

/**
 * Read "length" bytes from the file handle "fd" to the ArrayBuffer "buffer" at byte position "offset"
 *
 * @param {number} fd
 * @param {ArrayBuffer} buffer
 * @param {number} offset
 * @param {number} length
 *
 * @returns {number} the number of read bytes or < 0 if error
 */
export const read =
  /** @type {(fd: number, buffer: ArrayBuffer, offset: number, length: number) => number} */ (
    os.read
  );

/**
 * Write "length" bytes to the file handle "fd" from the ArrayBuffer "buffer" at byte position "offset"
 *
 * @param {number} fd
 * @param {number} buffer
 * @param {number} offset
 * @param {number} length
 *
 * @returns {number} the number of written bytes or < 0 if error
 */
export const write =
  /** @type {(fd: number, buffer: ArrayBuffer, offset: number, length: number) => number} */ (
    os.write
  );

/**
 * Return true if "fd" is a TTY (terminal) handle
 *
 * @param {number} fd - file handle
 *
 * @returns {boolean}
 */
export const isatty = /** @type {(fd: number) => boolean} */ (os.isatty);

/**
 * Return the TTY size as [width, height] or null if not available
 *
 * @param {number} fd - file handle
 *
 * @returns {[number, number] | null}
 */
export const ttyGetWinSize =
  /** @type {(fd: number) => [number, number] | null} */ (os.ttyGetWinSize);

/**
 * Set the TTY in raw mode
 *
 * @param {number} fd - file handle
 */
export const ttySetRaw = /** @type {(fd: number) => void} */ (os.ttySetRaw);

/**
 * Remove a file
 *
 * @param {string} filename
 *
 * @returns {number} 0 if OK or -errno
 */
export const remove = /** @type {(filename: string) => number} */ (os.remove);

/**
 * Rename a file
 *
 * @param {string} oldname
 * @param {string} newname
 *
 * @returns {number} 0 if OK or -errno
 */
export const rename =
  /** @type {(oldname: string, newname: string) => number} */ (os.rename);

/**
 * Return the canonicalized absolute pathname of a path
 *
 * @param {string} path
 *
 * @returns {[string, number]} [str, err] where "str" is the absolute pathname and "err" the error code
 */
export const realpath = /** @type {(path: string) => [string, number]} */ (
  os.realpath
);

/**
 * Return the current directory
 *
 * @returns {[string, number]} [str, err] where "str" is the current working directory and "err" the error code
 */
export const getcwd = /** @type {() => [string, number]} */ (os.getcwd);

/**
 * Change the current directory
 *
 * @param {string} path
 *
 * @returns {number} 0 if OK or -errno
 */
export const chdir = /** @type {(path: string) => number} */ (os.chdir);

/**
 * Create a directory at "path"
 *
 * @param {string} path
 * @param {number} [mode=0o777] (default = 0o777)
 *
 * @returns {number} 0 if OK or -errno
 */
export const mkdir = /** @type {(path: string, mode?: number) => number} */ (
  os.mkdir
);

/**
 * @typedef {Object} FileStatus
 * @property {number} dev - ID of device containing file
 * @property {number} ino - file serial number
 * @property {number} mode - mode of file
 * @property {number} nlink - number of links to the file
 * @property {number} uid - user ID of file
 * @property {number} gid - group ID of file
 * @property {number} rdev - device ID (if file is character or block special)
 * @property {number} size - file size in bytes (if file is a regular file)
 * @property {number} blocks - number of blocks allocated for this object
 * @property {number} atime - time of last access (milliseconds since 1970)
 * @property {number} mtime - time of last data modification (milliseconds since 1970)
 * @property {number} ctime - time of last status change (milliseconds since 1970)
 */

/**
 * Return informations about a file
 *
 * @param {string} path
 *
 * @returns {[FileStatus | null, number]} [obj, err] where "obj" containing the file status and "err" the error code
 */
export const stat =
  /** @type {(path: string) => [FileStatus | null, number]} */ (os.stat);

/**
 * Return informations about a file.
 * If path is a symbolink link, it returns information about the link itself,
 * not the file that the link refers to.
 *
 * @param {string} path
 *
 * @returns {[FileStatus | null, number]} [obj, err] where "obj" containing the file status and "err" the error code
 */
export const lstat =
  /** @type {(path: string) => [FileStatus | null, number]} */ (os.lstat);

/*
  Constants to interpret the mode property returned by stat().
  They have the same value as in the C system header sys/stat.h

  Ex: ((mode & os.S_IFMT) == os.S_IFCHR)
 */

/** @type {number} - bit mask used to extract the file type code from a mode value */
export const S_IFMT = os.S_IFMT;

/** @type {number} - file is a FIFO special file, or a pipe */
export const S_IFIFO = os.S_IFIFO;

/** @type {number} - file is a character special file (a device like a terminal) */
export const S_IFCHR = os.S_IFCHR;

/** @type {number} - file is a directory */
export const S_IFDIR = os.S_IFDIR;

/** @type {number} - file is a block special file (a device like a disk) */
export const S_IFBLK = os.S_IFBLK;

/** @type {number} - file is a regular file */
export const S_IFREG = os.S_IFREG;

/** @type {number} - file is a socket */
export const S_IFSOCK = os.S_IFSOCK;

/** @type {number} - file is a symbolic link */
export const S_IFLNK = os.S_IFLNK;

/** @type {number} - set group ID on execution */
export const S_ISGID = os.S_ISGID;

/** @type {number} - set user ID on execution */
export const S_ISUID = os.S_ISUID;

/**
 * Change the access and modification times of a file
 *
 * @param {string} path
 * @param {number} atime - access time (milliseconds since 1970)
 * @param {number} mtime - modification time (millisecondes since 1970)
 *
 * @returns {number} 0 if OK or -errno
 */
export const utimes =
  /** @type {(path: string, atime: number, mtime: number) => number} */ (
    os.utimes
  );

/**
 * Create a link at "linkpath" pointing to "target"
 *
 * @param {string} target
 * @param {string} linkpath
 *
 * @returns {number} 0 if OK or -errno
 */
export const symlink =
  /** @type {(target: string, linkpath: string) => number} */ (os.symlink);

/**
 * Return the target of a symlink
 *
 * @param {string} path
 *
 * @returns {[string, number]} [str, err] where "str" is the link target and "err" the error code
 */
export const readlink = /** @type {(path: string) => [string, number]} */ (
  os.readlink
);

/**
 * List entries in a directory
 *
 * @param {string} path
 *
 * @returns {[string[], number]} [array, err] where "array" is an array of strings containing the entries
 *                               of the directory and "err" the error code
 */
export const readdir = /** @type {(path: string) => [string[], number]} */ (
  os.readdir
);

/**
 * Add a read handler to the file handle "fd".
 * "func" is called each time there is data pending for "fd".
 * A single read handler per file handle is supported.
 * Use func = null to remove the handler.
 *
 * @param {number} fd
 * @param {(() => void) | null} func
 */
export const setReadHandler =
  /** @type {(fd: number, func: (() => void) | null) => void} */ (
    os.setReadHandler
  );

/**
 * Add a write handler to the file handle "fd".
 * "func" is called each time data can be written to "fd".
 * A single write handler per file handle is supported.
 * Use func = null to remove the handler.
 *
 * @param {number} fd
 * @param {(() => void) | null} func
 */
export const setWriteHandler =
  /** @type {(fd: number, func: (() => void) | null) => void} */ (
    os.setWriteHandler
  );

/**
 * Call the function "func" when the signal "signal" happens.
 * Only a single handler per signal number is supported.
 * Use func = null to set the default handler.
 * Use func = undefined to ignore the signal.
 * Signal handlers can only be defined in the main thread.
 *
 * @param {number} signal
 * @param {(() => void) | null} [func]
 */
export const signal =
  /** @type {(signal: number, func?: (() => void) | null) => void} */ (
    os.signal
  );

/*
  POSIX signal numbers
 */

/** @type {number} - abort signal */
export const SIGABRT = os.SIGABRT;

/** @type {number} - alarm clock */
export const SIGALRM = os.SIGALRM;

/** @type {number} - child stopped or terminated */
export const SIGCHLD = os.SIGCHLD;

/** @type {number} - continue executing, if stopped */
export const SIGCONT = os.SIGCONT;

/** @type {number} - erroneous arithmetic operation */
export const SIGFPE = os.SIGFPE;

/** @type {number} - illegal instruction */
export const SIGILL = os.SIGILL;

/** @type {number} - interrupt from keyboard */
export const SIGINT = os.SIGINT;

/** @type {number} - write on a pipe with no one to read it */
export const SIGPIPE = os.SIGPIPE;

/** @type {number} - terminal quit signal */
export const SIGQUIT = os.SIGQUIT;

/** @type {number} - invalid memory reference */
export const SIGSEGV = os.SIGSEGV;

/** @type {number} - stop executing (cannot be caught or ignored). */
export const SIGSTOP = os.SIGSTOP;

/** @type {number} - termination signal */
export const SIGTERM = os.SIGTERM;

/** @type {number} - terminal stop signal */
export const SIGTSTP = os.SIGTSTP;

/** @type {number} - background process attempting read */
export const SIGTTIN = os.SIGTTIN;

/** @type {number} - background process attempting write */
export const SIGTTOU = os.SIGTTOU;

/** @type {number} - user-defined signal 1 */
export const SIGUSR1 = os.SIGUSR1;

/** @type {number} - user-defined signal 2 */
export const SIGUSR2 = os.SIGUSR2;

/**
 * Send the signal "sig" to the process "pid"
 *
 * @param {number} pid
 * @param {number} sig
 */
export const kill = /** @type {(pid: number, sig: number) => number} */ (
  os.kill
);

/**
 * @typedef {Object} ExecOptions
 * @property {boolean} [block=true] - if true, wait until the process is terminated.
 *                                    In this case, exec return the exit code if positive or the negated
 *                                    signal number if the process was interrupted by a signal.
 *                                    If false, do not block and return the process id of the child (default = true)
 * @property {boolean} [usePath=true] - if true, the file is searched in the PATH environment variable (default = true)
 * @property {string} [file] - set the file to be executed (default = args[0])
 * @property {string} [cwd] - if present, set the working directory of the new process
 * @property {number} [stdin] - if present, set the handle in the child for stdin
 * @property {number} [stdout] - if present, set the handle in the child for stdout
 * @property {number} [stderr] - if present, set the handle in the child for stderr
 * @property {Record<string, string>} [env] - if present, set the process environment from the object key-value pairs.
 *                                            Otherwise use the same environment as the current process
 * @property {number} [uid] - if present, the process uid with setuid
 * @property {number} [gid] - if present, the process gid with setgid
 */

/**
 * Execute a process with the arguments "args"
 *
 * @param {string[]} args
 * @param {ExecOptions} [options]
 *
 * @returns {number} exit code (blocking mode, success), signal number (blocking mode, error)
 *                   or process ID of the child (non-blocking mode)
 */
export const exec =
  /** @type {(args: string[], options?: ExecOptions) => number} */ (os.exec);

/**
 * Return the current process ID
 *
 * @returns {number}
 */
export const getpid = /** @type {() => number} */ (os.getpid);

/**
 * Execute waitpid Unix system call
 *
 * @param {number} pid
 * @param {number} [options] - ex: WNOHANG
 *
 * @returns {[number, number]} [ret, status]. "ret" contains -errno in case of error
 */
export const waitpid =
  /** @type {(pid: number, options?: number) => [number, number]} */ (
    os.waitpid
  );

/*
  Constants for the "options" argument of waitpid
 */

/** @type {number} - return immediately if no child has exited */
export const WNOHANG = os.WNOHANG;

/**
 * Execute dup Unix system call.
 * Allocates a new file descriptor that refers to the same open file as "fd"
 *
 * @param {number} fd
 *
 * @returns {number} new file descriptor number is guaranteed to be the lowest-numbered
 *                   file descriptor that was unused in the calling process.
 *                   In case of error, -errno is returned
 */
export const dup = /** @type {(fd: number) => number} */ (os.dup);

/**
 * Execute dup2 Unix system call.
 * Adjust file descriptor "newfd" so that it now refers to the same open file as "oldfd"
 *
 * @param {number} oldfd
 * @param {number} newfd
 *
 * @returns {number} new file descriptor number or -errno on error
 */
export const dup2 = /** @type {(oldfd: number, newfd: number) => number} */ (
  os.dup2
);

/**
 * Execute pipe Unix system call
 *
 * @returns {[number, number] | null} [read_fd, write_fd] or null in case of error
 */
export const pipe = /** @type {() => [number, number] | null} */ (os.pipe);

/**
 * Sleep during "delay_ms" milliseconds
 *
 * @param {number} delay_ms - delay in ms
 */
export const sleep = /** @type {(delay_ms: number) => void} */ (os.sleep);

/**
 * Asynchronouse sleep during "delay_ms" milliseconds.
 *
 * @param {number} delay_ms - delay in ms
 *
 * @return {Promise<void>}
 */
export const sleepAsync = /** @type {(delay_ms: number) => Promise<void>} */ (
  os.sleepAsync
);

/**
 * Return a timestamp in milliseconds with more precision than Date.now().
 * The time origin is unspecified and is normally not impacted by system clock adjustments
 *
 * @returns {number}
 */
export const now = /** @type {() => number} */ (os.now);

/**
 * Call the function "func" after "delay" ms
 *
 * @param {() => void} func
 * @param {number} delay - delay in ms
 *
 * @returns {Object} handle to the timer
 */
export const setTimeout =
  /** @type {(func: () => void, delay: number) => Object} */ (os.setTimeout);

/**
 * Cancel a timer
 *
 * @param {Object} handle to the timer
 */
export const clearTimeout = /** @type {(handle: Object) => void} */ (
  os.clearTimeout
);

/** @type {string} - string representing the platform */
export const platform = os.platform;

/**
 * @typedef {Object} OnWorkerMessageEvent
 * @property {any} data
 */

/**
 * @typedef {Object} Worker
 * @property {(msg: any) => void} postMessage
 * @property {((event: OnWorkerMessageEvent) => void) | null} onmessage
 */

// @ts-ignore
export { Worker } from 'os';

/**
 * Create a Worker
 *
 * @param {string} filename
 *
 * @returns {Worker}
 */
export const createWorker = (filename) => {
  // @ts-ignore
  return new os.Worker(filename);
};

/**
 * Return the parent Worker instance
 * It should be called from the child worker
 *
 * @returns {Worker | undefined}
 */
export const getParentWorker = () => {
  // @ts-ignore
  return os.Worker.parent;
};

/*
  Extra functions only available with
  https://github.com/ctn-malone/quickjs-cross-compiler?tab=readme-ov-file#extra-functions
 */

/**
 * Apply or remove an advisory lock on an open file
 *
 * @param {number} fd
 * @param {number} operation - os.LOCK_*
 *
 * @returns {number} 0 if OK or -errno in case of I/O error
 */
export const flock = /** @type {(fd: number, operation: number) => number} */ (
  os.flock
);

/** @type {number} - place an exclusive lock. Only one process may hold an exclusive lock for a given file at a given time */
export const LOCK_EX = os.LOCK_EX;

/**
 * @type {number} - a call to flock() may block if an incompatible lock is held by another process.
 *                  To make a nonblocking request, include os.LOCK_NB with any of the above operations
 */
export const LOCK_NB = os.LOCK_NB;

/**
 * Generate a unique temporary filename from "template" (wrapper to the libc mkstemp).
 *
 * @param {string} template - template used to generate a unique temporary filename.
 *                            It must end with XXXXXX
 * @param {{filename: string}} outputObj - object where generated filename will be stored
 *
 * @returns {number} open file descriptor or -errno in case of error
 */
export const mkstemp =
  /** @type {(template: string, outputObj: {filename: string}) => number} */ (
    os.mkstemp
  );

/**
 * Generate a unique temporary dirname from "template" (wrapper to the libc mkdtemp).
 *
 * @param {string} template - template used to generate a unique temporary dirname.
 *                            It must end with XXXXXX
 * @param {{errno: number}} [errorObj] - if defined, set its "errno" property to the error code or to 0 if no error occured
 *
 * @returns {string | null} temporary dirname or null on error
 */
export const mkdtemp =
  /** @type {(template: string | null, errorObj?: {errno: number}) => string} */ (
    os.mkdtemp
  );
