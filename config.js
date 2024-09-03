import { readdir } from "os";
import cache from "./cache.js";
import { exit, getenv } from "std";
import { ensureDir } from "../justjs/src/fs.js";

"use strip";

class Config {
  constructor() {
    this.themeExtensionScripts = {};
    this.wallpaperDaemonHandler;
    this.themeExtensionScriptsBaseDir = getenv("HOME").concat(
      "/.config/WallWiz/themeExtensionScripts/",
    );
  }

  static async create() {
    const config = new Config();
    await config.loadThemeExtensionScripts();
    await config.loadWallpaperDaemonHandlerScript();
    return config;
  }

  async loadWallpaperDaemonHandlerScript() {
    const extensionDir = getenv("HOME").concat("/.config/WallWiz/");
    ensureDir(extensionDir);
    const scriptNames = readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith(".js"));
    if (scriptNames.length > 1) {
      throw new Error(`Too many scripts found in the ${extensionDir}.`);
    }
    if (scriptNames.length) {
      const extensionPath = extensionDir.concat(scriptNames[0]);
      const wallpaperDaemonHandler = await import(extensionPath);
      if (!wallpaperDaemonHandler.default) {
        print("No default export found in ", extensionPath);
        exit(2);
      }
      this.wallpaperDaemonHandler = wallpaperDaemonHandler.default;
    } else {
      throw new Error(
        "Failed to find any wallpaper daemon handler script in " + extensionDir,
      );
    }
  }

  getThemeExtensionScriptDirByScriptName(scriptName) {
    return this.themeExtensionScriptsBaseDir.concat(scriptName);
  }

  async loadThemeExtensionScripts() {
    const extensionDir = this.themeExtensionScriptsBaseDir;
    ensureDir(extensionDir);
    const scriptNames = readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith(".js"));
    for (const fileName of scriptNames) {
      const extensionPath = extensionDir.concat(fileName);
      const script = await import(extensionPath);
      if (!script.setTheme) {
        print("No setTheme handler function found in ", extensionPath);
        exit(2);
      }
      if (!script.getThemeConf) {
        print("No getThemeConf function found in ", extensionPath);
        exit(2);
      }
      this.themeExtensionScripts[fileName] = script;
      cache.createCacheDir(fileName);
    }
  }

  getThemeExtensionScripts() {
    return this.themeExtensionScripts;
  }

  getThemeHandler(scriptName) {
    return this.themeExtensionScripts[scriptName];
  }
}

const config = await Config.create().catch((e) => {
  print(e);
  throw e;
});
export default config;
