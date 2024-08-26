import { loadFile } from "std";
import { stat } from "os";
import { ensureDir } from "../justjs/src/fs.js";
import { exec as execAsync } from "../justjs/src/process.js";
import { getenv } from "std";
print('cache.js')
class Catch {
  constructor() {
    this.baseDir = getenv("HOME").concat("/.cache/WallWiz");
    this.wallColoursCacheDir = this.baseDir.concat("/colours/");
    this.createWallColoursCacheDir();
    this.appThemeCacheDir = {};
  }

  createWallColoursCacheDir() {
    ensureDir(this.wallColoursCacheDir);
  }

  async setCachedColours(cacheName, colours) {
    return await execAsync(
      [
        "echo",
        `'${JSON.stringify(colours)}'`,
        ">",
        this.wallColoursCacheDir.concat(cacheName, ".txt"),
      ],
      { useShell: true }
    );
  }

  getCachedColours(cacheName) {
    const cachePath = this.wallColoursCacheDir.concat(cacheName, ".txt");
    if (this.doesColoursCacheExist(cacheName))
      return JSON.parse(loadFile(cachePath));
  }

  doesColoursCacheExist(cacheName) {
    const cachePath = this.wallColoursCacheDir.concat(cacheName, ".txt");
    return stat(cachePath)[1] === 0;
  }

  createAppCacheDir(appName) {
    this.appThemeCacheDir[appName] = this.baseDir.concat(
      `/themes/${appName}/`
    );
    ensureDir(this.getAppCacheDir(appName));
  }

  getAppCacheDir(app) {
    return this.appThemeCacheDir[app];
  }
}
const cache = new Catch()
export default cache
