import { getenv } from "std";
import { exit } from "std";
import { exec, stat, readdir } from "os";
import { ensureDir } from "../justjs/src/fs.js";
import Kitty from "./kitty.js";
print('config.js')
const userDefinedApplications = {}; // TODO: Dynamically import from ~/.config/WallWiz/config.js

const defaultApps = {
  kitty: new Kitty(),

}

class Config {
  constructor() {
    this.cacheBaseDir = getenv("HOME").concat("/.cache/WallWiz");
    this.apps = { ...defaultApps, ...userDefinedApplications };
    this.appCacheDir = {};
    for (const appName in this.appList) {
      this.createAppCacheDir(appName)
      this.initApps(appName)
    }
  };

  createAppCacheDir(appName) {
    this.appCacheDir[appName] = this.cacheBaseDir.concat(`/${appName}/`);
    ensureDir(this.cacheDir[appName]);
  };

  initApps(appName) {
    const cacheDir = this.getAppCacheDir(appName)
    this.apps[appName].setCacheDir(cacheDir);
  };

  getApps() {
    return this.apps;
  }

  getApp(appName) {
    return this.apps[appName]
  }

  getAppCacheDir(app) {
    return this.appCacheDir[app];
  }
}

export default new Config();
