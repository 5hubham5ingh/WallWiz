import { curlRequest } from "../justjs/src/curl.js";
import { ProcessSync } from "../justjs/src/process.js";
import Download from "./downloadManager.js";
import config from "./config.js";

class ExtensionScriptsDownloader extends Download {
  constructor(...all) {
    super(...all);
  }

  async prepareMenu(res) {
    const itemList = res.filter((script) => script.type === "file");

    const promises = [];

    const fetchScriptHead = async (url) => {
      return curlRequest(url, {
        headers: {
          "Range": "bytes=0-499",
        },
      }).catch((e) => print("Failed to fetch script head for: ", url, "\n", e));
    };

    for (const script of itemList) {
      const getScriptPromise = fetchScriptHead(script.download_url)
        .then((head) => ({
          name: script.name,
          about: head,
          download_url: script.download_url,
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
    const filter = new ProcessSync(
      `fzf -m --delimiter / --with-nth -1 --preview="cat {}"  --preview-window="down:40%,wrap" --preview-label=" Description " --layout="reverse" --header="Type program name to search for ${kindOfScript}." --header-first --border=double --border-label=" ${kindOfScript} "`,
      {
        input: tempScriptsPaths,
        useShell: true,
      },
    );
    if (!filter.run()) {
      return;
    }
    this.downloadItemList = filter.stdout.split("\n");
  }
}

class ThemeExtensionScriptsDownloadManager extends ExtensionScriptsDownloader {
  constructor() {
    const themeExtensionSourceRepoUrl =
      `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/themeExtensionScripts`;
    const themeExtensionScriptDestinationDir = config.homeDir.concat(
      "/.config/WallWiz/themeExtensionScripts/",
    );
    super(themeExtensionSourceRepoUrl, themeExtensionScriptDestinationDir);
  }

  async start() {
    await this.fetchItemListFromRepoAndPrepareMenu();
    this.writeTempItemInTempDir();
    this.promptUserToChooseScriptsToDownload("Theme extension scripts");
    await this.downloadItemInDestinationDir();
  }
}

// const themeExtScriptManager = new ThemeExtensionScripts();
// await themeExtScriptManager.start();

class WallpaperDaemonHandlerScriptDownloadManager
  extends ExtensionScriptsDownloader {
  constructor() {
    const themeExtensionSourceRepoUrl =
      `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/wallpaperDaemonHandlerScripts`;
    const themeExtensionScriptDestinationDir = config.homeDir.concat(
      "/.config/WallWiz/",
    );
    super(themeExtensionSourceRepoUrl, themeExtensionScriptDestinationDir);
  }

  async start() {
    await this.fetchItemListFromRepoAndPrepareMenu();
    this.writeTempItemInTempDir();
    this.promptUserToChooseScriptsToDownload(
      "Wallpaper daemon handler script.",
    );
    await this.downloadItemInDestinationDir();
  }
}

// const wallpaperDaemonHandler = new WallpaperDaemonHandlerScript();
// await wallpaperDaemonHandler.start();

export {
  ThemeExtensionScriptsDownloadManager,
  WallpaperDaemonHandlerScriptDownloadManager,
};

// For selecting all the visible wallpapers after query, for preview.
//fzf --multi --bind 'enter:select-all+accept'
