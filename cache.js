import { ensureDir } from "../justjs/src/fs.js";
import { std } from "./quickJs.js";
"use strip";

class Catch {
  constructor() {
    this.homeDir = std.getenv("HOME");
    this.baseDir = this.homeDir.concat("/.cache/WallWiz");
    this.wallColoursCacheDir = this.baseDir.concat("/colours/");
    this.picCacheDir = this.baseDir.concat("/pic/");
    this.ensureCacheDir();
    this.appThemeCacheDir = {};
  }

  ensureCacheDir() {
    ensureDir(this.wallColoursCacheDir);
    ensureDir(this.picCacheDir);
  }

  createCacheDirrectoryForAppThemeConfigFileFromAppName(appName) {
    this.appThemeCacheDir[appName] = this.baseDir.concat(
      `/themes/${appName}/`,
    );
    ensureDir(this.getCacheDirectoryOfThemeConfigFileFromAppName(appName));
  }

  getCacheDirectoryOfThemeConfigFileFromAppName(app) {
    return this.appThemeCacheDir[app];
  }
}
const cache = new Catch();
export default cache;
