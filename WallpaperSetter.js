import cache from "./cache.js";
import { Theme } from "./theme.js";
import { os, std } from "./quickJs.js";
import { UiInitializer } from "./ui.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import { exec as execAsync } from "../justjs/src/process.js";
import config from "./config.js";

export default class WallpaperSetter {
  constructor(params) {
    this.wallpapersDir = params.wallpapersDir;
    this.params = params;
    this.picCacheDir = cache.picCacheDir;
    this.wallpapers = [];
    this.isRandom;
  }

  async init() {
    this.loadWallpapers();
    await this.createCache();
    this.themeManager = new Theme(this.picCacheDir, this.wallpapers);
    await this.themeManager.init()
      .catch((e) => {
        print("Failed to initialize themeManager:\n", e);
      });
    await this.handleSettingWallpaper();
  }

  async handleSettingWallpaper() {
    this.params.wallpapers = this.wallpapers;
    const ui = new UiInitializer({
      ...this.params,
      handleSelection: async (wallpaper) =>
        await this.handleSelection(wallpaper),
    });
    await ui.init();
  }

  async handleSelection(wallpaper) {
    const { name, uniqueId } = wallpaper;

    const promises = [ // this.enableLightTheme should be passed in the themes constructor, not here.
      this.themeManager.setTheme(uniqueId, this.params.enableLightTheme).catch(
        (e) => {
          print(clearTerminal, "Failed to set theme for ", name, uniqueId, e);
        },
      ),
      this.setWallpaper(name),
    ];
    await Promise.all(promises);
  }

  isSupportedImageFormat(name) {
    const nameArray = name.split(".");
    const format = nameArray[nameArray.length - 1].toLowerCase();
    return /^(jpeg|png|webp|jpg)$/i.test(format);
  }

  loadWallpapers() {
    const [wallpapers, error] = os.readdir(this.wallpapersDir);
    if (error !== 0) {
      print("Failed to read wallpapers directory: ", this.wallpapersDir);
      std.exit(error);
    }
    this.wallpapers = wallpapers.filter(
      (name) =>
        name !== "." && name !== ".." && this.isSupportedImageFormat(name),
    ).map((name) => {
      const [stats, error] = os.stat(
        this.wallpapersDir.concat(name),
      );

      if (error) {
        print(
          "Failed to read wallpaper stat for :",
          this.wallpapers.concat(name),
        );
        std.exit(error);
      }
      const { dev, ino } = stats;
      return {
        name,
        uniqueId: `${dev}${ino}`.concat(name.slice(name.lastIndexOf("."))),
      };
    });

    if (!this.wallpapers.length) {
      print(
        `No wallpapers found in "${
          ansi.styles(["bold", "underline", "red"]) +
          this.wallpapersDir +
          ansi.style.reset
        }".`,
      );
      print(cursorShow);
      std.exit(2);
    }
  }

  async createCache() {
    const [cacheNames, error] = os.readdir(this.picCacheDir);
    const doesWallaperCacheExist = () => {
      if (error !== 0) return false;
      const cachedWallpaper = cacheNames.filter(
        (name) =>
          name !== "." && name !== ".." && this.isSupportedImageFormat(name),
      );
      if (!cachedWallpaper.length) return false;
      return this.wallpapers.every((wallpaperName) =>
        cachedWallpaper.some((cacheId) => cacheId === wallpaperName.uniqueId)
      );
    };

    const createWallpaperCachePromises = [];

    const makeCache = async (wallpaper) => {
      // add a check if see it the wallpaper cache already exits, then do not cache it again.
      const cachePicName = this.picCacheDir.concat(
        wallpaper.uniqueId,
      );
      return execAsync([
        "magick",
        this.wallpapersDir.concat(wallpaper.name),
        "-resize",
        "800x600",
        "-quality",
        "50",
        cachePicName,
      ])
        .catch((e) => {
          print(
            "Failed to create wallpaper cache. Make sure ImageMagick is installed in your system",
            e,
          );
          std.exit(2);
        });
    };

    if (!doesWallaperCacheExist()) {
      print("Processing images...");
      this.wallpapers.forEach((wallpaper) => {
        if (!cacheNames.includes(wallpaper.uniqueId)) {
          createWallpaperCachePromises.push(makeCache(wallpaper));
        }
      });
    }

    await Promise.all(createWallpaperCachePromises);
  }

  async setWallpaper(wallpaperName) {
    const wallpaperDir = `${this.wallpapersDir}/${wallpaperName}`;
    return config.wallpaperDaemonHandler(wallpaperDir); // calling the handler function to set the wallpaper
  }
}
