import { getenv, loadFile } from "std";
import { exit } from "std";
import { exec, stat, readdir } from "os";
import * as os from 'os';
import * as std from 'std'
import { ensureDir } from "../justjs/src/fs.js";
import { exec as execAsync } from "../justjs/src/process.js";
import Kitty from "./kitty.js";
print('config.js')
const userDefinedApplications = {}; // TODO: Dynamically import from ~/.config/WallWiz/config.js

const defaultApps = {
  kitty: Kitty,

}

class Config {
  constructor() {
    this.cacheBaseDir = getenv("HOME").concat("/.cache/WallWiz");
    this.wallColoursCacheDir = this.cacheBaseDir.concat('/colours/')
    this.apps = { ...defaultApps, ...userDefinedApplications };
    this.appThemeCacheDir = {};
    for (const appName in this.apps) {
      this.createAppCacheDir(appName)
    }

    this.createWallColoursCacheDir()
  };

  createWallColoursCacheDir() {
    ensureDir(this.wallColoursCacheDir)
  }

  async setCachedColours(cacheName, colours) {
    return await execAsync(
      [
        "echo",
        `'${JSON.stringify(colours)}'`,
        ">",
        this.wallColoursCacheDir.concat(cacheName, '.txt'),
      ],
      { useShell: true }
    )
  }

  getCachedColours(cacheName) {
    const cachePath = this.wallColoursCacheDir.concat(cacheName, '.txt');
    if (this.doesColoursCacheExist(cacheName)) return JSON.parse(loadFile(cachePath))
  }

  doesColoursCacheExist(cacheName) {
    const cachePath = this.wallColoursCacheDir.concat(cacheName, '.txt');
    return stat(cachePath)[1] === 0;
  }

  createAppCacheDir(appName) {
    this.appThemeCacheDir[appName] = this.cacheBaseDir.concat(`/themes/${appName}/`);
    ensureDir(this.getAppCacheDir(appName));
  };

  getApps() {
    return this.apps;
  }

  getApp(appName) {
    return new this.apps[appName](os, std)
  }

  getAppCacheDir(app) {
    return this.appThemeCacheDir[app];
  }
}

export default new Config();
