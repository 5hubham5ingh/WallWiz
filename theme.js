import { exec as execAsync } from "../justjs/src/process.js";
import { getenv } from "std";
import { exec, stat, readdir } from "os";
import { ensureDir } from "../justjs/src/fs.js";
import Kitty from "./kitty.js";
import { exit } from "std";
import config from "./config.js";

print('theme.js')
class Theme {

  constructor(wallpaperDir, wallpaperNames) {
    this.picdir = wallpaperDir;
    this.picNames = wallpaperNames;
  }

  getThemeName(fileName, type) {
    return type !== undefined
      ? `${fileName}-${type ? "light" : "dark"}.conf`
      : [
        `${fileName}-light.conf`,
        `${fileName}-dark.conf`,
      ];
  }

  async createThemes(picDir, pics) {

    const makeThemePromises = [];
    for (const appName in config.getApps()) {
      const cachedThemes = readdir(config.getAppCacheDir(appName))[0].filter(
        (name) => name !== "." && name !== ".."
      );

      for (let i = 0; i < pics.length; i++) {
        const currPicName = pics[i];
        const currPicPath = picDir.concat(currPicName);
        const doesKittyThemeExists = this.getThemeName(currPicName).every(
          (cachedTheme) => cachedThemes.includes(cachedTheme)
        );
        !doesKittyThemeExists &&
          makeThemePromises.push(config.getApp(appName)?.createTheme(currPicPath, currPicName));
      }
    }
  }

  async setTheme(...rest) {
    for (const appName in config.getApps()) {
      await config.getApp(appName)?.setTheme(rest)
    }
  }


}

// const setColourTheme = (...rest) => kitty.setTheme(...rest)
//   .catch(e => { exec(['clear']); print(e) })
//
// const createThemesCache = async (...rest) => await kitty.createThemes(...rest)
//   .catch(e => { exec(['clear']); print(e) })
export { Theme };

// Resposibilities: 
// 1: constructor checks if themes exits or not, make them if missing
// 2: generate all the theme's colour and call the applications theme generator with it.
// 3: function to update colour theme for all the supported applications.
