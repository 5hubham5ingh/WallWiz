import { ProcessSync } from "../../qjs-ext-lib/src/process.js";
import Download from "./downloadManager.js";
import { ansi } from "../../justjs/ansiStyle.js";
import utils from "./utils.js";

/**
 * @typedef {import('./types.d.ts').DownloadItemMenu} DownloadItemMenu
 */

"use strip";
class ExtensionScriptsDownloader extends Download {
  constructor(...all) {
    super(...all);
    catchError(() => {
      this.tempDir = "/tmp/WallWiz/";

      /**
       * @type {DownloadItemMenu}
       */
      this.downloadItemMenu;
      utils.ensureDir(this.tempDir);
    }, "ExtensionScriptsDownloader :: constructor");
  }

  async prepareMenu(res) {
    await catchAsyncError(async () => {
      const itemList = res.filter((script) => script.type === "file");

      const promises = [];

      const fetchScriptHead = async (url) => {
        return await catchAsyncError(async () =>
          await this.fetch(url, {
            "Range": "bytes=0-500",
          }), "fetchScriptHead");
      };

      for (const script of itemList) {
        const getScriptPromise = fetchScriptHead(script.download_url)
          .then((head) => ({
            name: script.name,
            about: head,
            downloadUrl: script.download_url,
          }));

        promises.push(getScriptPromise);
      }

      this.downloadItemMenu = await Promise.all(promises);
    }, "prepareMenu");
  }

  promptUserToChooseScriptsToDownload(kindOfScript) {
    catchError(() => {
      const tempScriptsPaths = this.downloadItemMenu.map((script) =>
        script.tmpFile
      ).join("\n");

      const header =
        `${ansi.style.bold}${ansi.style.brightCyan}"Type program name to search for ${kindOfScript}."`;

      const filter = new ProcessSync(
        `fzf -m --delimiter / --with-nth -1 --preview="cat {}"  --preview-window="down:40%,wrap" --preview-label=" Description " --layout="reverse" --header=${header} --header-first --border=double --border-label=" ${kindOfScript} "`,
        {
          input: tempScriptsPaths,
          useShell: true,
        },
      );

      try {
        filter.run();
      } catch (error) {
        throw new SystemError(
          "Failed to run fzf.",
          "Make sure fzf is installed and available in the system.",
          error,
        );
      }

      if (!filter.success) {
        throw new SystemError("Error", filter.stderr || "No item selected.");
      }

      const filteredItem = filter.stdout.split("\n");
      this.downloadItemList = this.downloadItemMenu.filter((item) =>
        filteredItem.includes(item.tmpFile)
      );
    }, "promptUserToChooseScriptsToDownload");
  }

  writeTempItemInTempDir() {
    catchError(() => {
      for (const item of this.downloadItemMenu) {
        const currFile = this.tempDir.concat(item.name);
        const tmpFile = STD.open(currFile, "w+");
        const start = item.about.indexOf("/*") + 2;
        const end = item.about.lastIndexOf("*/") - 1;
        const about = item.about.slice(start, end);
        tmpFile.puts(about);
        tmpFile.close();
        item.tmpFile = currFile;
      }
    }, "writeTempItemInTempDir");
  }
}

class ThemeExtensionScriptsDownloadManager extends ExtensionScriptsDownloader {
  constructor() {
    const themeExtensionSourceRepoUrl =
      `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/themeExtensionScripts`;
    const themeExtensionScriptDestinationDir = HOME_DIR.concat(
      "/.config/WallWiz/themeExtensionScripts/",
    );
    super([themeExtensionSourceRepoUrl], themeExtensionScriptDestinationDir);
  }

  async init() {
    await catchAsyncError(async () => {
      utils.log("Fetching list of theme extension scripts...");
      const itemList = await this.fetchItemListFromRepo();
      await this.prepareMenu(itemList);
      this.writeTempItemInTempDir();
      this.promptUserToChooseScriptsToDownload("Theme extension scripts");
      await this.downloadItemInDestinationDir();
    }, "ThemeExtensionScriptsDownloadManager :: init");
  }
}

class WallpaperDaemonHandlerScriptDownloadManager
  extends ExtensionScriptsDownloader {
  constructor() {
    const themeExtensionSourceRepoUrl =
      `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/wallpaperDaemonHandlerScripts`;
    const themeExtensionScriptDestinationDir = HOME_DIR.concat(
      "/.config/WallWiz/",
    );
    super([themeExtensionSourceRepoUrl], themeExtensionScriptDestinationDir);
  }

  async init() {
    await catchAsyncError(async () => {
      utils.log(
        "Fetching list of wallpaper daemon handler extension scripts...",
      );
      const itemList = await this.fetchItemListFromRepo();
      await this.prepareMenu(itemList);
      this.writeTempItemInTempDir();
      this.promptUserToChooseScriptsToDownload(
        "Wallpaper daemon handler script.",
      );
      await this.downloadItemInDestinationDir();
    }, "WallpaperDaemonHandlerScriptDownloadManager :: init");
  }
}

export {
  ThemeExtensionScriptsDownloadManager,
  WallpaperDaemonHandlerScriptDownloadManager,
};
