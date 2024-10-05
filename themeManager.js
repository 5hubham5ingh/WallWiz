import { exec as execAsync } from "../justjs/src/process.js";
import config from "./config.js";
import { os, std } from "./quickJs.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import { notify, promiseQueueWithLimit, writeFile } from "./utils.js";
import { ensureDir } from "../justjs/src/fs.js";

"use strip";

class Theme {
  constructor(wallpaperDir, wallpaper, enableLightTheme) {
    this.wallpaperDir = wallpaperDir;
    this.wallpaper = wallpaper;
    this.enableLightTheme = enableLightTheme;
    this.cacheBaseDir = std.getenv("HOME").concat("/.cache/WallWiz")
    this.wallpaperColoursCacheDir = this.cacheBaseDir.concat("/colours/");
    this.wallpaperThemeCacheDir = this.cacheBaseDir.concat("/themes/");
    ensureDir(this.wallpaperColoursCacheDir)
    ensureDir(this.wallpaperThemeCacheDir)
    this.appThemeCacheDir = {};
  }

  async init() {
    await this.createColoursCacheFromWallpapers();
    await this.createAppThemesFromColours();
  }

  async createColoursCacheFromWallpapers() {
    const getColoursFromWallpaper = async (wallpaperPath) => {
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

    const queue = [];
    for (let i = 0; i < this.wallpaper.length; i++) {
      const wallpaperName = this.wallpaper[i].uniqueId;
      const wallpaperPath = this.wallpaperDir.concat(wallpaperName);
      const doesCacheExist = this.areColoursCached(wallpaperName);

      if (doesCacheExist) continue;
      queue.push(
        () =>
          getColoursFromWallpaper(wallpaperPath).then(
            (colours) => {
              writeFile(
                JSON.stringify(colours),
                this.wallpaperColoursCacheDir.concat(wallpaperName, ".txt"),
              );
            },
          ),
      );
    }

    if (!queue.length) return;

    print("Extracting colours from wallpapers...");
    await promiseQueueWithLimit(queue);
    print("Done");
  }

  async createAppThemesFromColours() {
    const getCachedColours = (cacheName) => {
      const cachePath = this.wallpaperColoursCacheDir.concat(cacheName, ".txt");
      if (this.areColoursCached(cacheName)) {
        return JSON.parse(std.loadFile(cachePath));
      }
    };

    const isThemeConfCached = (wallpaperName, scriptName) => {
      const cacheDir = this.getCacheDirectoryOfThemeConfigFileFromAppName(
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

    print("Generating theme configuration files...");

    for (let i = 0; i < this.wallpaper.length; i++) {
      const wallpaperName = this.wallpaper[i].uniqueId;
      const colours = getCachedColours(wallpaperName);
      if (!colours) {
        throw new Error("failed to get cached color for " + wallpaperName);
      }

      for (const scriptName in config.getThemeExtensionScripts()) {
        if (isThemeConfCached(wallpaperName, scriptName)) continue;
        const themeHandler = config.getThemeHandler(scriptName);
        try {
          const darkThemeConfig = await themeHandler.getDarkThemeConf(colours);
          const lightThemeConfig = await themeHandler.getLightThemeConf(
            colours,
          );
          const cacheDir = this.getCacheDirectoryOfThemeConfigFileFromAppName(
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
        } catch (error) {
          await notify("Error in: " + scriptName, error);
          throw error;
        }
      }
    }
    print("Done");
  }

  async setTheme(wallpaperName) {
    const themeName = this.getThemeName(wallpaperName);
    const promises = [];
    for (const scriptName in config.getThemeExtensionScripts()) {
      const themeHandler = config.getThemeHandler(scriptName);
      const currentThemePath = this
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
    promises.push(notify("WallWiz", "Theme applied"));
    await Promise.all(promises);
  }

  getThemeName(fileName, type) {
    return type === undefined
      ? `${fileName}-${this.enableLightTheme ? "light" : "dark"}.conf`
      : `${fileName}-${type ? "light" : "dark"}.conf`;
  }

  areColoursCached(cacheName) {
    const cachePath = this.wallpaperColoursCacheDir.concat(cacheName, ".txt");
    return os.stat(cachePath)[1] === 0;
  }

  createCacheDirrectoryForAppThemeConfigFileFromAppName(appName) {
    this.appThemeCacheDir[appName] = this.wallpaperColoursCacheDir.concat(`/${appName}/`);
    ensureDir(this.appThemeCacheDir[appName])
  }

  getCacheDirectoryOfThemeConfigFileFromAppName(app) {
    return this.appThemeCacheDir[app];
  }
}

export { Theme };
