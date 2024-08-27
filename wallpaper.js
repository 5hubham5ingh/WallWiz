import { readdir } from "os";
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
    this.wallpaperCache = [];
  }

  async init() {
    this.loadWallpapers();
    this.mountCache();
    await this.createCache();
  }

  isSupportedImageFormat(name) {
    const nameArray = name.split(".");
    const format = nameArray[nameArray.length - 1].toLowerCase();
    return /^(jpeg|png|webp|jpg)$/i.test(format);
  }

  loadWallpapers() {
    this.wallpapers = readdir(this.wallpapersDir)[0].filter(
      (name) => name !== "." && name !== ".." && this.isSupportedImageFormat(name)
    );

    if (!this.wallpapers.length) {
      print(
        `No wallpapers found in "${ansi.styles(["bold", "underline", "red"]) +
        this.wallpapersDir +
        ansi.style.reset
        }".`
      );
      print(cursorShow);
      exit(1);
    }
  }

  mountCache() {
    this.wallpaperCache = readdir(this.picCacheDir)[0].filter(
      (name) => name !== "." && name !== ".." && this.isSupportedImageFormat(name)
    );
  }

  async createCache() {
    const createWallpaperCachePromises = [];

    if (!this.wallpaperCache.length) {
      this.wallpapers.forEach((wallpaper) => {
        createWallpaperCachePromises.push(this.makeCache(wallpaper));
        this.wallpaperCache.push(wallpaper);
      });
    } else if (this.wallpapers.length > this.wallpaperCache.length) {
      this.wallpapers.forEach((wallpaper) => {
        const cacheExists = this.wallpaperCache.includes(wallpaper);
        if (!cacheExists) {
          createWallpaperCachePromises.push(this.makeCache(wallpaper));
          this.wallpaperCache.push(wallpaper);
        }
      });
    }

    if (createWallpaperCachePromises.length) {
      await Promise.all(createWallpaperCachePromises);
    }
  }

  makeCache(wallpaper) {
    return execAsync([
      "magick",
      this.wallpapersDir.concat(wallpaper),
      "-resize",
      "800x600",
      "-quality",
      "50",
      this.picCacheDir.concat(wallpaper),
    ]);
  }

  async setWallpaper(wallpaperName) {
    const wallpaperDir = `${this.wallpapersDir}/${wallpaperName}`;
    return config.wallpaperDaemonHandler.setWallpaper(wallpaperDir)
  }
}

export { Wallpaper }
