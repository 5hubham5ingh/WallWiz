import { ProcessSync } from "../justjs/src/process.js";
import Download from "./downloadManager.js";

export default class WallpaperDownloadManager extends Download {
  constructor(wallpaperDir) {
    const downloadDestinationDirectory = wallpaperDir;
    const wallpaperSourceUrl = 'https://github.com/D3Ext/aesthetic-wallpapers/tree/main/images'
    super(wallpaperSourceUrl, downloadDestinationDirectory)
  }

  async start() {
    // check if response is 302, if yes then use the cached downloadItemMenu, else reassign it and update cache
    this.availableWallpapersInTheRepo = await this.fetchItemListFromRepo();
    this.prepareMenu()
    this.promptUserToFilterWallpapersToDownloadAndPreview();
    // preview the wallpaper before downloading, pressing d in the preview windoe will download the wallpaper.
    await this.downloadItemInDestinationDir();
  }

  prepareMenu() {
    for (const wallpaper of this.availableWallpapersInTheRepo) {
      this.downloadItemMenu.push(
        {
          name: wallpaper.name,
          downloadUrl: wallpaper.download_url
        }
      )
    }
  }


  promptUserToFilterWallpapersToDownloadAndPreview() {
    const availableWallpaperNames = this.downloadItemMenu.map(wallpaper => wallpaper.name).join('\n');

    const filter = new ProcessSync(
      `fzf -m --bind 'enter:select-all+accept' --layout="reverse" --header="Type wallpaper name or category to search for matching wallpaper." --header-first --border=double --border-label=" Wallpapers "`,
      {
        input: availableWallpaperNames,
        useShell: true,
      },
    );
    if (!filter.run()) {
      return;
    }

    // for now, download the wallpaper from filtered list.
    this.downloadItemList = filter.stdout.split('\n')
  }
}

