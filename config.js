import { readdir } from "os";
import * as os from "os";
import * as std from "std";
import cache from "./cache.js";
import { getenv } from "std";
import { ensureDir } from "../justjs/src/fs.js";

class Config {
  constructor() {
    this.themeExtensionScripts = {};
    this.wallpaperDaemonHandler;
  }

  static async create() {
    const config = new Config();
    await config.loadThemeExtensionScripts();
    await config.loadWallpaperDaemonHandlerScript();
    return config;
  }

  async loadWallpaperDaemonHandlerScript() {
    const extensionDir = getenv("HOME").concat("/.config/WallWiz/");
    ensureDir(extensionDir)
    const scriptNames = readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith('.js'));
    if (scriptNames.length > 1) throw new Error(`Too many scripts found in the ${extensionDir}. \nP`)
    if (scriptNames.length) {
      const extensionPath = extensionDir.concat(scriptNames[0]);
      const wallpaperDaemonHandler = (await import(extensionPath)).default;
      this.wallpaperDaemonHandler = new wallpaperDaemonHandler(os, std);
    } else {
      throw new Error("Failed to find any wallpaper daemon handler script in " + extensionDir)
    }
  }

  async loadThemeExtensionScripts() {
    const extensionDir = getenv("HOME").concat("/.config/WallWiz/themeExtensionScripts/");
    ensureDir(extensionDir)
    const scriptNames = readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith('.js'));
    for (const fileName of scriptNames) {
      const extensionPath = extensionDir.concat(fileName);
      const app = (await import(extensionPath)).default;
      this.themeExtensionScripts[fileName] = app;
      cache.createCacheDir(fileName);
    }
  }

  getThemeExtensionScripts() {
    return this.themeExtensionScripts;
  }

  getThemeHandler(scriptName) {
    return new this.themeExtensionScripts[scriptName](os, std);
  }
}

const config = await Config.create().catch(e => { print(e); throw e; })
export default config;
