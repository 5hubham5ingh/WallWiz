import { ProcessSync } from "../justjs/src/process.js";
import Download from "./downloadManager.js";
import { UiInitializer } from "./ui.js";
import { os, std } from "./quickJs.js";
import { clearTerminal } from "../justjs/src/just-js/helpers/cursor.js";
import config from "./config.js";

export default class WallpaperDownloadManager extends Download {
  constructor(params) {
    const downloadDestinationDirectory = config.homeDir.concat(
      "/.cache/WallWiz/.temp/",
    );
    const wallpaperSourceUrl =
      "https://github.com/D3Ext/aesthetic-wallpapers/tree/main/images";
    super(wallpaperSourceUrl, downloadDestinationDirectory);
    this.downloadItemMenu = [];
    this.downloadItemFilteredMenu = [];
    this.uiParams = params;
  }

  async start() {
    // check if response is 302, if yes then use the cached downloadItemMenu, else reassign it and update cache
    this.availableWallpapersInTheRepo = await this.fetchItemListFromRepo();
    this.prepareMenu();
    this
      .promptUserToFilterWallpapersFromAvailableWallpapersInTheRepoForPreview();
    await this.downloadItemInDestinationDir();
    await this.previewWallpapersForDownload();
  }

  prepareMenu() {
    for (const wallpaper of this.availableWallpapersInTheRepo) {
      this.downloadItemMenu.push(
        {
          name: wallpaper.name,
          downloadUrl: wallpaper.download_url,
        },
      );
    }
  }

  async previewWallpapersForDownload() {
    // provide wallpapers and handleSelection to the Ui class.
    const [tempDownloadedWallpapers, error] = os.readdir(this.destinationDir);
    if (error !== 0) {
      throw new Error(
        "Failed to read temporary download files from ",
        this.destinationDir,
      );
    }
    if (!tempDownloadedWallpapers.length) return;
    const handleSelection = (wallpaper) => {
      try {
        const sourceWallpaperPath = this.destinationDir.concat(
          wallpaper.uniqueId,
        );
        const destinationWallapaperPath = this.uiParams.wallpapersDir.concat(
          wallpaper.uniqueId,
        );
        const error = os.rename(
          sourceWallpaperPath,
          destinationWallapaperPath,
        );
        if (error) {
          print(clearTerminal, error);
          std.exit(error);
        }
      } catch (e) {
        print(clearTerminal, "HandleSelection:", e);
      }
    };

    this.uiParams.picCacheDir = this.destinationDir;
    this.uiParams.handleSelection = handleSelection;
    this.uiParams.wallpapers = tempDownloadedWallpapers.filter((fileName) =>
      fileName !== "." && fileName !== ".."
    ).map((wallpaper) => ({
      uniqueId: wallpaper,
    }));
    const UI = new UiInitializer(this.uiParams);
    await UI.init().catch((e) =>
      print("Failed to initialize UI for downloading wallpapers.", e)
    );
  }

  promptUserToFilterWallpapersFromAvailableWallpapersInTheRepoForPreview() {
    const availableWallpaperNames = this.downloadItemMenu.map((wallpaper) =>
      wallpaper.name
    ).join("\n");

    const filter = new ProcessSync(
      `fzf -m --bind 'enter:select-all+accept' --layout="reverse" --prompt="\b" --marker="\b" --pointer="\b" --header="Type wallpaper name or category to search for matching wallpaper." --header-first --border=double --border-label=" Wallpapers "`,
      {
        input: availableWallpaperNames,
        useShell: true,
      },
    );
    if (!filter.run()) {
      return;
    }

    // for now, download the wallpaper from filtered list.
    const filterdWallpapers = filter.stdout.split("\n");
    if (!filterdWallpapers.length) return;
    this.downloadItemList = this.downloadItemMenu.filter((wallpaper) =>
      filterdWallpapers.includes(wallpaper.name)
    );
  }
}
