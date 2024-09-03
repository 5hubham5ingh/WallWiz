import { ensureDir } from "../justjs/src/fs.js";
import { getenv } from "std";

"use strip";

class Catch {
  constructor() {
    this.baseDir = getenv("HOME").concat("/.cache/WallWiz");
    this.wallColoursCacheDir = this.baseDir.concat("/colours/");
    this.picCacheDir = this.baseDir.concat("/pic/");
    this.ensureCacheDir();
    this.appThemeCacheDir = {};
  }

  ensureCacheDir() {
    ensureDir(this.wallColoursCacheDir);
    ensureDir(this.picCacheDir);
  }

  createCacheDir(appName) {
    this.appThemeCacheDir[appName] = this.baseDir.concat(
      `/themes/${appName}/`,
    );
    ensureDir(this.getCacheDir(appName));
  }

  getCacheDir(app) {
    return this.appThemeCacheDir[app];
  }
}
const cache = new Catch();
export default cache;
