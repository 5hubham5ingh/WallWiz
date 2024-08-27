import { exec as execAsync } from "../justjs/src/process.js";
import { stat } from "os";
import config from "./config.js";
import cache from "./cache.js";

class Theme {
  constructor(wallpaperDir, wallpaperNames) {
    this.wallpaperDir = wallpaperDir;
    this.wallpaperNames = wallpaperNames;
  }

  async init() {
    await this.createThemes();
  }

  getThemeName(fileName, type) {
    return type !== undefined
      ? `${fileName}-${type ? "light" : "dark"}.conf`
      : [`${fileName}-light.conf`, `${fileName}-dark.conf`];
  }

  async createThemes() {
    await this.createColoursFromWallpapers();
    const promises = [];
    for (let i = 0; i < this.wallpaperNames.length; i++) {
      const wallpaperName = this.wallpaperNames[i];
      const wallpaperPath = this.wallpaperDir.concat(wallpaperName);
      const colours = cache.getCachedColours(wallpaperName);
      if (!colours)
        throw new Error("failed to get cached color for " + wallpaperName);
      const lightColours = colours.toReversed();
      for (const appName in config.getApps()) {
        const app = config.getApp(appName);
        const darkThemeConfig = app.getThemeConf(colours);
        const lightThemeConfig = app.getThemeConf(lightColours);
        const cacheDir = cache.getAppCacheDir(appName);
        promises.push(
          this.writeThemeFile(
            lightThemeConfig,
            cacheDir.concat(this.getThemeName(wallpaperName, true))
          ),
          this.writeThemeFile(
            darkThemeConfig,
            cacheDir.concat(this.getThemeName(wallpaperName, false))
          )
        );
      }
    }

    await Promise.all(promises);
  }

  async writeThemeFile(content, path) {
    return execAsync(["echo", `"${content}"`, ">", path], { useShell: true });
  }

  async createColoursFromWallpapers() {
    // generate colours for each wallpaper
    const promises = [];
    for (let i = 0; i < this.wallpaperNames.length; i++) {
      const wallpaperName = this.wallpaperNames[i];
      const wallpaperPath = this.wallpaperDir.concat(wallpaperName);
      const doesCacheExist = cache.doesColoursCacheExist(wallpaperName);
      !doesCacheExist &&
        promises.push(
          this.getColoursFromWallpaper(wallpaperPath, wallpaperName)
        );
    }

    //create colour cache
    await Promise.allSettled(promises).then(async (results) => {
      const promises = [];
      results.forEach((result) => {
        for (const colourName in result.value) {
          const colours = result.value[colourName];
          promises.push(cache.setCachedColours(colourName, colours));
        }
      });
      await Promise.all(promises);
    });
  }

  async getColoursFromWallpaper(wallpaperPath, wallpaperName) {
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

  async setTheme(wallpaperName, enableLightTheme) {
    const themeName = this.getThemeName(wallpaperName, enableLightTheme);
    const promises = [];
    for (const appName in config.getApps()) {
      const currApp = config.getApp(appName);
      const currentThemePath = cache.getAppCacheDir(appName).concat(themeName);
      const doesCacheExists = stat(currentThemePath)[1] === 0;

      if (doesCacheExists)
        promises.push(currApp.setTheme(currentThemePath, execAsync));
      else throw new Error(`No theme exist in cache for ${wallpaperName}`);
    }
    await Promise.all(promises);
  }
}

export { Theme };
