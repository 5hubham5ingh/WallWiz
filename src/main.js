import * as _ from "./globalConstants.js";
import arg from "../../qjs-ext-lib/src/arg.js";
import {
  ThemeExtensionScriptsDownloadManager,
  WallpaperDaemonHandlerScriptDownloadManager,
} from "./extensionScriptDownloadManager.js";
import WallpaperDownloadManager from "./wallpaperDownloadManager.js";
import WallpaperSetter from "./wallpapersManager.js";
import { UserInterface } from "./userInterface.js";

"use strip";
class WallWiz {
  constructor() {
    globalThis.USER_ARGUMENTS = this.parseArguments();
  }

  async run() {
    try {
      OS.ttySetRaw();
      this.handleShowKeymaps();
      await this.handleThemeExtensionScriptDownload();
      await this.handleWallpaperHandlerScriptDownload();
      await this.handleWallpaperBrowsing();
      await this.handleWallpaperSetter();
    } catch (status) {
      this.handleExecutionStatus(status);
    } finally {
      STD.exit(0);
    }
  }

  /**
   * Parses the command-line arguments and returns them in a structured format.
   *
   * @returns {typeof USER_ARGUMENTS} Parsed user arguments.
   */
  parseArguments() {
    // Helper function to split string of format "AxB" into an array of two numbers
    const splitNumbersFromString = (str) => str.split("x").map(Number);

    // Define argument names and their corresponding command-line flags
    const argNames = {
      wallpapersDirectory: "--wall-dir",
      setRandomWallpaper: "--random",
      imageSize: "--img-size",
      enableLightTheme: "--light-theme",
      padding: "--padding",
      enablePagination: "--enable-pagination",
      gridSize: "--grid-size",
      downloadThemeExtensionScripts: "--theme-extensions",
      downloadWallpaperDaemonHandlerScript: "--wallpaper-handler",
      browseWallpaperOnline: "--browse",
      wallpaperRepositoryUrls: "--repo-url",
      githubApiKey: "--api-key",
      showKeyMap: "--show-keymap",
      disableNotification: "--disable-notification",
      disableAutoScaling: "--disable-autoscaling",
      setInterval: "--set-interval",
      hold: "--hold",
      processLimit: "--plimit",
      inspection: "--inspection",
    };

    // Define and parse command-line arguments using the 'arg' library
    const userArguments = arg
      .parser({
        [argNames.wallpapersDirectory]: arg
          .path(".")
          .env("WALLPAPER_DIR")
          .check()
          .map((path) => path.concat("/"))
          .desc("Wallpaper directory path."),
        [argNames.setRandomWallpaper]: arg
          .flag(false)
          .desc("Apply random wallpaper from the directory."),
        [argNames.imageSize]: arg
          .str("30x10")
          .reg(/^\d+x\d+$/)
          .desc("Image cell size.")
          .val("WIDTHxHEIGHT")
          .err(
            "Invalid size, it should be of WIDTHxHEIGHT format. \n Ex:- 60x20",
          )
          .map(splitNumbersFromString),
        [argNames.enableLightTheme]: arg.flag(false).desc(
          "Enable light theme.",
        ),
        [argNames.padding]: arg
          .str("1x1")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid padding, it should of VERTICLE_PADDINGxHORIZONTAL_PADDING format. \n Ex:- 2x1",
          )
          .map(splitNumbersFromString)
          .desc("Container padding in cells.")
          .val("VERTICLExHORIZONTAL"),
        [argNames.enablePagination]: arg
          .flag(false)
          .desc(
            "Display wallpapers in a fixed size grid. Remaining wallpapers will be displayed in the next grid upon navigation.",
          ),
        [argNames.gridSize]: arg
          .str("4x4")
          .reg(/^\d+x\d+$/)
          .err(
            "Invalid grid size. \n Ex:- 4x4",
          )
          .map(splitNumbersFromString)
          .desc("Wallpaper grid size.")
          .val("WIDTHxHEIGHT"),
        [argNames.downloadThemeExtensionScripts]: arg
          .flag(false)
          .desc("Download theme extension scripts."),
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
          .err("Invalid repository url(s).")
          .desc("Wallpaper repository github url(s).")
          .val("URL(s)"),
        [argNames.githubApiKey]: arg
          .str()
          .env("GITHUB_API_KEY")
          .desc("Github API key."),
        [argNames.showKeyMap]: arg
          .flag(false)
          .desc("Display keymaps for the user interface."),
        [argNames.disableNotification]: arg
          .flag(false)
          .desc("Disable desktop notifications."),
        [argNames.disableAutoScaling]: arg
          .flag(false)
          .desc("Disable auto scale terminal size to fit all images."),
        [argNames.setInterval]: arg
          .num(0)
          .min(0)
          .max(Number.MAX_SAFE_INTEGER)
          .desc("Set time interval to periodically apply random wallpaper."),
        [argNames.hold]: arg
          .flag(true)
          .desc(
            "Keep the app running even after the wallpaper has been applyed.",
          ),
        [argNames.processLimit]: arg
          .num()
          .min(1)
          .desc("Number of execution threads used. (default: auto)"),
        [argNames.inspection]: arg
          .flag(false)
          .desc("Enable verbose error log for inspection."),
        "-d": argNames.wallpapersDirectory,
        "-r": argNames.setRandomWallpaper,
        "-s": argNames.imageSize,
        "-p": argNames.padding,
        "-e": argNames.enablePagination,
        "-g": argNames.gridSize,
        "-l": argNames.enableLightTheme,
        "-t": argNames.downloadThemeExtensionScripts,
        "-w": argNames.downloadWallpaperDaemonHandlerScript,
        "-b": argNames.browseWallpaperOnline,
        "-u": argNames.wallpaperRepositoryUrls,
        "-k": argNames.githubApiKey,
        "-m": argNames.showKeyMap,
        "-n": argNames.disableNotification,
        "-a": argNames.disableAutoScaling,
        "-v": argNames.setInterval,
        "-o": argNames.hold,
        "-x": argNames.processLimit,
        "-i": argNames.inspection,
      })
      .ex([
        "-d ~/Pics/wallpapers -s 42x10",
        "-l -p 4x4",
      ])
      .ver("0.0.1-alpha.8")
      .parse();

    // Convert parsed arguments to a more convenient object format
    return Object.fromEntries(
      Object.entries(argNames).map((
        [key, value],
      ) => [key, userArguments[value]]),
    );
  }

  async handleThemeExtensionScriptDownload() {
    if (!USER_ARGUMENTS.downloadThemeExtensionScripts) return;
    return await catchAsyncError(async () => {
      const downloadManager = new ThemeExtensionScriptsDownloadManager();
      await downloadManager.init();
    }, "handleThemeExtensionScriptDownload");
  }

  async handleWallpaperHandlerScriptDownload() {
    if (!USER_ARGUMENTS.downloadWallpaperDaemonHandlerScript) return;
    return await catchAsyncError(async () => {
      const downloadManager = new WallpaperDaemonHandlerScriptDownloadManager();
      await downloadManager.init();
    }, "handleWallpaperHandlerScriptDownload");
  }

  async handleWallpaperBrowsing() {
    if (!USER_ARGUMENTS.browseWallpaperOnline) return;

    return await catchAsyncError(async () => {
      const wallpaperDownloadManager = new WallpaperDownloadManager();
      await wallpaperDownloadManager.init();
    }, "handleWallpaperBrowsing");
  }

  async handleWallpaperSetter() {
    return await catchAsyncError(async () => {
      const wallpaperSetter = new WallpaperSetter();
      await wallpaperSetter.init();
    }, "handleWallpaperSetter");
  }

  handleShowKeymaps() {
    catchError(() => {
      if (!USER_ARGUMENTS.showKeyMap) return;
      UserInterface.printKeyMaps();
    }, "handleShowKeymaps");
  }

  handleExecutionStatus(status) {
    if (status === SUCCESS) STD.exit(0);
    if (status instanceof SystemError) {
      status.log(USER_ARGUMENTS.inspection);
    } else if (USER_ARGUMENTS.inspection) {
      const stackTrace = status?.stackTrace?.map((stack) => {
        return " at " + stack;
      }).join("\n");
      print(status, "\n", stackTrace);
    }
  }
}

const wallWiz = new WallWiz();
await wallWiz.run();
