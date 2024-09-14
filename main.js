import { os, std } from "./quickJs.js";
import arg from "../justjs/src/arg.js";
import { Theme } from "./theme.js";
import { UiInitializer } from "./ui.js";
import { Wallpaper } from "./wallpaper.js";
import cache from "./cache.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import {
  ThemeExtensionScriptsDownloadManager,
  WallpaperDaemonHandlerScriptDownloadManager,
} from "./extensionScriptManager.js";
import WallpaperDownloadManager from "./browseWallpaperOnline.js";
import WallpaperSetter from "./WallpaperSetter.js";

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
    this.downloadThemeExtensionScripts = this.args["--dte"];
    this.downloadWallpaperDaemonHandlerScript = this.args["--dwh"];
    this.browseWallpaperOnline = this.args["--browse"];
    this.picCacheDir = cache.picCacheDir;
    this.theme = null;
  }

  async run() {
    await this.handleThemeExtensionScriptDownload();
    await this.handleWallpaperHandlerScriptDownload();
    await this.handleWallpaperBrowsing();

    await this.handleWallpaperSetter();
    // this.wallpaper = new Wallpaper(this.wallpapersDir);
    // await this.wallpaper.init().catch((e) => {
    //   print("Failed to initialize wallpaper:", e);
    //   std.exit(2);
    // });
    // this.theme = new Theme(
    //   this.picCacheDir,
    //   this.wallpaper.wallpapers,
    // );
    // await this.theme.init().catch((e) => {
    //   print("Failed to initialize theme:", e);
    //   std.exit(2);
    // });
    // await this.handleRandomWallpaper();
    // await this.handleWallpaperSelection().catch((e) => {
    //   print("Failed to initialize UI:", e);
    //   std.exit(2);
    // });
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
            "Display wallpapers in a fixed size grid. Remaining wallpapers will be displayed in the next grid upon navigation",
          ),
        "--grid-size": arg
          .str("4x4")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid grid size. \n Ex:- 4x4",
          )
          .map(splitNumbersFromString)
          .desc("Wallpaper grid size"),
        "--dte": arg
          .flag(false)
          .desc("Download theme extension scripts"),
        "--dwh": arg
          .flag(false)
          .desc("Download wallpaper handler script."),
        "--browse": arg
          .flag(false)
          .desc("Browse wallpapers online."),
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
      .ver("0.0.1-alpha.3")
      .parse();
  }

  async handleThemeExtensionScriptDownload() {
    if (!this.downloadThemeExtensionScripts) return;
    print(
      "Starting theme extension download manager.\n",
      "\bFetching list of exteniosn scripts...",
    );
    const downloadManager = new ThemeExtensionScriptsDownloadManager();
    await downloadManager.start().catch((e) => {
      print(
        "Failed to start downloadManager for theme extension scripts.\n",
        e,
      );
      std.exit(1);
    });
    std.exit(0);
  }

  async handleWallpaperHandlerScriptDownload() {
    if (!this.downloadWallpaperDaemonHandlerScript) return;
    print(
      "Starting wallpaper daemon handler script download manager.\n",
      "\bFetching list of available scripts...",
    );
    const downloadManager = new WallpaperDaemonHandlerScriptDownloadManager();
    await downloadManager.start().catch((e) => {
      print(
        "Failed to start downloadManager for wallpaper daemon handle script.",
        e,
      );
      std.exit(1);
    });
    std.exit(0);
  }

  async handleWallpaperBrowsing() {
    if (!this.browseWallpaperOnline) return;
    const wallpaperDownloadManager = new WallpaperDownloadManager({
      imageWidth: this.imageWidth,
      paddH: this.paddH,
      imageHeight: this.imageHeight,
      paddV: this.paddV,
      pagination: this.pagination,
      wallpapersDir: this.wallpapersDir,
      gridSize: this.gridSize,
    });
    await wallpaperDownloadManager.start()
      .catch((e) => {
        print("Failed to initialize WallpaperDownloadManager.", e);
        std.exit(2);
      });
  }

  async handleWallpaperSetter() {
    const wallpaperSetter = new WallpaperSetter({
      imageWidth: this.imageWidth,
      paddH: this.paddH,
      imageHeight: this.imageHeight,
      paddV: this.paddV,
      picCacheDir: this.picCacheDir,
      pagination: this.pagination,
      gridSize: this.gridSize,
      wallpapersDir: this.wallpapersDir,
      enableLightTheme: this.enableLightTheme,
    });

    await wallpaperSetter.init();
  }

  async handleRandomWallpaper() {
    if (!this.setRandomWallpaper) return;
    const randomWallpaperIndex = Math.floor(
      Math.random() * this.wallpaper.wallpapers.length,
    );
    await this.setThemeAndWallpaper(
      this.wallpaper.wallpapers[randomWallpaperIndex],
    );
    std.exit(0);
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

  async handleWallpaperSelection() {
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
      os.exec(["clear"]);
      print("Failed to initialize UI for wallpaper setter.", e);
    });
  }
}

const wallWiz = new WallWiz();
await wallWiz.run().catch((e) => print("Failed to initialize WallWiz:", e));
