import { exec as execAsync } from "../justjs/src/process.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import utils from "./utils.js";
import { ensureDir } from "../justjs/src/fs.js";
import * as os from 'os'
import * as std from 'std'
import { HOME_DIR } from "./constant.js";

/**
 * @typedef {import('./types.ts').IOs} IOs
 * @typedef {import('./types.ts').IStd} IStd
 * @typedef {import('./types.ts').ColourCache} ColourCache
 */

/**
* @type {{ os: IOs, std: IStd }}
 */
const { os, std } = { os, std };

"use strip";

/**
 * Theme class manages colors, and theme configurations of wallpapers
 */
class Theme {
  /**
   * Constructor for the Theme class
   * @param {string} wallpaperDir - Directory containing wallpapers
   * @param {Array} wallpaper - Array of wallpaper objects
   * @param {boolean} enableLightTheme - Flag to enable light theme
   */
  constructor(wallpaperDir, wallpaper, enableLightTheme) {
    this.wallpaperDir = wallpaperDir;
    this.wallpaper = wallpaper;
    this.enableLightTheme = enableLightTheme;
    this.cacheBaseDir = `${HOME_DIR}/.cache/WallWiz`;
    this.wallpaperColoursCacheFilePath = `${this.cacheBaseDir}/colours.json`;
    this.wallpaperThemeCacheDir = `${this.cacheBaseDir}/themes/`;
    this.appThemeCacheDir = {};
    this.themeExtensionScriptsBaseDir =
      `${HOME_DIR}/.config/WallWiz/themeExtensionScripts/`;
    this.themeExtensionScripts = {};
    /**
     * @type {ColourCache}
     */
    this.coloursCache = {};

    // Ensure necessary directories exist
    ensureDir(this.wallpaperThemeCacheDir)
  }

  /**
   * Initialize the Theme instance
   */
  async init() {
    await this.createColoursCacheFromWallpapers();
    await this.loadThemeExtensionScripts();
    await this.createAppThemesFromColours();
  }

  /**
   * Create color cache from wallpapers
   */
  async createColoursCacheFromWallpapers() {
    const getColoursFromWallpaper = async (wallpaperPath) => {
      const result = await execAsync(
        `magick ${wallpaperPath} -format %c -depth 8 -colors 30 histogram:info:`,
      );
      return result.split("\n")
        .flatMap((line) =>
          line.split(" ").filter((word) => word.startsWith("#"))
        )
        .filter(Boolean);
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
      utils.writeFile(JSON.stringify(this.coloursCache, this.wallpaperColoursCacheFilePath))
      print("Done");
    }
  }

  /**
   * Load theme extension scripts
   */
  async loadThemeExtensionScripts() {
    ensureDir(this.themeExtensionScriptsBaseDir);
    const scriptNames = os.readdir(this.themeExtensionScriptsBaseDir)[0]
      .filter((name) => name.endsWith(".js") && !name.startsWith("."));

    for (const fileName of scriptNames) {
      const extensionPath = `${this.themeExtensionScriptsBaseDir}${fileName}`;
      const script = await import(extensionPath);

      if (
        !script.setTheme || !script.getDarkThemeConf ||
        !script.getLightThemeConf
      ) {
        utils.error(`Missing required functions- "setTheme","getDarkThemeConf" or "getLightThemeConf".`, `Extension script: ${extensionPath}`);
      }

      this.themeExtensionScripts[fileName] = script;
      this.appThemeCacheDir[fileName] =
        `${this.wallpaperThemeCacheDir}${fileName}/`;
      ensureDir(this.appThemeCacheDir[fileName]);
    }
  }

  /**
   * Create app themes from colors
   */
  async createAppThemesFromColours() {
    const isThemeConfCached = (wallpaperName, scriptName) => {
      const cacheDir = `${this.appThemeCacheDir[scriptName]}${this.getThemeName(wallpaperName, "light")
        }`;
      const scriptDir = `${this.themeExtensionScriptsBaseDir}${scriptName}`;
      const [cacheStat, cacheErr] = os.stat(cacheDir);
      const [scriptStat, scriptErr] = os.stat(scriptDir);

      if (scriptErr !== 0) {
        utils.error('Failed to read script status.', 'Script name: '.concat(scriptName))
      }
      return cacheErr === 0 && cacheStat.mtime > scriptStat.mtime;
    };

    for (const wp of this.wallpaper) {
      const colours = this.getCachedColours(wp.uniqueId);
      if (!colours) utils.error("Cache miss", `Wallpaper name: ${wp.name}; Colours cache id: ${wp.uniqueId};`)
      for (
        const [scriptName, themeHandler] of Object.entries(
          this.themeExtensionScripts,
        )
      ) {
        if (isThemeConfCached(wp.uniqueId, scriptName)) continue;

        print("Generating theme configuration files...");
        //TODO: Use worker thread pool for generating and applying themes
        try {
          const [darkThemeConfig, lightThemeConfig] = await Promise.all([
            themeHandler.getDarkThemeConf(colours),
            themeHandler.getLightThemeConf(colours),
          ]);

          const cacheDir = this.appThemeCacheDir[scriptName];
          utils.writeFile(
            lightThemeConfig,
            `${cacheDir}${this.getThemeName(wp.uniqueId, "light")}`,
          ),
            utils.writeFile(
              darkThemeConfig,
              `${cacheDir}${this.getThemeName(wp.uniqueId, "dark")}`,
            );
          print("Done");
        } catch (error) {
          await utils.notify(
            "Failed to generate theme config for: ".concat(scriptName),
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
  async setTheme(wallpaperName) {
    const themeName = this.getThemeName(wallpaperName);
    const promises = Object.entries(this.themeExtensionScripts).map(
      async ([scriptName, themeHandler]) => {
        const currentThemePath = `${this.appThemeCacheDir[scriptName]
          }${themeName}`;
        const [, err] = os.stat(currentThemePath);

        if (err === 0) {
          return themeHandler.setTheme(currentThemePath, execAsync);
        } else {
          utils.error('Cache miss', `Wallpaper: ${wallpaperName}; Theme path: ${currentThemePath}.`)
        }
      },
    );

    promises.push(utils.notify("WallWiz", "Theme applied", "normal"));
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
      ? (this.enableLightTheme ? "light" : "dark")
      : (type ? "light" : "dark");
    return `${fileName}-${themeType}.conf`;
  }

  getCachedColours(cacheName) {
    if (this.coloursCache?.[cacheName]) return this.coloursCache[cacheName];

    this.coloursCache = JSON.parse(std.loadFile(this.wallpaperColoursCacheFilePath))
      ?? null;
    return this.coloursCache[cacheName] ?? null;
  };


}

export { Theme };
