import { exec, readdir } from "os";
import { exit, getenv } from "std";
import {
  cursorShow,
} from "../justjs/src/just-js/helpers/cursor.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import arg from "../justjs/src/arg.js";
import { exec as execAsync } from "../justjs/src/process.js";
import { Theme } from "./theme.js";
import { ensureDir } from "../justjs/src/fs.js";
import { UiInitializer } from "./ui.js";
import { Wallpaper } from './wallpaper.js'

class WallWiz {
  constructor() {
    this.args = this.parseArguments();
    this.wallpapersDir = this.args["--wall-dir"];
    this.enableLightTheme = this.args["--light-theme"];
    this.setRandomWallpaper = this.args["--random"];
    [this.imageWidth, this.imageHeight] = this.args["--img-size"];
    [this.paddV, this.paddH] = this.args["--padding"];
    this.picCacheDir = getenv("HOME").concat("/.cache/WallWiz/pic/");
    this.wallpaper = new Wallpaper(this.wallpapersDir, this.picCacheDir);
    this.theme = null;
  }


  async run() {
    this.wallpaper.loadWallpapers();
    this.wallpaper.prepareCache();
    await this.wallpaper.createCache();
    this.theme = new Theme(this.picCacheDir, this.wallpaper.wallpaperCache);
    await this.theme.createThemes().catch((e) => {
      print(e);
      exit(2);
    });
    await this.handleRandomWallpaper();
    await this.initializeUI();
  }

  parseArguments() {
    return arg
      .parser({
        "--wall-dir": arg.path(".").check().desc("Wallpaper directory path"),
        "--random": arg
          .flag(false)
          .desc("Apply random wallpaper from the directory."),
        "--img-size": arg
          .str("42x10")
          .reg(/^\d+x\d+$/)
          .desc("Image size in pixel")
          .err("Invalid size, it should be of WIDTHxHEIGHT format. \n Ex:- 60x20")
          .map((size) => size.split("x").map(Number)),
        "--light-theme": arg.flag().desc("Enable light theme."),
        "--padding": arg
          .str("1x1")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid padding, it should of V_PADDINGxH_PADDING format. \n Ex:- 2x1"
          )
          .map((padding) => padding.split("x").map(Number))
          .desc("Container padding in cells"),
        "--auto-resize": arg
          .flag(true)
          .desc(
            "Auto resize the kitty terminal when screen is insufficient to show all wallpapers."
          ),
        "-d": "--wall-dir",
        "-r": "--random",
        "-s": "--img-size",
        "-p": "--padding",
        "-l": "--light-theme",
        "-a": "--auto-resize",
      })
      .ex([
        "-d ~/Pics/wallpaper/wallpaper.jpeg -s 42x10",
        "-l -p 4x4",
      ])
      .ver("0.0.1")
      .parse();
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

  async handleRandomWallpaper() {
    if (this.setRandomWallpaper) {
      const randomWallpaper = this.wallpaper.getRandomWallpaper();
      this.wallpaper.setWallpaper(randomWallpaper);
      await this.theme.setTheme(randomWallpaper, this.enableLightTheme).catch(print);
      this.handleExit();
    }
  }

  prepareCache() {
    ensureDir(this.picCacheDir);
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

  async initializeTheme() {
    this.theme = new Theme(this.picCacheDir, this.wallpaperCache);
    await this.theme.createThemes().catch((e) => {
      print(e);
      exit(2);
    });
  }

  async initializeUI() {
    const UI = new UiInitializer({
      imageWidth: this.imageWidth,
      paddH: this.paddH,
      imageHeight: this.imageHeight,
      paddV: this.paddV,
      wallpapers: this.wallpaper.wallpapers,
      picCacheDir: this.picCacheDir,
      wallpapersDir: this.wallpapersDir,
      theme: this.theme,
      enableLightTheme: this.enableLightTheme,
      setWallpaper: (wallpaperName) => this.wallpaper.setWallpaper(wallpaperName),
    });
    await UI.init().catch(e => {
      exec(['clear']);
      print(e);
    });
  }
}

const wallWiz = new WallWiz();
await wallWiz.run();
