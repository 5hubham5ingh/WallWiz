import { readdir, stat } from "os";
import { exec as execAsync } from "../justjs/src/process.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import { cursorShow } from "../justjs/src/just-js/helpers/cursor.js";
import { exit } from "std";
import cache from "./cache.js";
import config from "./config.js";

"use strip";

class Wallpaper {
  constructor(wallpapersDir) {
    this.wallpapersDir = wallpapersDir;
    this.picCacheDir = cache.picCacheDir;
    this.wallpapers = [];
  }

  async init() {
    this.loadWallpapers();
    await this.createCache();
  }

  isSupportedImageFormat(name) {
    const nameArray = name.split(".");
    const format = nameArray[nameArray.length - 1].toLowerCase();
    return /^(jpeg|png|webp|jpg)$/i.test(format);
  }

  loadWallpapers() {
    const [wallpapers, error] = readdir(this.wallpapersDir);
    if (error !== 0) {
      print("Failed to read wallpapers directory: ", this.wallpapersDir);
      exit(error);
    }
    this.wallpapers = wallpapers.filter(
      (name) =>
        name !== "." && name !== ".." && this.isSupportedImageFormat(name),
    ).map((name) => {
      const [stats, error] = stat(
        this.wallpapersDir.concat(name),
      );

      if (error) {
        print(
          "Failed to read wallpaper stat for :",
          this.wallpapers.concat(name),
        );
        exit(error);
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
      exit(2);
    }
  }

  async createCache() {
    const [cacheNames, error] = readdir(this.picCacheDir);
    const doesWallaperCacheExist = () => {
      if (error !== 0) return false;
      const cachedWallpaper = cacheNames.filter(
        (name) =>
          name !== "." && name !== ".." && this.isSupportedImageFormat(name),
      );
      if (!cachedWallpaper.length) return false;
      return this.wallpapers.every((cacheName) =>
        cachedWallpaper.some((wp) => wp.uniqueId === cacheName)
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
          exit(2);
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

export { Wallpaper };
