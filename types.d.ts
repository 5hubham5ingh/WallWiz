/**
 * UserArguments represents the user configuration and options for the wallpaper management system.
 * This includes preferences for wallpaper directories, random wallpaper settings, image sizes, and more.
 */
export type UserArguments = {
  /** Directory path where wallpapers are stored */
  wallpapersDirectory: string;

  /** Whether to set a random wallpaper from the directory */
  setRandomWallpaper: boolean;

  /** The size of the wallpaper image in pixels as [width, height] */
  imageSize: [number, number];

  /** Enable or disable light theme support */
  enableLightTheme: boolean;

  /** Padding in pixels around the wallpaper image as [horizontal, vertical] */
  padding: [number, number];

  /** Enable or disable pagination when browsing wallpapers */
  enablePagination: boolean;

  /** Size of the wallpaper grid display as [columns, rows] */
  gridSize: [number, number];

  /** Download additional scripts to support theme extensions */
  downloadThemeExtensionScripts: boolean;

  /** Download a script to manage wallpaper daemon handlers */
  downloadWallpaperDaemonHandlerScript: boolean;

  /** Whether to allow browsing wallpapers from online repositories */
  browseWallpaperOnline: boolean;

  /** List of URLs to wallpaper repositories */
  wallpaperRepositoryUrls: string[];

  /** GitHub API key for downloading wallpapers from repositories */
  githubApiKey: string;

  /** Show a key map for navigating wallpapers */
  showKeyMap: boolean;

  /** Disable system notifications */
  disableNotification: boolean;

  /** Disable automatic scaling of wallpapers to screen size */
  disableAutoScaling: boolean;

  /** Limit the number of processes used for downloading wallpapers */
  processLimit: number;
};

/**
 * ColoursCache represents a cached map of wallpaper unique IDs to an array of color strings.
 * Each unique wallpaper ID corresponds to its associated color scheme.
 */
export type ColoursCache = {
  [uid: string]: string[];
};

/**
 * DownloadItemMenu defines a list of downloadable items, including details such as the name, description, and URL.
 * Optionally, a temporary file location can be specified.
 */
export type DownloadItemMenu = {
  /** Name of the downloadable item */
  name: string;

  /** Description or additional details about the item */
  about: string;

  /** URL where the item can be downloaded */
  downloadUrl: string;

  /** Optional temporary file path where the item is stored during download */
  tmpFile?: string;
}[];

/**
 * ApiCache represents a cache for API requests, storing the URL, ETag for caching, and associated data.
 */
export type ApiCache = {
  /** The URL of the cached API request */
  url: string;

  /** ETag used for cache validation */
  etag: string;

  /** The data retrieved from the API request */
  data: object;
}[];

/**
 * DownloadItemList is a list of downloadable wallpapers, including their name and download URL.
 */
export type DownloadItemList = {
  /** Name of the downloadable wallpaper */
  name: string;

  /** URL where the wallpaper can be downloaded */
  downloadUrl: string;
}[];

/**
 * WallpapersList is a list of wallpapers with unique identifiers.
 */
export type WallpapersList = {
  /** Name of the wallpaper */
  name: string;

  /** Unique identifier for the wallpaper */
  uniqueId: string;
}[];
//#region QuickJs

//#region os module

/**
 * Represents a file in the QuickJS OS module.
 * @example
 * const file = OS.open('example.txt', OS.O_RDWR | OS.O_CREAT);
 * file.puts('Hello, world!');
 * file.close();
 */
interface File {
  close(): number;
  puts(str: string): void;
  printf(fmt: string, ...args: any[]): void;
  flush(): void;
  seek(offset: number, whence: number): number;
  tell(): number;
  tello(): BigInt;
  eof(): boolean | unknown;
  fileno(): unknown;
  error(): Error | unknown;
  clearerr(): void;
  read(buffer: ArrayBuffer, position: number, length: number): void;
  write(buffer: ArrayBuffer, position: number, length: number): void;
  getline(): string;
  readAsString(max_size?: number): string;
  getByte(): number;
  putByte(c: number): void;
}

/**
 * Represents file status information in the QuickJS OS module.
 * @example
 * const [stat, err] = OS.stat('example.txt');
 * if (err === 0) {
 *   console.log(`File size: ${stat.size} bytes`);
 * }
 */
interface FileStatus {
  readonly dev: number;
  readonly ino: number;
  readonly mode: number;
  readonly nlink: number;
  readonly uid: number;
  readonly gid: number;
  readonly rdev: number;
  readonly size: number;
  readonly blocks: number;
  readonly atime: number;
  readonly mtime: number;
  readonly ctime: number;
}

/**
 * Options for executing a command in the QuickJS OS module.
 * @example
 * const options: ExecOptions = {
 *   block: true,
 *   cwd: '/home/user',
 *   env: { 'PATH': '/usr/bin' }
 * };
 * OS.exec(['ls', '-l'], options);
 */
interface ExecOptions {
  block?: boolean;
  usePath?: boolean;
  file?: string;
  cwd?: string;
  stdin?: File;
  stdout?: File;
  stderr?: File;
  env?: { readonly [key: string]: string };
  uid?: number;
  gid?: number;
}

type OSOperationResult = 0 | Error;

/**
 * Interface representing the OS module in QuickJS.
 * Provides low-level operating system functionalities for file operations,
 * process management, and system-level interactions.
 */
export interface IOs {
  /**
   * Opens a file and returns a file descriptor.
   * @param filename - The name of the file to open.
   * @param flag - The flags for opening the file (e.g., OS.O_RDONLY, OS.O_WRONLY).
   * @param mode - Optional file mode for creation.
   * @returns A File object if successful, or -1 if an error occurred.
   * @example
   * const file = OS.open('example.txt', OS.O_RDWR | OS.O_CREAT);
   * if (file !== -1) {
   *   // File opened successfully
   * }
   */
  open(filename: string, flag: number, mode?: unknown): File | -1;

  /**
   * Closes an open file descriptor.
   * @param file - The File object to close.
   * @returns 0 on success, or a negative value on error.
   * @example
   * const result = OS.close(file);
   * if (result === 0) {
   *   console.log('File closed successfully');
   * }
   */
  close(file: File): number;

  /**
   * Repositions the file offset of the open file associated with the file descriptor.
   * @param file - The File object.
   * @param offset - The offset in bytes.
   * @param whence - The reference point for the offset (e.g., OS.SEEK_SET, OS.SEEK_CUR, OS.SEEK_END).
   * @returns The resulting offset in bytes from the beginning of the file.
   * @example
   * const newPosition = OS.seek(file, 100, OS.SEEK_SET);
   * console.log(`New file position: ${newPosition}`);
   */
  seek(file: File, offset: number, whence: number): number;

  /**
   * Reads data from a file into a buffer.
   * @param file - The File object to read from.
   * @param buffer - The ArrayBuffer to read into.
   * @param offset - The offset in the buffer to start writing at.
   * @param length - The number of bytes to read.
   * @returns The number of bytes read, or a negative value on error.
   * @example
   * const buffer = new ArrayBuffer(100);
   * const bytesRead = OS.read(file, buffer, 0, 100);
   * console.log(`Read ${bytesRead} bytes`);
   */
  read(file: File, buffer: ArrayBuffer, offset: number, length: number): number;

  /**
   * Writes data from a buffer to a file.
   * @param file - The File object to write to.
   * @param buffer - The ArrayBuffer to write from.
   * @param offset - The offset in the buffer to start reading from.
   * @param length - The number of bytes to write.
   * @returns The number of bytes written, or a negative value on error.
   * @example
   * const buffer = new TextEncoder().encode('Hello, world!');
   * const bytesWritten = OS.write(file, buffer, 0, buffer.byteLength);
   * console.log(`Wrote ${bytesWritten} bytes`);
   */
  write(
    file: File,
    buffer: ArrayBuffer,
    offset: number,
    length: number,
  ): number;

  /**
   * Checks if the given file descriptor refers to a terminal.
   * @param file - The File object to check.
   * @returns true if the file is a terminal, false otherwise.
   * @example
   * if (OS.isatty(OS.std.out)) {
   *   console.log('Standard output is a terminal');
   * }
   */
  isatty(file: File): boolean;

  /**
   * Gets the size of the terminal window.
   * @param file - The File object representing the terminal.
   * @returns An array with two elements [rows, columns] if successful, or null on error.
   * @example
   * const size = OS.ttyGetWinSize(OS.std.out);
   * if (size) {
   *   console.log(`Terminal size: ${size[0]} rows, ${size[1]} columns`);
   * }
   */
  ttyGetWinSize(file: File): [number, number] | null;

  /**
   * Sets the terminal to raw mode.
   * @param file - The File object representing the terminal.
   * @example
   * OS.ttySetRaw(OS.std.in);
   * console.log('Terminal set to raw mode');
   */
  ttySetRaw(file: File): void;

  /**
   * Returns the canonicalized absolute pathname.
   * @param path - The path to resolve.
   * @returns An array with two elements: [resolvedPath, errorCode].
   * @example
   * const [resolvedPath, error] = OS.realpath('./relative/path');
   * if (error === 0) {
   *   console.log(`Resolved path: ${resolvedPath}`);
   * }
   */
  realpath(path: string): [string, number];

  /**
   * Reads the contents of a directory.
   * @param path - The path of the directory to read.
   * @returns An array with two elements: [fileList, errorCode].
   * @example
   * const [files, error] = OS.readdir('/home/user');
   * if (error === 0) {
   *   console.log('Directory contents:', files);
   * }
   */
  readdir(path: string): [string[], number];

  /**
   * Sets a read handler for a file descriptor.
   * @param file - The File object.
   * @param cb - The callback function to be called when the file is ready for reading, or null to remove the handler.
   * @example
   * OS.setReadHandler(OS.std.in, () => {
   *   const input = OS.std.in.getline();
   *   console.log('Received input:', input);
   * });
   */
  setReadHandler(file: File, cb: (() => any) | null): void;

  /**
   * Sets a write handler for a file descriptor.
   * @param file - The File object.
   * @param cb - The callback function to be called when the file is ready for writing.
   * @example
   * OS.setWriteHandler(OS.std.out, () => {
   *   OS.std.out.puts('Ready to write!\n');
   * });
   */
  setWriteHandler(file: File, cb: () => any): void;

  /**
   * Sets a signal handler.
   * @param signal - The signal number.
   * @param cb - The callback function to be called when the signal is received.
   * @example
   * OS.signal(OS.SIGINT, () => {
   *   console.log('Received SIGINT signal');
   *   OS.exit(0);
   * });
   */
  signal(signal: number, cb: () => any): void;

  /**
   * Gets file status.
   * @param path - The path of the file.
   * @returns An array with two elements: [FileStatus, Error].
   * @example
   * const [stat, err] = OS.stat('/path/to/file');
   * if (err === 0) {
   *   console.log(`File size: ${stat.size} bytes`);
   * }
   */
  stat(path: string): [FileStatus, Error];

  /**
   * Removes a file or directory.
   * @param filename - The name of the file or directory to remove.
   * @returns 0 on success, or an Error object on failure.
   * @example
   * const result = OS.remove('/path/to/file');
   * if (result === 0) {
   *   console.log('File removed successfully');
   * }
   */
  remove(filename: string): OSOperationResult;

  /**
   * Renames a file or directory.
   * @param oldname - The current name of the file or directory.
   * @param newname - The new name for the file or directory.
   * @returns 0 on success, or an Error object on failure.
   * @example
   * const result = OS.rename('oldfile.txt', 'newfile.txt');
   * if (result === 0) {
   *   console.log('File renamed successfully');
   * }
   */
  rename(oldname: string, newname: string): OSOperationResult;

  /**
   * Gets the current working directory.
   * @returns An array with two elements: [currentPath, errorCode].
   * @example
   * const [cwd, error] = OS.getcwd();
   * if (error === 0) {
   *   console.log(`Current working directory: ${cwd}`);
   * }
   */
  getcwd(): [string, number];

  /**
   * Changes the current working directory.
   * @param path - The path to set as the new working directory.
   * @returns 0 on success, or an Error object on failure.
   * @example
   * const result = OS.chdir('/home/user/projects');
   * if (result === 0) {
   *   console.log('Changed directory successfully');
   * }
   */
  chdir(path: string): OSOperationResult;

  /**
   * Creates a new directory.
   * @param path - The path of the directory to create.
   * @param mode - Optional permissions mode for the new directory.
   * @returns 0 on success, or an Error object on failure.
   * @example
   * const result = OS.mkdir('/path/to/new/directory', '0755');
   * if (result === 0) {
   *   console.log('Directory created successfully');
   * }
   */
  mkdir(path: string, mode?: string): OSOperationResult;

  /**
   * Gets file status, without following symbolic links.
   * @param path - The path of the file.
   * @returns An array with two elements: [FileStatus, Error].
   * @example
   * const [stat, err] = OS.lstat('/path/to/symlink');
   * if (err === 0) {
   *   console.log(`Is symbolic link: ${(stat.mode & OS.S_IFMT) === OS.S_IFLNK}`);
   * }
   */
  lstat(path: string): [FileStatus, Error];

  /**
   * Changes file last access and modification times.
   * @param path - The path of the file.
   * @param atime - The new access time (in seconds since the Epoch).
   * @param mtime - The new modification time (in seconds since the Epoch).
   * @returns 0 on success, or an Error object on failure.
   * @example
   * const now = Math.floor(Date.now() / 1000);
   * const result = OS.utimes('/path/to/file', now, now);
   * if (result === 0) {
   *   console.log('File times updated successfully');
   * }
   */
  utimes(path: string, atime: number, mtime: number): OSOperationResult;

  /**
   * Creates a symbolic link.
   * @param target - The target path that the symlink will point to.
   * @param linkpath - The path where the symlink will be created.
   * @returns 0 on success, or an Error object on failure.
   * @example
   * const result = OS.symlink('/path/to/target', '/path/to/symlink');
   * if (result === 0) {
   *   console.log('Symbolic link created successfully');
   * }
   */
  symlink(target: string, linkpath: string): OSOperationResult;

  /**
   * Reads the value of a symbolic link.
   * @param path - The path of the symbolic link.
   * @returns An array with two elements: [linkTarget, errorCode].
   * @example
   * const [target, error] = OS.readlink('/path/to/symlink');
   * if (error === 0) {
   *   console.log(`Symlink points to: ${target}`);
   * }
   */
  readlink(path: string): [string, number];

  /**
   * Duplicates a file descriptor.
   * @param file - The File object to duplicate.
   * @example
   * const newFile = OS.dup(OS.std.out);
   * console.log('File descriptor duplicated');
   */
  dup(file: File): void;

  /**
   * Duplicates a file descriptor to a specific new descriptor.
   * @param oldFile - The original File object.
   * @param newFile - The new File object to duplicate to.
   * @example
   * OS.dup2(OS.std.out, customFile);
   * console.log('File descriptor duplicated to specific new descriptor');
   */
  dup2(oldFile: File, newFile: File): void;

  /**
   * Creates a pipe.
   * @returns An array with two File objects [readEnd, writeEnd] on success, or null on failure.
   * @example
   * const pipe = OS.pipe();
   * if (pipe) {
   *   console.log('Pipe created successfully');
   *   const [readEnd, writeEnd] = pipe;
   * }
   */
  pipe(): [File, File] | null;

  /**
   * Suspends the execution of the calling process for a specified time.
   * @param delay - The number of seconds to sleep.
   * @example
   * console.log('Sleeping for 5 seconds...');
   * OS.sleep(5);
   * console.log('Awake!');
   */
  sleep(delay: number): void;

  /**
   * Executes a new process.
   * @param args - An array of strings representing the command and its arguments.
   * @param options - Optional ExecOptions object.
   * @returns The process ID of the new process.
   * @example
   * const pid = OS.exec(['ls', '-l'], { block: false });
   * console.log(`Started process with PID: ${pid}`);
   */
  exec(args: string[], options?: ExecOptions): number;

  /**
   * Waits for a child process to terminate.
   * @param pid - The process ID to wait for.
   * @param options - Options for waiting (e.g., OS.WNOHANG).
   * @returns An array with two elements: [status, childPid].
   * @example
   * const [status, childPid] = OS.waitpid(pid, 0);
   * console.log(`Child process ${childPid} exited with status: ${status}`);
   */
  waitpid(pid: number, options: number): [unknown | Error, any];

  /**
   * Sets a timer to execute a callback after a specified delay.
   * @param cb - The callback function to execute.
   * @param delay - The delay in milliseconds.
   * @returns A handle that can be used to clear the timeout.
   * @example
   * const handle = OS.setTimeout(() => {
   *   console.log('Timeout executed');
   * }, 1000);
   */
  setTimeout(cb: () => any, delay: number): number;

  /**
   * Clears a timer set by setTimeout.
   * @param handle - The handle returned by setTimeout.
   * @example
   * OS.clearTimeout(handle);
   * console.log('Timeout cleared');
   */
  clearTimeout(handle: number): void;
}

//#endregion

//#region std module

/**
 * Enum for common error codes in QuickJS.
 * These can be used for more specific error handling.
 * @example
 * if (err === ErrorEnum.ENOENT) {
 *   console.log('File not found');
 * }
 */
export enum ErrorEnum {
  EACCES = 13,
  EBUSY = 16,
  EEXIST = 17,
  EINVAL = 22,
  EIO = 5,
  ENOENT = 2,
  ENOSPC = 28,
  ENOSYS = 38,
  EPERM = 1,
  EPIPE = 32,
}

/**
 * Options for script evaluation in QuickJS.
 */
interface EvalOptions {
  /**
   * If true, creates a backtrace barrier for error reporting.
   * This can be useful for hiding implementation details in error stack traces.
   */
  backtrace_barrier?: boolean;
}

/**
 * Options for URL GET requests in QuickJS.
 */
interface URLGetOptions {
  /**
   * If true, returns the content as a binary ArrayBuffer instead of a string.
   */
  binary?: boolean;

  /**
   * If true, returns an object with full response details instead of just the content.
   */
  full?: boolean;
}

/**
 * Options for error handling in file operations.
 */
interface ErrorOptions {
  /**
   * An Error object to store the error information if the operation fails.
   */
  errorno: Error;
}

/**
 * The std module in QuickJS provides standard library functions.
 * It includes utilities for I/O, script evaluation, environment variables, and more.
 */
export interface IStd {
  /**
   * Terminates the program with the specified exit code.
   * @param n - The exit code.
   */
  exit(n: number): void;

  /**
   * Evaluates a JavaScript script.
   * @param script - The script to evaluate.
   * @param options - Optional evaluation options.
   */
  evalScript(script: string, options?: EvalOptions): void;

  /**
   * Loads and executes a JavaScript file.
   * @param filename - The path to the JavaScript file.
   */
  loadScript(filename: string): void;

  /**
   * Loads the contents of a file.
   * @param filename - The path to the file.
   */
  loadFile(filename: string): void;

  /**
   * Opens a file and returns a File object.
   * @param filename - The path to the file.
   * @param flags - The flags for opening the file.
   * @param errorObj - Optional error handling object.
   * @returns A File object or null if the operation fails.
   */
  open(filename: string, flags: unknown, errorObj?: ErrorOptions): File | null;

  /**
   * Opens a process by creating a pipe.
   * @param command - The command to execute.
   * @param flags - The flags for opening the pipe.
   * @param errorObj - Optional error handling object.
   * @returns A File object representing the pipe or null if the operation fails.
   */
  popen(command: string, flags: unknown, errorObj?: ErrorOptions): File | null;

  /**
   * Associates a stream with an existing file descriptor.
   * @param file - The file descriptor.
   * @param flags - The flags for the stream.
   * @param errorObj - Optional error handling object.
   * @returns A File object or null if the operation fails.
   */
  fdopen(file: File, flags: unknown, errorObj?: ErrorOptions): File | null;

  /**
   * Creates a temporary file.
   * @param errorObj - Optional error handling object.
   * @returns A File object representing the temporary file or null if the operation fails.
   */
  tmpFile(errorObj?: ErrorOptions): File | null;

  /**
   * Writes a string to the standard output.
   * @param str - The string to write.
   */
  puts(str: string): void;

  /**
   * Prints formatted output to the standard output.
   * @param fmt - The format string.
   * @param args - The arguments to format.
   */
  printf(fmt: string, ...args: any[]): void;

  /**
   * Returns a formatted string.
   * @param fmt - The format string.
   * @param args - The arguments to format.
   * @returns The formatted string.
   */
  sprintf(fmt: string, ...args: any[]): void;

  /**
   * Returns a string describing the given error number.
   * @param errorno - The error number.
   * @returns A string describing the error.
   */
  strerror(errorno: Error): string;

  /**
   * Runs the garbage collector.
   */
  gc(): void;

  /**
   * Gets the value of an environment variable.
   * @param name - The name of the environment variable.
   * @returns The value of the environment variable, or undefined if it doesn't exist.
   */
  getenv(name: string): string | undefined;

  /**
   * Sets an environment variable.
   * @param name - The name of the environment variable.
   * @param value - The value to set.
   */
  setenv(name: string, value: string): void;

  /**
   * Removes an environment variable.
   * @param name - The name of the environment variable to remove.
   */
  unsetenv(name: string): void;

  /**
   * Gets all environment variables.
   * @returns An object containing all environment variables.
   */
  getenviron(): { readonly [key: string]: string };

  /**
   * Performs a GET request to the specified URL.
   * @param url - The URL to request.
   * @param options - Optional request options.
   * @returns The response content as a string, ArrayBuffer, or object depending on the options.
   */
  urlGet(url: string): string;
  urlGet(url: string, options: { full?: false; binary: false }): string;
  urlGet(url: string, options: { full?: false; binary: true }): ArrayBuffer;
  urlGet(url: string, options: { full: true; binary?: false }): URLGetOptions;
  urlGet(url: string, options: { full: true; binary?: false }): ArrayBuffer;

  /**
   * Parses an extended JSON string.
   * @param str - The JSON string to parse.
   * @returns The parsed object.
   */
  parseExtJSON(str: string): object;

  /**
   * Standard input file descriptor.
   */
  readonly in: File;

  /**
   * Standard error file descriptor.
   */
  readonly err: File;

  /**
   * Standard output file descriptor.
   */
  readonly out: File;

  /**
   * Seek constant: set file offset to offset.
   */
  SEEK_SET: number;

  /**
   * Seek constant: set file offset to current plus offset.
   */
  SEEK_CUR: number;

  /**
   * Seek constant: set file offset to EOF plus offset.
   */
  SEEK_END: number;

  /**
   * File type constant: type of file mask.
   */
  S_IFMT: number;

  /**
   * File type constant: named pipe (fifo).
   */
  S_IFIFO: number;

  /**
   * File type constant: character special.
   */
  S_IFCHR: number;

  /**
   * File type constant: directory.
   */
  S_IFDIR: number;

  /**
   * File type constant: block special.
   */
  S_IFBLK: number;

  /**
   * File type constant: regular file.
   */
  S_IFREG: number;

  /**
   * File type constant: socket.
   */
  S_IFSOCK: number;

  /**
   * File type constant: symbolic link.
   */
  S_IFLNK: number;

  /**
   * File type constant: set group ID on execution.
   */
  S_ISGID: number;

  /**
   * File type constant: set user ID on execution.
   */
  S_ISUID: number;

  /**
   * Enum representing common error codes in QuickJS.
   */
  Error: typeof ErrorEnum;
}

//#endregion
//#endregion

declare global {
  const USER_ARGUMENTS: UserArguments;
}
