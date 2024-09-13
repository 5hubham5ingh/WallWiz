import cache from "./cache.js";
import { ensureDir } from "../justjs/src/fs.js";
import { os, std } from "./quickJs.js";

"use strip";

class Config {
  constructor() {
    this.homeDir = std.getenv("HOME");
    this.themeExtensionScripts = {};
    this.wallpaperDaemonHandler;
    this.themeExtensionScriptsBaseDir = this.homeDir.concat(
      "/.config/WallWiz/themeExtensionScripts/",
    );
    this.processLimit;
  }

  static async create() {
    const config = new Config();
    await config.loadThemeExtensionScripts();
    await config.loadWallpaperDaemonHandlerScript();
    await config.getProcessLimit();
    return config;
  }

  async getProcessLimit() {
    this.processLimit = await execAsync(['nproc'])
      .then(threads => parseInt(threads, 10))
      .catch(e => {
        print('Failed to get process limit. \nUsing default value of 4.', e);
        return 4;
      })
  }

  async loadWallpaperDaemonHandlerScript() {
    const extensionDir = std.getenv("HOME").concat("/.config/WallWiz/");
    ensureDir(extensionDir);
    const scriptNames = os.readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith(".js"));
    if (scriptNames.length > 1) {
      throw new Error(`Too many scripts found in the ${extensionDir}.`);
    }
    if (scriptNames.length) {
      const extensionPath = extensionDir.concat(scriptNames[0]);
      const wallpaperDaemonHandler = await import(extensionPath);
      if (!wallpaperDaemonHandler.default) {
        print("No default export found in ", extensionPath);
        std.exit(2);
      }
      this.wallpaperDaemonHandler = wallpaperDaemonHandler.default;
    } else {
      print(
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
    const scriptNames = os.readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith(".js"));
    for (const fileName of scriptNames) {
      const extensionPath = extensionDir.concat(fileName);
      const script = await import(extensionPath);
      if (!script.setTheme) {
        print("No setTheme handler function found in ", extensionPath);
        std.exit(2);
      }
      if (!script.getThemeConf) {
        print("No getThemeConf function found in ", extensionPath);
        std.exit(2);
      }
      this.themeExtensionScripts[fileName] = script;
      cache.createCacheDirrectoryForAppThemeConfigFileFromAppName(fileName);
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
