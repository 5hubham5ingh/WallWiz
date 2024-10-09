import * as std from 'std'
import * as os from 'os'

globalThis.os = os;
globalThis.std = std;
export const HOME_DIR = std.getenv("HOME")
