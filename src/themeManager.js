import utils from "./utils.js";
import { ensureDir } from "../../justjs/src/fs.js";

/**
 * @typedef {import('./types.d.ts').ColoursCache} ColoursCache
 */

/**
 * Theme class manages colors and theme configurations of wallpapers
 */
class Theme {
  /**
   * Constructor for the Theme class
   * @param {string} wallpaperDir - Directory containing cached wallpapers
   * @param {Array} wallpaper - Array of wallpaper objects
   */
  constructor(wallpaperDir, wallpaper) {
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
  }

  /**
   * Initialize the Theme instance
   */
  async init() {
    try {
      ensureDir(this.wallpaperThemeCacheDir);
      await this.createColoursCacheFromWallpapers();
      await this.loadThemeExtensionScripts();
      await this.createAppThemesFromColours();
    } catch (error) {
      throw new Error("Failed to initialize Theme:\n".concat(error));
    }
  }

  /**
   * Create color cache from wallpapers
   */
  async createColoursCacheFromWallpapers() {
    const getColoursFromWallpaper = async (wallpaperPath) => {
      try {
        const result = await execAsync(
          `magick ${wallpaperPath} -format %c -depth 8 -colors 30 histogram:info:`,
        );
        return result.split("\n")
          .flatMap((line) =>
            line.split(" ").filter((word) => word.startsWith("#"))
          )
          .filter(Boolean);
      } catch (error) {
        throw new Error(
          `Failed to extract colors from ${wallpaperPath}:\n`.concat(error),
        );
      }
    };

    const queue = this.wallpaper
      .filter((wp) => !this.getCachedColours(wp.uniqueId))
      .map((wp) => async () => {
        const wallpaperPath = `${this.wallpaperDir}${wp.uniqueId}`;
        const colours = await getColoursFromWallpaper(wallpaperPath);
        this.coloursCache[wp.uniqueId] = colours;
      });

    if (queue.length) {
      print("Extracting colours from wallpapers...");
      await utils.promiseQueueWithLimit(queue);
      utils.writeFile(
        JSON.stringify(this.coloursCache),
        this.wallpaperColoursCacheFilePath,
      );
      print("Done extracting colours");
    }
  }

  /**
   * Load theme extension scripts
   */
  async loadThemeExtensionScripts() {
    try {
      ensureDir(this.themeExtensionScriptsBaseDir);
      const scriptNames = OS.readdir(this.themeExtensionScriptsBaseDir)[0]
        .filter((name) => name.endsWith(".js") && !name.startsWith("."));

      for (const fileName of scriptNames) {
        const extensionPath = `${this.themeExtensionScriptsBaseDir}${fileName}`;
        try {
          const script = await import(extensionPath);

          if (
            !script.setTheme || !script.getDarkThemeConf ||
            !script.getLightThemeConf
          ) {
            throw new SystemError(
              `Error in ${extensionPath}`,
              `Missing required function(s), "setTheme","getDarkThemeConf" or "getLightThemeConf" in the script.`,
            );
          }

          this.themeExtensionScripts[fileName] = script;
          this.appThemeCacheDir[fileName] =
            `${this.wallpaperThemeCacheDir}${fileName}/`;
          ensureDir(this.appThemeCacheDir[fileName]);
        } catch (error) {
          throw new Error(`Failed to load script ${fileName}:`.concat(error));
        }
      }
    } catch (error) {
      throw new Error(
        "Failed to load theme extension scripts:\n".concat(error),
      );
    }
  }

  /**
   * Create app themes from colors
   */
  async createAppThemesFromColours() {
    const isThemeConfCached = (wallpaperName, scriptName) => {
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

        print(`Generating theme configuration files using ${scriptName}...`);
        try {
          const [darkThemeConfig, lightThemeConfig] = await Promise.all([
            themeHandler.getDarkThemeConf(colours),
            themeHandler.getLightThemeConf(colours),
          ]);

          const cacheDir = this.appThemeCacheDir[scriptName];
          utils.writeFile(
            lightThemeConfig,
            `${cacheDir}${this.getThemeName(wp.uniqueId, "light")}`,
          );
          utils.writeFile(
            darkThemeConfig,
            `${cacheDir}${this.getThemeName(wp.uniqueId, "dark")}`,
          );
          print(`Done generating theme for ${scriptName}`);
        } catch (error) {
          await utils.notify(
            `Failed to generate theme config for: ${scriptName}`,
            error,
            "critical",
          );
        }
      }
    }
  }

  /**
   * Set the theme for a given wallpaper
   * @param {string} wallpaperName - Name of the wallpaper
   */
  async setThemes(wallpaperName) {
    const themeName = this.getThemeName(wallpaperName);

    const setTheme = async ([scriptName, themeHandler]) => {
      const currentThemePath = `${
        this.appThemeCacheDir[scriptName]
      }${themeName}`;

      const [, err] = OS.stat(currentThemePath);

      if (err === 0) {
        try {
          await themeHandler.setTheme(currentThemePath, execAsync);
        } catch (error) {
          utils.notify(`Error in script: ${scriptName}`, error, "critical");
        }
      } else {
        throw new Error(
          "Cache miss\n" +
            `Wallpaper: ${wallpaperName}. Theme path: ${currentThemePath}.`,
        );
      }
    };

    const promises = Object.entries(this.themeExtensionScripts).map(setTheme);

    await Promise.all(promises);
  }

  /**
   * Get the theme name based on wallpaper and theme type
   * @param {string} fileName - Name of the wallpaper file
   * @param {"light" | "dark"} [type] - Type of theme (light or dark)
   * @returns {string} Theme name
   */
  getThemeName(fileName, type) {
    const themeType = type === undefined
      ? (USER_ARGUMENTS.enableLightTheme ? "light" : "dark")
      : (type === "light" ? "light" : "dark");
    return `${fileName}-${themeType}.conf`;
  }

  /**
   * Get cached colours for a wallpaper
   * @param {string} cacheName - Unique identifier for the wallpaper
   * @returns {string[] | null} Array of colour hex codes or null if not found
   */
  getCachedColours(cacheName) {
    if (this.coloursCache[cacheName]) return this.coloursCache[cacheName];

    try {
      const cacheContent = STD.loadFile(this.wallpaperColoursCacheFilePath);
      this.coloursCache = JSON.parse(cacheContent) || {};
    } catch (error) {
      throw new Error("Failed to read colours cache file:\n".concat(error));
    }

    return this.coloursCache[cacheName] || null;
  }
}

export { Theme };
