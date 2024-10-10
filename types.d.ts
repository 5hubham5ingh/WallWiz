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

export type ColourCache = {
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
// Define the File interface
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

// Define the FileStatus interface
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

// Define the ExecOptions interface
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

// Enum for Error handling
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

interface EvalOptions {
  backtrace_barrier?: boolean;
}

interface URLGetOptions {
  binary?: boolean;
  full?: boolean;
}

interface ErrorOptions {
  errorno: Error;
}

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
