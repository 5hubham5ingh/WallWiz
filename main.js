import { exec } from "os";
import { exit } from "std";
import arg from "../justjs/src/arg.js";
import { Theme } from "./theme.js";
import { UiInitializer } from "./ui.js";
import { Wallpaper } from "./wallpaper.js";
import cache from "./cache.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";

"use strip";

class WallWiz {
  constructor() {
    this.args = this.parseArguments();
    this.wallpapersDir = this.args["--wall-dir"].concat("/");
    this.enableLightTheme = this.args["--light-theme"];
    this.setRandomWallpaper = this.args["--random"];
    [this.imageWidth, this.imageHeight] = this.args["--img-size"];
    [this.paddV, this.paddH] = this.args["--padding"];
    this.gridSize = this.args["--grid-size"];
    this.pagination = this.args["--enable-pagination"];
    this.picCacheDir = cache.picCacheDir;
    this.wallpaper = new Wallpaper(this.wallpapersDir);
    this.theme = null;
  }

  async run() {
    await this.wallpaper.init().catch((e) => {
      print("Failed to initialize wallpaper:", e);
      exit(2);
    });
    this.theme = new Theme(
      this.picCacheDir,
      this.wallpaper.wallpapers,
    );
    await this.theme.init().catch((e) => {
      print("Failed to initialize theme:", e);
      exit(2);
    });
    await this.handleRandomWallpaper();
    await this.initializeUI().catch((e) => {
      print("Failed to initialize UI:", e);
      exit(2);
    });
  }

  parseArguments() {
    const splitNumbersFromString = (str) => str.split("x").map(Number);
    return arg
      .parser({
        "--wall-dir": arg.path(".").check().desc("Wallpaper directory path"),
        "--random": arg
          .flag(false)
          .desc("Apply random wallpaper from the directory."),
        "--img-size": arg
          .str("118x32")
          .reg(/^\d+x\d+$/)
          .desc("Image size in pixel")
          .err(
            "Invalid size, it should be of WIDTHxHEIGHT format. \n Ex:- 60x20",
          )
          .map(splitNumbersFromString),
        "--light-theme": arg.flag(true).desc("Enable light theme."),
        "--padding": arg
          .str("1x1")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid padding, it should of V_PADDINGxH_PADDING format. \n Ex:- 2x1",
          )
          .map(splitNumbersFromString)
          .desc("Container padding in cells"),
        "--enable-pagination": arg
          .flag(false)
          .desc(
            "Auto resize the kitty terminal when screen is insufficient to show all wallpapers.",
          ),
        "--grid-size": arg
          .str("4x4")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid grid size. \n Ex:- 4x4",
          )
          .map(splitNumbersFromString)
          .desc("Wallpaper grid size"),
        "-d": "--wall-dir",
        "-r": "--random",
        "-s": "--img-size",
        "-p": "--padding",
        "-e": "--enable-pagination",
        "-g": "--grid-size",
        "-l": "--light-theme",
      })
      .ex([
        "-d ~/Pics/wallpaper/wallpaper.jpeg -s 42x10",
        "-l -p 4x4",
      ])
      .ver("0.0.1-alpha.2")
      .parse();
  }

  async handleRandomWallpaper() {
    if (!this.setRandomWallpaper) return;
    const randomWallpaperIndex = Math.floor(
      Math.random() * this.wallpaper.wallpapers.length,
    );
    await this.setThemeAndWallpaper(
      this.wallpaper.wallpapers[randomWallpaperIndex],
    );
    exit(0);
  }

  async setThemeAndWallpaper(wallpaper) {
    const { name, uniqueId } = wallpaper;

    const promises = [
      this.theme.setTheme(uniqueId, this.enableLightTheme).catch((e) => {
        print(clearTerminal, "Failed to set theme for ", name, uniqueId, e);
      }),
      this.wallpaper.setWallpaper(name),
    ];
    await Promise.all(promises);
  }

  async initializeUI() {
    const UI = new UiInitializer({
      imageWidth: this.imageWidth,
      paddH: this.paddH,
      imageHeight: this.imageHeight,
      paddV: this.paddV,
      wallpapers: this.wallpaper.wallpapers,
      picCacheDir: this.picCacheDir,
      handleSelection: async (index) => await this.setThemeAndWallpaper(index),
      pagination: this.pagination,
      gridSize: this.gridSize,
    });
    await UI.init().catch((e) => {
      exec(["clear"]);
      print(e);
    });
  }
}

const wallWiz = new WallWiz();
await wallWiz.run().catch((e) => print("Failed to initialize WallWiz:", e));
