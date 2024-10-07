import { curlRequest } from "../justjs/src/curl.js";
import { ProcessSync } from "../justjs/src/process.js";
import Download from "./downloadManager.js";
import { ensureDir } from "../justjs/src/fs.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import QJS from "./quickJs.js";

/**
 * @typedef {import('./types.ts').IStd} IStd
 */


/**
* @type {{ std: IStd }}
 */
const { std } = QJS;

class ExtensionScriptsDownloader extends Download {
  constructor(...all) {
    super(...all);
    this.homeDir = std.getenv("HOME");
    this.tempDir = "/tmp/WallWiz/";
    this.downloadItemMenu;
    ensureDir(this.tempDir);
  }

  async prepareMenu(res) {
    const itemList = res.filter((script) => script.type === "file");

    const promises = [];

    const fetchScriptHead = async (url) => {
      return curlRequest(url, {
        headers: {
          "Range": "bytes=0-500",
        },
      }).catch((e) => print("Failed to fetch script head for: ", url, "\n", e));
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
  }

  promptUserToChooseScriptsToDownload(kindOfScript) {
    const tempScriptsPaths = this.downloadItemMenu.map((script) =>
      script.tmpFile
    )
      .join("\n");


    const header = `${ansi.style.bold}${ansi.style.brightCyan}"Type program name to search for ${kindOfScript}."`

    const filter = new ProcessSync(
      `fzf -m --delimiter / --with-nth -1 --preview="cat {}"  --preview-window="down:40%,wrap" --preview-label=" Description " --layout="reverse" --header=${header} --header-first --border=double --border-label=" ${kindOfScript} "`,
      {
        input: tempScriptsPaths,
        useShell: true,
      },
    );
    if (!filter.run()) {
      return;
    }

    const filteredItem = filter.stdout.split("\n");
    this.downloadItemList = this.downloadItemMenu.filter((item) =>
      filteredItem.includes(item.tmpFile)
    );
  }

  writeTempItemInTempDir() {
    for (const item of this.downloadItemMenu) {
      const currFile = this.tempDir.concat(item.name);
      const tmpFile = std.open(currFile, "w+");
      const start = item.about.indexOf("/*") + 2;
      const end = item.about.lastIndexOf("*/") - 1;
      const about = item.about.slice(start, end);
      tmpFile.puts(about);
      tmpFile.close();
      item.tmpFile = currFile;
    }
  }
}

class ThemeExtensionScriptsDownloadManager extends ExtensionScriptsDownloader {
  constructor() {
    const themeExtensionSourceRepoUrl =
      `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/themeExtensionScripts`;
    const themeExtensionScriptDestinationDir = std.getenv('HOME').concat(
      "/.config/WallWiz/themeExtensionScripts/",
    );
    super([themeExtensionSourceRepoUrl], themeExtensionScriptDestinationDir);
  }

  async init() {
    const response = await this.fetchItemListFromRepo();
    await this.prepareMenu(response);
    this.writeTempItemInTempDir();
    this.promptUserToChooseScriptsToDownload("Theme extension scripts");
    await this.downloadItemInDestinationDir();
  }
}

class WallpaperDaemonHandlerScriptDownloadManager
  extends ExtensionScriptsDownloader {
  constructor() {
    const themeExtensionSourceRepoUrl =
      `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/wallpaperDaemonHandlerScripts`;
    const themeExtensionScriptDestinationDir = std.getenv('HOME').concat(
      "/.config/WallWiz/",
    );
    super([themeExtensionSourceRepoUrl], themeExtensionScriptDestinationDir);
  }

  async init() {
    const response = await this.fetchItemListFromRepo();
    await this.prepareMenu(response);
    this.writeTempItemInTempDir();
    this.promptUserToChooseScriptsToDownload(
      "Wallpaper daemon handler script.",
    );
    await this.downloadItemInDestinationDir();
  }
}

export {
  ThemeExtensionScriptsDownloadManager,
  WallpaperDaemonHandlerScriptDownloadManager,
};

