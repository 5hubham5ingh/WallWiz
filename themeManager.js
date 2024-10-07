import { exec as execAsync } from "../justjs/src/process.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import utils from "./utils.js";
import { ensureDir } from "../justjs/src/fs.js";
import * as os from 'os'
import * as std from 'std'

/**
 * @typedef {import('./types.ts').IOs} IOs
 * @typedef {import('./types.ts').IStd} IStd
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
    this.homeDir = std.getenv("HOME");
    this.cacheBaseDir = `${this.homeDir}/.cache/WallWiz`;
    this.wallpaperColoursCacheDir = `${this.cacheBaseDir}/colours/`;
    this.wallpaperThemeCacheDir = `${this.cacheBaseDir}/themes/`;
    this.appThemeCacheDir = {};
    this.themeExtensionScriptsBaseDir =
      `${this.homeDir}/.config/WallWiz/themeExtensionScripts/`;
    this.themeExtensionScripts = {};

    // Ensure necessary directories exist
    [this.wallpaperColoursCacheDir, this.wallpaperThemeCacheDir].forEach(
      ensureDir,
    );
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
      .filter((wp) => !this.areColoursCached(wp.uniqueId))
      .map((wp) => async () => {
        const wallpaperPath = `${this.wallpaperDir}${wp.uniqueId}`;
        const colours = await getColoursFromWallpaper(wallpaperPath);
        utils.writeFile(
          JSON.stringify(colours),
          `${this.wallpaperColoursCacheDir}${wp.uniqueId}.txt`,
        );
      });

    if (queue.length) {
      print("Extracting colours from wallpapers...");
      await utils.promiseQueueWithLimit(queue);
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
        console.error(`Missing required functions in ${extensionPath}`);
        std.exit(2);
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
    const getCachedColours = (cacheName) => {
      const cachePath = `${this.wallpaperColoursCacheDir}${cacheName}.txt`;
      return this.areColoursCached(cacheName)
        ? JSON.parse(std.loadFile(cachePath))
        : null;
    };

    const isThemeConfCached = (wallpaperName, scriptName) => {
      const cacheDir = `${this.appThemeCacheDir[scriptName]}${this.getThemeName(wallpaperName, true)
        }`;
      const scriptDir = `${this.themeExtensionScriptsBaseDir}${scriptName}`;
      const [cacheStat, cacheErr] = os.stat(cacheDir);
      const [scriptStat, scriptErr] = os.stat(scriptDir);

      if (scriptErr !== 0) {
        throw new Error(`Failed to read script status for: "${scriptName}"`);
      }
      return cacheErr === 0 && cacheStat.mtime > scriptStat.mtime;
    };

    for (const wp of this.wallpaper) {
      const colours = getCachedColours(wp.uniqueId);
      if (!colours) {
        throw new Error(`Failed to get cached color for ${wp.uniqueId}`);
      }

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
            `${cacheDir}${this.getThemeName(wp.uniqueId, true)}`,
          ),
            utils.writeFile(
              darkThemeConfig,
              `${cacheDir}${this.getThemeName(wp.uniqueId, false)}`,
            );
          print("Done");
        } catch (error) {
          await utils.notify(
            "Failed to generate theme config for ",
            `${scriptName}.`,
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
          print(
            clearTerminal,
            "cache miss: ",
            currentThemePath,
            ":end",
          );
          throw new Error(`No theme exists in cache for ${wallpaperName}`);
        }
      },
    );

    promises.push(utils.notify("WallWiz", "Theme applied", "normal"));
    await Promise.all(promises);
  }

  /**
   * Get the theme name based on wallpaper and theme type
   * @param {string} fileName - Name of the wallpaper file
   * @param {boolean} [type] - Type of theme (light or dark)
   * @returns {string} Theme name
   */
  getThemeName(fileName, type) {
    const themeType = type === undefined
      ? (this.enableLightTheme ? "light" : "dark")
      : (type ? "light" : "dark");
    return `${fileName}-${themeType}.conf`;
  }

  /**
   * Check if colors are cached for a given wallpaper
   * @param {string} cacheName - Name of the cache file
   * @returns {boolean} True if colors are cached, false otherwise
   */
  areColoursCached(cacheName) {
    const [, err] = os.stat(`${this.wallpaperColoursCacheDir}${cacheName}.txt`);
    return err === 0;
  }
}

export { Theme };
