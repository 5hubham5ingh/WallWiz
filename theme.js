import { exec as execAsync } from "../justjs/src/process.js";
import { stat } from "os";
import config from "./config.js";
import cache from "./cache.js";
import { loadFile, open } from "std";

class Theme {
  constructor(wallpaperDir, wallpaperNames) {
    this.wallpaperDir = wallpaperDir;
    this.wallpaperNames = wallpaperNames;
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
    return stat(cachePath)[1] === 0;
  }

  async createAppThemesFromColours() {
    const getCachedColours = (cacheName) => {
      const cachePath = cache.wallColoursCacheDir.concat(cacheName, ".txt");
      if (this.areColoursCached(cacheName))
        return JSON.parse(loadFile(cachePath));
    }

    const cacheThemeConf = (content, path) => {
      const fileHandler = open(path, "w+");
      fileHandler.puts(content);
      fileHandler.close();
      // return execAsync(["echo", `"${content}"`, ">", path], { useShell: true });
    }

    const isThemeConfCached = (wallpaperName, scriptName) => {
      const cacheDir = cache.getCacheDir(scriptName).concat(this.getThemeName(wallpaperName, true));
      const scriptDir = config.getThemeExtensionScriptDirByScriptName(scriptName);
      const [cacheStat, err1] = stat(cacheDir);
      if (err1 !== 0) return false;
      const [scriptStat, err2] = stat(scriptDir);
      if (err2 !== 0) throw new Error(`Failed to read script status for: "${scriptName}"`);
      return cacheStat.mtime > scriptStat.mtime;
    }

    // const promises = [];
    for (let i = 0; i < this.wallpaperNames.length; i++) {
      const wallpaperName = this.wallpaperNames[i];
      const colours = getCachedColours(wallpaperName);
      if (!colours)
        throw new Error("failed to get cached color for " + wallpaperName);

      for (const scriptName in config.getThemeExtensionScripts()) {
        if (isThemeConfCached(wallpaperName, scriptName)) continue;
        const themeHandler = config.getThemeHandler(scriptName);
        const darkThemeConfig = themeHandler.getThemeConf(colours);
        const lightThemeConfig = themeHandler.getThemeConf(colours.toReversed());
        const cacheDir = cache.getCacheDir(scriptName);
        cacheThemeConf(lightThemeConfig, cacheDir.concat(this.getThemeName(wallpaperName, true)))
        cacheThemeConf(darkThemeConfig, cacheDir.concat(this.getThemeName(wallpaperName, false)))
        // promises.push(
        //   cacheThemeConf(
        //     lightThemeConfig,
        //     cacheDir.concat(this.getThemeName(wallpaperName, true))
        //   ),
        //   cacheThemeConf(
        //     darkThemeConfig,
        //     cacheDir.concat(this.getThemeName(wallpaperName, false))
        //   )
        // );
      }
    }

    // await Promise.all(promises);
  }


  async createColoursCacheFromWallpapers() {

    const getColoursFromWallpaper = async (wallpaperPath, wallpaperName) => {
      const getHexCode = (result) =>
        result
          .split("\n")
          .map((line) =>
            line
              .split(" ") // split lines
              .filter((word) => word[0] === "#")
              .join()
          )
          .filter((color) => color);

      return execAsync(
        `magick ${wallpaperPath} -format %c -depth 8 -colors 30 histogram:info:`
      ).then((result) => ({ [wallpaperName]: getHexCode(result) }));
    }

    // generate colours for each wallpaper
    const promises = [];
    for (let i = 0; i < this.wallpaperNames.length; i++) {
      const wallpaperName = this.wallpaperNames[i];
      const wallpaperPath = this.wallpaperDir.concat(wallpaperName);
      const doesCacheExist = this.areColoursCached(wallpaperName);
      !doesCacheExist &&
        promises.push(
          getColoursFromWallpaper(wallpaperPath, wallpaperName)
        );
    }

    //create colour cache
    await Promise.allSettled(promises).then(async (results) => {
      const promises = [];
      results.forEach((result) => {
        for (const colourName in result.value) {
          const colours = result.value[colourName];
          promises.push(execAsync(
            [
              "echo",
              `'${JSON.stringify(colours)}'`,
              ">",
              cache.wallColoursCacheDir.concat(colourName, ".txt"),
            ],
            { useShell: true }
          )
          )
        }
      });
      await Promise.all(promises);
    });
  }


  async setTheme(wallpaperName, enableLightTheme) {
    const themeName = this.getThemeName(wallpaperName, enableLightTheme);
    const promises = [];
    for (const scriptName in config.getThemeExtensionScripts()) {
      const themeHandler = config.getThemeHandler(scriptName);
      const currentThemePath = cache.getCacheDir(scriptName).concat(themeName);
      const doesCacheExists = stat(currentThemePath)[1] === 0;

      if (doesCacheExists)
        promises.push(themeHandler.setTheme(currentThemePath, execAsync));
      else throw new Error(`No theme exist in cache for ${wallpaperName}`);
    }
    await Promise.all(promises);
  }
}

export { Theme };
