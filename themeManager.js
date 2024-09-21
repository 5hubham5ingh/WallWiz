import { exec as execAsync } from "../justjs/src/process.js";
import config from "./config.js";
import cache from "./cache.js";
import { os, std } from "./quickJs.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import { promiseQueueWithLimit, writeFile } from "./utils.js";

"use strip";

class Theme {
  constructor(wallpaperDir, wallpaper) {
    this.wallpaperDir = wallpaperDir;
    this.wallpaper = wallpaper;
  }

  async init() {
    await this.createColoursCacheFromWallpapers();
    await this.createAppThemesFromColours();
  }

  getThemeName(fileName, type) {
    return type !== undefined
      ? `${fileName}-${type ? "light" : "dark"}.conf`
      : [`${fileName}-light.conf`, `${fileName}-dark.conf`];
  }

  areColoursCached(cacheName) {
    const cachePath = cache.wallColoursCacheDir.concat(cacheName, ".txt");
    return os.stat(cachePath)[1] === 0;
  }


  async createAppThemesFromColours() {
    const getCachedColours = (cacheName) => {
      const cachePath = cache.wallColoursCacheDir.concat(cacheName, ".txt");
      if (this.areColoursCached(cacheName)) {
        return JSON.parse(std.loadFile(cachePath));
      }
    };

    const isThemeConfCached = (wallpaperName, scriptName) => {
      const cacheDir = cache.getCacheDirectoryOfThemeConfigFileFromAppName(
        scriptName,
      ).concat(
        this.getThemeName(wallpaperName, true),
      );
      const scriptDir = config.getThemeExtensionScriptDirByScriptName(
        scriptName,
      );
      const [cacheStat, err1] = os.stat(cacheDir);
      if (err1 !== 0) return false;
      const [scriptStat, err2] = os.stat(scriptDir);
      if (err2 !== 0) {
        throw new Error(`Failed to read script status for: "${scriptName}"`);
      }
      return cacheStat.mtime > scriptStat.mtime;
    };

    for (let i = 0; i < this.wallpaper.length; i++) {
      const wallpaperName = this.wallpaper[i].uniqueId;
      const colours = getCachedColours(wallpaperName);
      if (!colours) {
        throw new Error("failed to get cached color for " + wallpaperName);
      }

      for (const scriptName in config.getThemeExtensionScripts()) {
        if (isThemeConfCached(wallpaperName, scriptName)) continue;
        const themeHandler = config.getThemeHandler(scriptName);
        const darkThemeConfig = themeHandler.getThemeConf(colours);
        const lightThemeConfig = themeHandler.getThemeConf(
          colours.toReversed(),
        );
        const cacheDir = cache.getCacheDirectoryOfThemeConfigFileFromAppName(
          scriptName,
        );
        writeFile(
          lightThemeConfig,
          cacheDir.concat(this.getThemeName(wallpaperName, true)),
        );
        writeFile(
          darkThemeConfig,
          cacheDir.concat(this.getThemeName(wallpaperName, false)),
        );
      }
    }
  }

  async createColoursCacheFromWallpapers() {
    const getColoursFromWallpaper = async (wallpaperPath, wallpaperName) => {
      const getHexCode = (result) =>
        result
          .split("\n")
          .map((line) =>
            line
              .split(" ")
              .filter((word) => word[0] === "#")
              .join()
          )
          .filter((color) => color);

      return execAsync(
        `magick ${wallpaperPath} -format %c -depth 8 -colors 30 histogram:info:`,
      ).then((result) => getHexCode(result));
    };

    // generate colours for each wallpaper
    const queue = [];
    for (let i = 0; i < this.wallpaper.length; i++) {
      const wallpaperName = this.wallpaper[i].uniqueId;
      const wallpaperPath = this.wallpaperDir.concat(wallpaperName);
      const doesCacheExist = this.areColoursCached(wallpaperName);

      if (doesCacheExist) continue;
      queue.push(
        () =>
          getColoursFromWallpaper(wallpaperPath, wallpaperName).then(
            (colours) => {
              writeFile(
                JSON.stringify(colours),
                cache.wallColoursCacheDir.concat(wallpaperName, ".txt"),
              );
            },
          ),
      );
    }

    await promiseQueueWithLimit(queue, config.processLimit);
  }

  async setTheme(wallpaperName, enableLightTheme) {
    const themeName = this.getThemeName(wallpaperName, enableLightTheme);
    const promises = [];
    for (const scriptName in config.getThemeExtensionScripts()) {
      const themeHandler = config.getThemeHandler(scriptName);
      const currentThemePath = cache
        .getCacheDirectoryOfThemeConfigFileFromAppName(scriptName).concat(
          themeName,
        );
      const doesCacheExists = os.stat(currentThemePath)[1] === 0;

      if (doesCacheExists) {
        promises.push(themeHandler.setTheme(currentThemePath, execAsync));
      } else {
        print(clearTerminal, "cache miss: ", currentThemePath, ":end");
        std.exit();
        throw new Error(`No theme exist in cache for ${wallpaperName}`);
      }
    }
    await Promise.all(promises);
  }
}

export { Theme };
