import { exec } from "os";
import { exit } from "std";
import arg from "../justjs/src/arg.js";
import { Theme } from "./theme.js";
import { UiInitializer } from "./ui.js";
import { Wallpaper } from './wallpaper.js'
import cache from "./cache.js";

class WallWiz {
  constructor() {
    this.args = this.parseArguments();
    this.wallpapersDir = this.args["--wall-dir"];
    this.enableLightTheme = this.args["--light-theme"];
    this.setRandomWallpaper = this.args["--random"];
    [this.imageWidth, this.imageHeight] = this.args["--img-size"];
    [this.paddV, this.paddH] = this.args["--padding"];
    this.picCacheDir = cache.picCacheDir;
    this.wallpaper = new Wallpaper(this.wallpapersDir);
    this.theme = null;
  }


  async run() {
    await this.wallpaper.init().catch(e => { print('Failed to initialize wallpaper:', e); exit(2) });
    this.theme = new Theme(this.picCacheDir, this.wallpaper.wallpaperCache);
    await this.theme.init().catch(e => { print('Failed to initialize theme:', e); exit(2) })
    await this.handleRandomWallpaper();
    await this.initializeUI().catch(e => { print('Failed to initialize UI:', e); exit(2) });
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
        "--light-theme": arg.flag(true).desc("Enable light theme."),
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

  async handleRandomWallpaper() {
    if (!this.setRandomWallpaper) return;
    const randomWallpaperIndex = Math.floor(Math.random() * this.wallpaper.wallpapers.length)
    await this.setThemeAndWallpaper(randomWallpaperIndex);
    exit(0)
  }

  async setThemeAndWallpaper(index) {
    const wallpaperName = this.wallpaper.wallpapers[index];
    const promises = [
      this.theme.setTheme(wallpaperName, this.enableLightTheme).catch((e) => {
        print(clearTerminal, "Failed to set theme.", e);
      }),
      this.wallpaper.setWallpaper(wallpaperName)
    ];
    await Promise.all(promises)
  }

  async initializeUI() {
    const UI = new UiInitializer({
      imageWidth: this.imageWidth,
      paddH: this.paddH,
      imageHeight: this.imageHeight,
      paddV: this.paddV,
      wallpapers: this.wallpaper.wallpapers,
      picCacheDir: this.picCacheDir,
      handleSelection: async (index) => await this.setThemeAndWallpaper(index)
    });
    await UI.init().catch(e => {
      exec(['clear']);
      print(e);
    });
  }
}

const wallWiz = new WallWiz();
await wallWiz.run().catch(e => print('Failed to initialize WallWiz:', e))
