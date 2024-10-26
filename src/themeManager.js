import utils from "./utils.js";
import workerPromise from "./promisifiedWorker.js";

/**
 * @typedef {import('./types.d.ts').ColoursCache} ColoursCache
 */

/**
 * Theme class manages colors and theme configurations of wallpapers
 */
"use strip";
class Theme {
  /**
   * Constructor for the Theme class
   * @param {string} wallpaperDir - Directory containing cached wallpapers
   * @param {Array} wallpaper - Array of wallpaper objects
   */
  constructor(wallpaperDir, wallpaper) {
    catchError(() => {
      this.wallpaperDir = wallpaperDir;
      this.wallpaper = wallpaper;
      this.cacheBaseDir = `${HOME_DIR}/.cache/WallWiz`;
      this.wallpaperColoursCacheFilePath = `${this.cacheBaseDir}/colours.json`;
      this.wallpaperThemeCacheDir = `${this.cacheBaseDir}/themes/`;
      this.appThemeCacheDir = {};
      this.themeExtensionScriptsBaseDir =
        `${HOME_DIR}/.config/WallWiz/themeExtensionScripts/`;
      this.themeExtensionScripts = {};
      /** @type {ColoursCache} */
      this.coloursCache = {};
    }, "Theme :: constructor");
  }

  async init() {
    return await catchAsyncError(async () => {
      utils.ensureDir(this.wallpaperThemeCacheDir);
      await this.createColoursCacheFromWallpapers();
      await this.loadThemeExtensionScripts();
      await this.createAppThemesFromColours();
    }, "Theme :: init");
  }

  async createColoursCacheFromWallpapers() {
    return await catchAsyncError(async () => {
      const getColoursFromWallpaper = async (wallpaperPath) => {
        return await catchAsyncError(async () => {
          const result = await execAsync(
            `magick ${wallpaperPath} -format %c -depth 8 -colors 30 histogram:info:`,
          );
          return result.split("\n")
            .flatMap((line) =>
              line.split(" ").filter((word) => word.startsWith("#"))
            )
            .filter(Boolean);
        }, "getColoursFromWallpaper");
      };

      const queue = this.wallpaper
        .filter((wp) => !this.getCachedColours(wp.uniqueId))
        .map((wp) => async () => {
          await catchAsyncError(async () => {
            const wallpaperPath = `${this.wallpaperDir}${wp.uniqueId}`;
            const colours = await getColoursFromWallpaper(wallpaperPath);
            this.coloursCache[wp.uniqueId] = colours;
          }, "Generate colour cache task for : " + wp.name);
        });

      if (queue.length) {
        utils.log("Extracting colours from wallpapers...");
        await utils.promiseQueueWithLimit(queue);
        utils.writeFile(
          JSON.stringify(this.coloursCache),
          this.wallpaperColoursCacheFilePath,
        );
        utils.log("Done.");
      }
    }, "createColoursCacheFromWallpapers");
  }

  async loadThemeExtensionScripts() {
    await catchAsyncError(async () => {
      utils.ensureDir(this.themeExtensionScriptsBaseDir);
      const scriptNames = OS.readdir(this.themeExtensionScriptsBaseDir)[0]
        .filter((name) => name.endsWith(".js") && !name.startsWith("."));

      for (const fileName of scriptNames) {
        const extensionPath = `${this.themeExtensionScriptsBaseDir}${fileName}`;
        await catchError(() => {

          const extensionScript = {
            setTheme: async (...all) =>
              await catchAsyncError(async () =>
                await workerPromise({
                  scriptPath: extensionPath,
                  functionName: "setTheme",
                  args: all,
                }), "setTheme"),

            getDarkThemeConf: async (...all) =>
              await catchAsyncError(async () =>
                await workerPromise({
                  scriptPath: extensionPath,
                  functionName: "getDarkThemeConf",
                  args: all,
                }), "getDarkThemeConf"),

            getLightThemeConf: async (...all) =>
              await catchAsyncError(async () =>
                await workerPromise({
                  scriptPath: extensionPath,
                  functionName: "getLightThemeConf",
                  args: all,
                }), "getLightThemeConf"),
          };
          this.themeExtensionScripts[fileName] = extensionScript;
          this.appThemeCacheDir[fileName] =
            `${this.wallpaperThemeCacheDir}${fileName}/`;
          utils.ensureDir(this.appThemeCacheDir[fileName]);
        }, extensionPath);
      }
    }, "loadThemeExtensionScripts");
  }

  async createAppThemesFromColours() {
    await catchAsyncError(async () => {
      const isThemeConfCached = (wallpaperName, scriptName) => {
        return catchError(() => {
          const cacheDir = `${this.appThemeCacheDir[scriptName]}${
            this.getThemeName(wallpaperName, "light")
          }`;
          const scriptDir = `${this.themeExtensionScriptsBaseDir}${scriptName}`;
          const [cacheStat, cacheErr] = OS.stat(cacheDir);
          const [scriptStat, scriptErr] = OS.stat(scriptDir);

          if (scriptErr !== 0) {
            throw new Error(
              "Failed to read script status.\n" +
                `Script name: ${scriptName}`,
            );
          }
          return cacheErr === 0 && cacheStat.mtime > scriptStat.mtime;
        }, "isThemeConfCached");
      };

      for (const wp of this.wallpaper) {
        const colours = this.getCachedColours(wp.uniqueId);
        if (!colours) {
          throw new Error(
            "Cache miss\n" +
              `Wallpaper: ${wp.name}, Colours cache id: ${wp.uniqueId}`,
          );
        }

        for (
          const [scriptName, themeHandler] of Object.entries(
            this.themeExtensionScripts,
          )
        ) {
          if (isThemeConfCached(wp.uniqueId, scriptName)) continue;

          utils.log(
            `Generating theme configuration files using ${scriptName}...`,
          );
          try {
            const [darkThemeConfig, lightThemeConfig] = await Promise.all([
              themeHandler?.getDarkThemeConf(colours),
              themeHandler?.getLightThemeConf(colours),
            ]);
            print("themeconfig: ", JSON.stringify(darkThemeConfig));
            const cacheDir = this.appThemeCacheDir[scriptName];
            utils.writeFile(
              lightThemeConfig,
              `${cacheDir}${this.getThemeName(wp.uniqueId, "light")}`,
            );
            utils.writeFile(
              darkThemeConfig,
              `${cacheDir}${this.getThemeName(wp.uniqueId, "dark")}`,
            );
            utils.log(`Done generating theme for ${scriptName}`);
          } catch (error) {
            await utils.notify(
              `Failed to generate theme config for: ${scriptName}`,
              error,
              "critical",
            );
          }
        }
      }
    }, "createAppThemesFromColours");
  }

  /**
   * Set the theme for a given wallpaper
   * @param {string} wallpaperName - Name of the wallpaper
   */
  async setThemes(wallpaperName) {
    await catchAsyncError(async () => {
      const themeName = this.getThemeName(wallpaperName);

      const setTheme = async ([scriptName, themeHandler]) => {
        await catchAsyncError(async () => {
          const currentThemePath = `${
            this.appThemeCacheDir[scriptName]
          }${themeName}`;

          const [, err] = OS.stat(currentThemePath);

          if (err === 0) {
            await themeHandler.setTheme(currentThemePath);
          } else {
            throw new Error(
              "Cache miss\n" +
                `Wallpaper: ${wallpaperName}. Theme path: ${currentThemePath}.`,
            );
          }
        }, "setTheme");
      };

      const promises = Object.entries(this.themeExtensionScripts).map(async (...all) => await setTheme(...all));
      await utils.promiseQueueWithLimit(promises) 
    }, "setThemes");
  }

  /**
   * Get the theme name based on wallpaper and theme type
   * @param {string} fileName - Name of the wallpaper file
   * @param {"light" | "dark"} [type] - Type of theme (light or dark)
   * @returns {string} Theme name
   */
  getThemeName(fileName, type) {
    return catchError(() => {
      const themeType = type === undefined
        ? (USER_ARGUMENTS.enableLightTheme ? "light" : "dark")
        : (type === "light" ? "light" : "dark");
      return `${fileName}-${themeType}.conf`;
    }, "getThemeName");
  }

  /**
   * Get cached colours for a wallpaper
   * @param {string} cacheName - Unique identifier for the wallpaper
   * @returns {string[] | null} Array of colour hex codes or null if not found
   */
  getCachedColours(cacheName) {
    return catchError(() => {
      if (this.coloursCache[cacheName]) return this.coloursCache[cacheName];

      const cacheContent = STD.loadFile(this.wallpaperColoursCacheFilePath);
      if (!cacheContent) {
        return null;
      }
      this.coloursCache = JSON.parse(cacheContent) || {};

      return this.coloursCache[cacheName] || null;
    }, "getCachedColours");
  }
}

export { Theme };
