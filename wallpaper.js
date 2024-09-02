import { readdir, stat } from "os";
import { exec as execAsync } from "../justjs/src/process.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import { cursorShow } from "../justjs/src/just-js/helpers/cursor.js";
import { exit } from "std";
import cache from "./cache.js";
import config from "./config.js";

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

    print("here");
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

  doesWallaperCacheExist() {
    const [cachedWallpaper, error] = readdir(this.picCacheDir);
    if (error !== 0) return false;
    const pics = cachedWallpaper.filter(
      (name) =>
        name !== "." && name !== ".." && this.isSupportedImageFormat(name),
    );
    if (!pics.length) return false;
    return pics.every((cacheName) =>
      this.wallpapers.some((wp) => wp.uniqueId === cacheName)
    );
  }

  async createCache() {
    const createWallpaperCachePromises = [];

    const makeCache = async (wallpaper) => {
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

    if (!this.doesWallaperCacheExist()) {
      print("Processing images...");
      this.wallpapers.forEach((wallpaper) => {
        createWallpaperCachePromises.push(makeCache(wallpaper));
      });
    }

    await Promise.all(createWallpaperCachePromises);
  }

  async setWallpaper(wallpaperName) {
    const wallpaperDir = `${this.wallpapersDir}/${wallpaperName}`;
    return config.wallpaperDaemonHandler.setWallpaper(wallpaperDir);
  }
}

export { Wallpaper };
