import Download from "./downloadManager";

export default class WallpaperDownloadManager extends Download {
  constructor(wallpaperDir) {
    this.downloadDestinationDirectory = wallpaperDir;
    this.wallpaperSourceUrl = ''
    this.availableWallpapersList = [];
    super(this.wallpaperSourceUrl, this.downloadDestinationDirectory)
  }

  async start() {
    // check if response is 302, if yes then use the cached availableWallpapersList, else reassign it and update cache
    this.availableWallpapersInTheRepo = await this.fetchItemListFromRepoAndPrepareMenu();
    this.prepareMenu()
    this.promptUserToFilterWallpapersToPreviewAndDownload();
    // preview the wallpaper before downloading, pressing d in the preview windoe will download the wallpaper.
    await this.downloadItemInDestinationDir();
  }

  prepareMenu() {
    for (wallpaper of this.availableWallpapersInTheRepo) {
      this.availableWallpapersList.push(
        {
          name: wallpaper.name,
          downloadUrl: wallpaper.download_url
        }
      )
    }
  }


  promptUserToFilterWallpapersToPreviewAndDownload() {
    const availableWallpaperNames = this.availableWallpapersList.map(wallpaper => wallpaper.name).join('\n');

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

