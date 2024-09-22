import { os, std } from "./quickJs.js";
import arg from "../justjs/src/arg.js";
import cache from "./cache.js";
import {
  ThemeExtensionScriptsDownloadManager,
  WallpaperDaemonHandlerScriptDownloadManager,
} from "./extensionScriptDownloadManager.js";
import WallpaperDownloadManager from "./wallpaperDownloadManager.js";
import WallpaperSetter from "./wallpapersManager.js";

"use strip";

class WallWiz {
  constructor() {
    this.userArguments = this.parseArguments();
    this.picCacheDir = cache.picCacheDir;
  }

  async run() {
    os.ttySetRaw();
    await this.handleThemeExtensionScriptDownload();
    await this.handleWallpaperHandlerScriptDownload();
    await this.handleWallpaperBrowsing();
    await this.handleWallpaperSetter();
    std.exit(0);
  }

  parseArguments() {
    const splitNumbersFromString = (str) => str.split("x").map(Number);

    const argNames = {
      wallpapersDirectory: "--wall-dir",
      setRandomWallpaper: "--random",
      imageSize: "--img-size",
      enableLightTheme: "--light-theme",
      padding: "--padding",
      enablePagination: "--enable-pagination",
      gridSize: "--grid-size",
      downloadThemeExtensionScripts: "--dte",
      downloadWallpaperDaemonHandlerScript: "--dwh",
      browseWallpaperOnline: "--browse",
      wallpaperRepositoryUrls: "--repo-url",
      githubApiKey: "--api-key",
    };

    const userArguments = arg
      .parser({
        [argNames.wallpapersDirectory]: arg
          .path(".")
          .check()
          .env("WALLPAPER_DIR")
          .map((path) => path.concat("/"))
          .desc("Wallpaper directory path"),
        [argNames.setRandomWallpaper]: arg
          .flag(false)
          .desc("Apply random wallpaper from the directory."),
        [argNames.imageSize]: arg
          .str("118x32")
          .reg(/^\d+x\d+$/)
          .desc("Image size in pixel")
          .val("WIDTHxHEIGHT")
          .err(
            "Invalid size, it should be of WIDTHxHEIGHT format. \n Ex:- 60x20",
          )
          .map(splitNumbersFromString),
        [argNames.enableLightTheme]: arg.flag(true).desc("Enable light theme."),
        [argNames.padding]: arg
          .str("1x1")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid padding, it should of VERTICLE_PADDINGxHORIZONTAL_PADDING format. \n Ex:- 2x1",
          )
          .map(splitNumbersFromString)
          .desc("Container padding in cells")
          .val("VERTICLExHORIZONTAL"),
        [argNames.enablePagination]: arg
          .flag(false)
          .desc(
            "Display wallpapers in a fixed size grid. Remaining wallpapers will be displayed in the next grid upon navigation",
          ),
        [argNames.gridSize]: arg
          .str("4x4")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid grid size. \n Ex:- 4x4",
          )
          .map(splitNumbersFromString)
          .desc("Wallpaper grid size")
          .val("WIDTHxHEIGHT"),
        [argNames.downloadThemeExtensionScripts]: arg
          .flag(false)
          .desc("Download theme extension scripts"),
        [argNames.downloadWallpaperDaemonHandlerScript]: arg
          .flag(false)
          .desc("Download wallpaper handler script."),
        [argNames.browseWallpaperOnline]: arg
          .flag(false)
          .desc("Browse wallpapers online."),
        [argNames.wallpaperRepositoryUrls]: arg
          .str("https://github.com/5hubham5ingh/WallWiz/tree/wallpapers/")
          .env("WALLPAPER_REPO_URLS")
          .reg(
            /^https:\/\/github\.com\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9.-]+(\/tree\/[a-zA-Z0-9.-]+(\/.*)?)?(\s*;\s*https:\/\/github\.com\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9.-]+(\/tree\/[a-zA-Z0-9.-]+(\/.*)?)?)*$/,
          )
          .map((urls) => urls.split(";").map((url) => url.trim()))
          .err("Invalid repository url(s)")
          .desc("Wallpaper repository github url(s).")
          .val("URL(s)"),
        [argNames.githubApiKey]: arg
          .str()
          .env("GITHUB_API_KEY")
          .desc("Github API key."),
        "-d": argNames.wallpapersDirectory,
        "-r": argNames.setRandomWallpaper,
        "-s": argNames.imageSize,
        "-p": argNames.padding,
        "-e": argNames.enablePagination,
        "-g": argNames.gridSize,
        "-l": argNames.enableLightTheme,
      })
      .ex([
        "-d ~/Pics/wallpaper/wallpaper.jpeg -s 42x10",
        "-l -p 4x4",
      ])
      .ver("0.0.1-alpha.3")
      .parse();

    const argumentDictionary = {};
    for (const argName in argNames) {
      argumentDictionary[argName] = userArguments[argNames[argName]];
    }
    return argumentDictionary;
  }

  async handleThemeExtensionScriptDownload() {
    if (!this.userArguments.downloadThemeExtensionScripts) return;
    print(
      "Starting theme extension download manager.\n",
      "\bFetching list of exteniosn scripts...",
    );
    const downloadManager = new ThemeExtensionScriptsDownloadManager();
    await downloadManager.init().catch((e) => {
      print(
        "Failed to start downloadManager for theme extension scripts.\n",
        e,
      );
      std.exit(1);
    });
    std.exit(0);
  }

  async handleWallpaperHandlerScriptDownload() {
    if (!this.userArguments.downloadWallpaperDaemonHandlerScript) return;
    print(
      "Starting wallpaper daemon handler script download manager.\n",
      "\bFetching list of available scripts...",
    );
    const downloadManager = new WallpaperDaemonHandlerScriptDownloadManager();
    await downloadManager.init().catch((e) => {
      print(
        "Failed to start downloadManager for wallpaper daemon handle script.",
        e,
      );
      std.exit(1);
    });
    std.exit(0);
  }

  async handleWallpaperBrowsing() {
    if (!this.userArguments.browseWallpaperOnline) return;
    const wallpaperDownloadManager = new WallpaperDownloadManager(
      this.userArguments,
    );
    await wallpaperDownloadManager.init()
      .catch((e) => {
        print("Failed to initialize WallpaperDownloadManager.", e);
        std.exit(2);
      });
  }

  async handleWallpaperSetter() {
    const wallpaperSetter = new WallpaperSetter(this.userArguments);
    await wallpaperSetter.init()
      .catch((e) => {
        print("Failed to initialize WallpaperSetter.", e);
        std.exit(1);
      });
  }
}

const wallWiz = new WallWiz();
await wallWiz.run().catch((e) => print("Failed to initialize WallWiz:", e));
