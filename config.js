import { readdir, realpath } from "os";
import * as os from "os";
import * as std from "std";
import cache from "./cache.js";
import { getenv } from "std";
import { ensureDir } from "../justjs/src/fs.js";

print("config.js");

class Config {
  constructor() {
    this.cache = cache;
    this.apps = {};
  }

  static async create() {
    const config = new Config();
    await config.loadApps();
    return config;
  }

  async loadApps() {
    const extensionDir = getenv("HOME").concat("/.config/WallWiz/");
    print('ensured', extensionDir)
    ensureDir(extensionDir)
    const themeExtensionApps = readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith('.js'));
    for (const fileName of themeExtensionApps) {
      const app = (await import(fileName)).default;
      this.apps[fileName] = app;
      this.cache.createAppCacheDir(fileName);
    }
  }

  getApps() {
    return this.apps;
  }

  getApp(appName) {
    return new this.apps[appName](os, std);
  }
}

const config = await Config.create()
export default config;
