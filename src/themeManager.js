import utils from "./utils.js";
import workerPromise from "./promisifiedWorker.js";
import Color from "./Color/color.js";

/**
 * @typedef {import('./types.d.ts').ColoursCache} ColoursCache
 */

/**
 * Theme class manages colors and theme configurations of wallpapers
 */
("use strip");
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
      this.themeExtensionScriptsBaseDir = `${HOME_DIR}/.config/WallWiz/themeExtensionScripts/`;
      this.themeExtensionScripts = {};
      /** @type {ColoursCache} */
      this.coloursCache = {};
    }, "Theme :: constructor");
  }

  async init() {
    return await catchAsyncError(async () => {
      utils.ensureDir(this.wallpaperThemeCacheDir);
      await this.createColoursCacheFromWallpapers();
      this.loadThemeExtensionScripts();
      await this.createAppThemesFromColours();
    }, "Theme :: init");
  }

  async createColoursCacheFromWallpapers() {
    return await catchAsyncError(async () => {
      const getColoursFromWallpaper = async (wallpaperPath) => {
        return await catchAsyncError(async () => {
          const result = await execAsync(
            USER_ARGUMENTS.colorExtractionCommand.replace("{}", wallpaperPath)
          );
          return result
            .split("\n")
            .flatMap((line) =>
              line.split(" ").filter((word) => Color(word).isValid())
            )
            .filter(Boolean)
            .map((color) => Color(color).toHexString());
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
          this.wallpaperColoursCacheFilePath
        );
        utils.log("Done.");
      }
    }, "createColoursCacheFromWallpapers");
  }

  loadThemeExtensionScripts() {
    catchError(() => {
      utils.ensureDir(this.themeExtensionScriptsBaseDir);
      const scriptNames = OS.readdir(
        this.themeExtensionScriptsBaseDir
      )[0].filter((name) => name.endsWith(".js") && !name.startsWith("."));

      for (const fileName of scriptNames) {
        const extensionPath = `${this.themeExtensionScriptsBaseDir}${fileName}`;
        const extensionScript = {
          setTheme: async (...all) =>
            await catchAsyncError(
              async () =>
                await workerPromise({
                  scriptPath: extensionPath,
                  functionNames: ["setTheme"],
                  args: all,
                }),
              "setTheme"
            ),

          getThemes: async (...all) =>
            await catchAsyncError(
              async () =>
                await workerPromise({
                  scriptPath: extensionPath,
                  functionNames: ["getDarkThemeConf", "getLightThemeConf"],
                  args: all,
                }),
              "getTheme"
            ),
        };
        this.themeExtensionScripts[fileName] = extensionScript;
        this.appThemeCacheDir[
          fileName
        ] = `${this.wallpaperThemeCacheDir}${fileName}/`;
        utils.ensureDir(this.appThemeCacheDir[fileName]);
      }
    }, "loadThemeExtensionScripts");
  }

  async createAppThemesFromColours() {
    await catchAsyncError(async () => {
      const isThemeConfCached = (wallpaperName, scriptName) => {
        return catchError(() => {
          const cacheDir = `${
            this.appThemeCacheDir[scriptName]
          }${this.getThemeName(wallpaperName, "light")}`;
          const scriptDir = `${this.themeExtensionScriptsBaseDir}${scriptName}`;
          const [cacheStat, cacheErr] = OS.stat(cacheDir);
          const [scriptStat, scriptErr] = OS.stat(scriptDir);

          if (scriptErr !== 0) {
            throw new Error(
              "Failed to read script status.\n" + `Script name: ${scriptName}`
            );
          }
          return cacheErr === 0 && cacheStat.mtime > scriptStat.mtime;
        }, "isThemeConfCached");
      };

      const createThemeConfFromWallpaperColours = async (
        wallpaper,
        colours
      ) => {
        await catchAsyncError(async () => {
          for (const [scriptName, themeHandler] of Object.entries(
            this.themeExtensionScripts
          )) {
            if (isThemeConfCached(wallpaper.uniqueId, scriptName)) continue;

            utils.log(
              `Generating theme config for wallpaper: "${wallpaper.name}" using "${scriptName}".`
            );
            const [darkThemeConfig, lightThemeConfig] =
              await themeHandler.getThemes(colours);
            const cacheDir = this.appThemeCacheDir[scriptName];
            utils.writeFile(
              lightThemeConfig,
              `${cacheDir}${this.getThemeName(wallpaper.uniqueId, "light")}`
            );
            utils.writeFile(
              darkThemeConfig,
              `${cacheDir}${this.getThemeName(wallpaper.uniqueId, "dark")}`
            );
          }
        }, "createThemeConfFromWallpaperColours");
      };

      const getTaskPromiseCallBacks = [];
      for (const wallpaper of this.wallpaper) {
        const colours = this.getCachedColours(wallpaper.uniqueId);
        if (!colours) {
          throw new Error(
            "Cache miss\n" +
              `Wallpaper: ${wallpaper.name}, Colours cache id: ${wallpaper.uniqueId}`
          );
        }

        getTaskPromiseCallBacks.push(() =>
          createThemeConfFromWallpaperColours(wallpaper, colours)
        );
      }
      await utils.promiseQueueWithLimit(getTaskPromiseCallBacks);
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
          const cachedThemePath = `${this.appThemeCacheDir[scriptName]}${themeName}`;

          const [, err] = OS.stat(cachedThemePath);

          if (err === 0) {
            await themeHandler.setTheme(cachedThemePath).catch((error) =>
              error instanceof SystemError
                ? utils.notify(
                    `Error in "${scriptName}"`,
                    `${error.name ?? ""}: ${error.description ?? ""}\n ${
                      error.body ?? ""
                    }`,
                    "critical"
                  )
                : (() => {
                    throw error;
                  })()
            );
          } else {
            throw new Error(
              "Cache miss\n" +
                `Wallpaper: ${wallpaperName}. Theme path: ${cachedThemePath}.`
            );
          }
        }, "setTheme");
      };

      const getTaskPromiseCallBacks = Object.entries(
        this.themeExtensionScripts
      ).map(
        (...all) =>
          async () =>
            await setTheme(...all)
      );
      await utils.promiseQueueWithLimit(getTaskPromiseCallBacks);
      await utils.notify("Theme applied.");
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
      const themeType =
        type === undefined
          ? USER_ARGUMENTS.enableLightTheme
            ? "light"
            : "dark"
          : type === "light"
          ? "light"
          : "dark";
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
