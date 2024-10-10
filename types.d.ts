export type UserArguments = {
  wallpapersDirectory: string;
  setRandomWallpaper: boolean;
  imageSize: [number, number];
  enableLightTheme: boolean;
  padding: [number, number];
  enablePagination: boolean;
  gridSize: [number, number];
  downloadThemeExtensionScripts: boolean;
  downloadWallpaperDaemonHandlerScript: boolean;
  browseWallpaperOnline: boolean;
  wallpaperRepositoryUrls: string[];
  githubApiKey: string;
  showKeyMap: boolean;
  disableNotification: boolean;
  disableAutoScaling: boolean;
  processLimit: number;
};

export type ColoursCache = {
  [uid: string]: string[];
};

export type DownloadItemMenu = {
  name: string;
  about: string;
  downloadUrl: string;
  tmpFile?: string;
}[];

export type ApiCache = {
  url: string;
  etag: string;
  data: object;
}[];

export type DownloadItemList = {
  name: string;
  downloadUrl: string;
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
 * The OS module in QuickJS provides low-level operating system functionalities.
 * It allows file operations, process management, and system-level interactions.
 * @example
 * // Reading a file
 * const file = OS.open('example.txt', OS.O_RDONLY);
 * const buffer = new ArrayBuffer(100);
 * const bytesRead = OS.read(file, buffer, 0, 100);
 * OS.close(file);
 *
 * // Creating a directory
 * OS.mkdir('/path/to/new/directory');
 *
 * // Executing a command
 * const pid = OS.exec(['ls', '-l'], { block: false });
 * const [status, _] = OS.waitpid(pid, 0);
 */
export interface IOs {
  open(filename: string, flag: number, mode?: unknown): File | -1;
  close(file: File): number;
  seek(file: File, offset: number, whence: number): number;
  read(file: File, buffer: ArrayBuffer, offset: number, length: number): number;
  write(
    file: File,
    buffer: ArrayBuffer,
    offset: number,
    length: number,
  ): number;
  isatty(file: File): boolean;
  ttyGetWinSize(file: File): [number, number] | null;
  ttySetRaw(file: File): void;
  realpath(path: string): [string, number];
  readdir(path: string): [string[], number];
  setReadHandler(file: File, cb: (() => any) | null): void;
  setWriteHandler(file: File, cb: () => any): void;
  signal(signal: number, cb: () => any): void;
  stat(path: string): [FileStatus, Error];
  remove(filename: string): OSOperationResult;
  rename(oldname: string, newname: string): OSOperationResult;
  getcwd(): [string, number];
  chdir(path: string): OSOperationResult;
  mkdir(path: string, mode?: string): OSOperationResult;
  lstat(path: string): [FileStatus, Error];
  utimes(path: string, atime: number, mtime: number): OSOperationResult;
  symlink(target: string, linkpath: string): OSOperationResult;
  readlink(path: string): [string, number];
  dup(file: File): void;
  dup2(oldFile: File, newFile: File): void;
  pipe(): [File, File] | null;
  sleep(delay: number): void;
  exec(args: string[], options?: ExecOptions): number;
  waitpid(pid: number, options: number): [unknown | Error, any];
  setTimeout(cb: () => any, delay: number): number;
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
 * @example
 * const options: EvalOptions = { backtrace_barrier: true };
 * std.evalScript('console.log("Hello");', options);
 */
interface EvalOptions {
  backtrace_barrier?: boolean;
}

/**
 * Options for URL GET requests in QuickJS.
 * @example
 * const content = std.urlGet('https://example.com', { binary: true });
 */
interface URLGetOptions {
  binary?: boolean;
  full?: boolean;
}

/**
 * Options for error handling in file operations.
 * @example
 * const errorObj: ErrorOptions = { errorno: new Error() };
 * const file = std.open('nonexistent.txt', 'r', errorObj);
 * if (file === null) {
 *   console.log(`Error: ${std.strerror(errorObj.errorno)}`);
 * }
 */
interface ErrorOptions {
  errorno: Error;
}

/**
 * The std module in QuickJS provides standard library functions.
 * It includes utilities for I/O, script evaluation, environment variables, and more.
 * @example
 * // Writing to standard output
 * std.puts('Hello, world!');
 *
 * // Reading environment variables
 * const path = std.getenv('PATH');
 *
 * // Evaluating a script
 * std.evalScript('console.log(2 + 2);');
 *
 * // Making a URL request
 * const content = std.urlGet('https://example.com');
 */
export interface IStd {
  exit(n: number): void;
  evalScript(script: string, options?: EvalOptions): void;
  loadScript(filename: string): void;
  loadFile(filename: string): void;
  open(
    filename: string,
    flags: unknown,
    errorObj?: ErrorOptions,
  ): File | null;
  popen(
    command: string,
    flags: unknown,
    errorObj?: ErrorOptions,
  ): File | null;
  fdopen(
    file: File,
    flags: unknown,
    errorObj?: ErrorOptions,
  ): File | null;
  tmpFile(errorObj?: ErrorOptions): File | null;
  puts(str: string): void;
  printf(fmt: string, ...args: any[]): void;
  sprintf(fmt: string, ...args: any[]): void;

  strerror(errorno: Error): string;
  gc(): void;
  getenv(name: string): string | undefined;
  setenv(name: string, value: string): void;
  unsetenv(name: string): void;
  getenviron(): { readonly [key: string]: string };
  urlGet(url: string): string;
  urlGet(
    url: string,
    options: { full?: false; binary: false },
  ): string;
  urlGet(
    url: string,
    options: { full?: false; binary: true },
  ): ArrayBuffer;
  urlGet(
    url: string,
    options: { full: true; binary?: false },
  ): URLGetOptions;
  urlGet(
    url: string,
    options: { full: true; binary?: false },
  ): ArrayBuffer;
  parseExtJSON(str: string): object;

  readonly in: File;
  readonly err: File;
  readonly out: File;

  // Seek constants
  SEEK_SET: number; // 0
  SEEK_CUR: number; // 1
  SEEK_END: number; // 2

  // File type constants
  S_IFMT: number;
  S_IFIFO: number;
  S_IFCHR: number;
  S_IFDIR: number;
  S_IFBLK: number;
  S_IFREG: number;
  S_IFSOCK: number;
  S_IFLNK: number;
  S_ISGID: number;
  S_ISUID: number;

  // Additional error handling
  Error: typeof ErrorEnum; // To represent the Error enum
}

//#endregion
//#endregion

declare global {
  const USER_ARGUMENTS: UserArguments;
}
