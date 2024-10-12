import * as _ from "./globalConstants.js";
import arg from "../../justjs/src/arg.js";
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
      // Set the terminal to raw mode for better input handling
      OS.ttySetRaw();

      // Handle various operations based on user arguments
      this.handleShowKeymaps();
      await this.handleThemeExtensionScriptDownload();
      await this.handleWallpaperHandlerScriptDownload();
      await this.handleWallpaperBrowsing();
      await this.handleWallpaperSetter();
    } catch (error) {
      // Print any errors that occur during execution
      if (error instanceof SystemError) {
        error.log(USER_ARGUMENTS.inspection);
      } else if (USER_ARGUMENTS.inspection) {
        print(error);
      }
    } finally {
      // Ensure the program exits properly
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
        "-x": argNames.processLimit,
        "-i": argNames.inspection,
      })
      .ex([
        "-d ~/Pics/wallpapers -s 42x10",
        "-l -p 4x4",
      ])
      .ver("0.0.1-alpha.5")
      .parse();

    // Convert parsed arguments to a more convenient object format
    return Object.fromEntries(
      Object.entries(argNames).map((
        [key, value],
      ) => [key, userArguments[value]]),
    );
  }

  async handleThemeExtensionScriptDownload() {
    // Check if theme extension script download is requested
    if (!USER_ARGUMENTS.downloadThemeExtensionScripts) return;
    try {
      // Initialize and run the theme extension scripts download manager
      const downloadManager = new ThemeExtensionScriptsDownloadManager();
      await downloadManager.init();
    } catch (error) {
      throw new Error(
        "Failed to start Download manager for theme extension scripts.\n"
          .concat(error),
      );
    }
  }

  async handleWallpaperHandlerScriptDownload() {
    // Check if wallpaper daemon handler script download is requested
    if (!USER_ARGUMENTS.downloadWallpaperDaemonHandlerScript) return;
    try {
      // Initialize and run the wallpaper daemon handler script download manager
      const downloadManager = new WallpaperDaemonHandlerScriptDownloadManager();
      await downloadManager.init();
    } catch (error) {
      throw new Error(
        "Failed to start downloadManager for wallpaper daemon handle script.\n"
          .concat(error),
      );
    }
  }

  async handleWallpaperBrowsing() {
    // Check if online wallpaper browsing is requested
    if (!USER_ARGUMENTS.browseWallpaperOnline) return;
    try {
      // Initialize and run the wallpaper download manager for online browsing
      const wallpaperDownloadManager = new WallpaperDownloadManager();
      await wallpaperDownloadManager.init();
    } catch (error) {
      throw new Error(
        "Failed to initialize WallpaperDownloadManager.\n".concat(error),
      );
    }
  }

  async handleWallpaperSetter() {
    try {
      // Initialize and run the wallpaper setter
      const wallpaperSetter = new WallpaperSetter();
      await wallpaperSetter.init();
    } catch (error) {
      throw new Error(
        "Failed to initialize WallpaperSetter.".concat(error),
      );
    }
  }

  handleShowKeymaps() {
    // Check if showing keymaps is requested
    if (!USER_ARGUMENTS.showKeyMap) return;
    // Display keymaps and exit the program
    UserInterface.printKeyMaps();
    STD.exit(0);
  }
}

// Create an instance of WallWiz and run the application
const wallWiz = new WallWiz();
await wallWiz.run();
