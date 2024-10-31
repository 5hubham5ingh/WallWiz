import { ProcessSync } from "../../qjs-ext-lib/src/process.js";
import Download from "./downloadManager.js";
import { UserInterface } from "./userInterface.js";
import utils from "./utils.js";

/**
 * @class WallpaperDownloadManager
 * @extends Download
 * @description Manages the process of downloading, filtering, and previewing wallpapers
 */
"use strip";
export default class WallpaperDownloadManager extends Download {
  constructor() {
    const downloadDestinationDirectory = `${HOME_DIR}/.cache/WallWiz/tmp/`;
    super(USER_ARGUMENTS.wallpaperRepositoryUrls, downloadDestinationDirectory);

    this.downloadItemMenu = [];
    this.downloadItemFilteredMenu = [];
  }

  /**
   * @method init
   * @description Initializes the wallpaper download process
   * @returns {Promise<void>}
   */
  async init() {
    await catchAsyncError(async () => {
      this.availableWallpapersInTheRepo = await this.fetchItemListFromRepo();
      this.prepareMenu();
      this.filterWallpapersForPreview();
      await this.downloadItemInDestinationDir();
      await this.previewWallpapersForDownload();
    }, "WallpaperDownloadManager :: init");
  }

  /**
   * @method prepareMenu
   * @description Prepares the menu of available wallpapers
   */
  prepareMenu() {
    catchError(() => {
      this.downloadItemMenu = this.availableWallpapersInTheRepo.map(
        (wallpaper) => ({
          name: wallpaper.name,
          downloadUrl: wallpaper.download_url,
        }),
      );
    }, "prepareMenu");
  }

  /**
   * @method filterWallpapersForPreview
   * @description Prompts user to filter wallpapers for preview
   */
  filterWallpapersForPreview() {
    catchError(() => {
      const availableWallpaperNames = this.downloadItemMenu.map((wallpaper) =>
        wallpaper.name
      ).join("\n");
      const fzfCommand =
        `fzf -m --bind 'enter:select-all+accept' --layout="reverse" --highlight-line --prompt="\b " --marker="\b" --pointer="\b" --header="Type wallpaper name or category to filter out matching group of wallpapers." --header-first --border=double --border-label=" Wallpapers "`;

      const filter = new ProcessSync(fzfCommand, {
        input: availableWallpaperNames,
        useShell: true,
      });
      try {
        filter.run();
      } catch (error) {
        throw new SystemError(
          "Failed to run fzf.",
          "Make sure it is installed and available in the system.",
          error,
        );
      }
      if (filter.success) {
        const filteredWallpapers = filter.stdout.trim().split("\n");
        if (filteredWallpapers.length) {
          utils.log("Fetching wallpapers for preview");
          this.downloadItemList = this.downloadItemMenu.filter((wallpaper) =>
            filteredWallpapers.includes(wallpaper.name)
          );
        }
      } else {
        throw new SystemError(
          "No wallpaper selected.",
          "Select atleast one wallpaper to preview.",
        );
      }
    }, "filterWallpapersForPreview");
  }

  /**
   * @method removeTempWallpapers
   * @param {string[]} wallpapers - List of wallpaper filenames to remove
   * @description Removes temporary wallpaper files
   */
  removeTempWallpapers(wallpapers) {
    catchError(() => {
      wallpapers.forEach((wallpaperName) => {
        const filePath = `${this.destinationDir}${wallpaperName}`;
        OS.remove(filePath);
      });
    }, "removeTempWallpapers");
  }

  /**
   * @method previewWallpapersForDownload
   * @description Handles the preview and selection of wallpapers for download
   * @returns {Promise<void>}
   */
  async previewWallpapersForDownload() {
    await catchAsyncError(async () => {
      const [tempDownloadedWallpapers, error] = OS.readdir(this.destinationDir);
      if (error !== 0) {
        throw new Error(
          `Failed to read temporary downloaded files: \n` +
            this.destinationDir,
        );
      }

      if (!tempDownloadedWallpapers.length) return;

      const tempWallpapers = tempDownloadedWallpapers
        .filter((fileName) => fileName !== "." && fileName !== "..")
        .map((wallpaper) => ({ name: wallpaper, uniqueId: wallpaper }));

      const UI = new UserInterface(
        tempWallpapers,
        this.destinationDir,
        this.handleWallpaperSelection.bind(this),
        this.getWallpaperPath.bind(this),
      );

      await UI.init();
      this.removeTempWallpapers(tempDownloadedWallpapers);
    }, "previewWallpapersForDownload");
  }

  /**
   * @method handleWallpaperSelection
   * @param {Object} wallpaper - Selected wallpaper object
   * @description Handles the selection and moving of a wallpaper to its final destination
   * @returns {Promise<void>}
   */
  async handleWallpaperSelection(wallpaper) {
    await catchAsyncError(async () => {
      const sourceWallpaperPath = `${this.destinationDir}${wallpaper.uniqueId}`;
      const destinationWallpaperPath =
        `${USER_ARGUMENTS.wallpapersDirectory}${wallpaper.uniqueId}`;

      const error = OS.rename(sourceWallpaperPath, destinationWallpaperPath);
      if (error) {
        throw new Error(
          `Failed to move wallpaper\n` +
            `Error code: ${error}`,
        );
      }
      await utils.notify(
        "Download complete:",
        destinationWallpaperPath,
        "normal",
      );
    }, "handleWallpaperSelection");
  }

  getWallpaperPath(wallpaper) {
    return catchError(
      () => this.destinationDir.concat(wallpaper.name),
      "getWallpaperPath",
    );
  }
}
