/**
 * @file wallpaperDownloadManager.js
 * @description Manages the download and preview of wallpapers
 */
import { ProcessSync } from "../justjs/src/process.js";
import Download from "./downloadManager.js";
import { UserInterface } from "./userInterface.js";
import utils from "./utils.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";

/**
 * @class WallpaperDownloadManager
 * @extends Download
 * @description Manages the process of downloading, filtering, and previewing wallpapers
 */
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
    try {
      this.availableWallpapersInTheRepo = await this.fetchItemListFromRepo();
      this.prepareMenu();
      this.filterWallpapersForPreview();
      await this.downloadItemInDestinationDir();
      await this.previewWallpapersForDownload();
    } catch (error) {
      print("Error in WallpaperDownloadManager's init");
      throw error;
    }
  }

  /**
   * @method prepareMenu
   * @description Prepares the menu of available wallpapers
   */
  prepareMenu() {
    this.downloadItemMenu = this.availableWallpapersInTheRepo.map(
      (wallpaper) => ({
        name: wallpaper.name,
        downloadUrl: wallpaper.download_url,
      }),
    );
  }

  /**
   * @method filterWallpapersForPreview
   * @description Prompts user to filter wallpapers for preview
   */
  filterWallpapersForPreview() {
    const availableWallpaperNames = this.downloadItemMenu.map((wallpaper) =>
      wallpaper.name
    ).join("\n");
    const fzfCommand =
      `fzf -m --bind 'enter:select-all+accept' --layout="reverse" --prompt="\\b" --marker="\\b" --pointer="\\b" --header="Type wallpaper name or category to search for matching wallpaper." --header-first --border=double --border-label=" Wallpapers "`;

    const filter = new ProcessSync(fzfCommand, {
      input: availableWallpaperNames,
      useShell: true,
    });

    if (filter.run()) {
      const filteredWallpapers = filter.stdout.trim().split("\n");
      if (filteredWallpapers.length) {
        print(
          ansi.styles(["bold", "blue"]),
          "\n Fetching wallpapers for preview\n",
          ansi.style.reset,
        );
        this.downloadItemList = this.downloadItemMenu.filter((wallpaper) =>
          filteredWallpapers.includes(wallpaper.name)
        );
      }
    }
  }

  /**
   * @method removeTempWallpapers
   * @param {string[]} wallpapers - List of wallpaper filenames to remove
   * @description Removes temporary wallpaper files
   */
  removeTempWallpapers(wallpapers) {
    wallpapers.forEach((wallpaperName) => {
      const filePath = `${this.destinationDir}${wallpaperName}`;
      OS.remove(filePath);
    });
  }

  /**
   * @method previewWallpapersForDownload
   * @description Handles the preview and selection of wallpapers for download
   * @returns {Promise<void>}
   */
  async previewWallpapersForDownload() {
    try {
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
    } catch (error) {
      print("Failed to preview wallpapers for download:");
      throw error;
    }
  }

  /**
   * @method handleWallpaperSelection
   * @param {Object} wallpaper - Selected wallpaper object
   * @description Handles the selection and moving of a wallpaper to its final destination
   * @returns {Promise<void>}
   */
  async handleWallpaperSelection(wallpaper) {
    try {
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
    } catch (error) {
      print("Error in handleWallpaperSelection.");
      throw error;
    }
  }

  getWallpaperPath(wallpaper) {
    return this.destinationDir.concat(wallpaper.name);
  }
}
