import { curlRequest } from "../justjs/src/curl.js";
import { ensureDir } from "../justjs/src/fs.js";
import { os } from "./quickJs.js";

export default class Download {
  constructor(sourceRepoUrl, destinationDir) {
    this.destinationDir = destinationDir;
    this.sourceRepoUrl = sourceRepoUrl;
    this.tempDir = "/tmp/WallWiz/";
    this.downloadItemMenu;
    this.downloadItemList;
    ensureDir(this.tempDir);
    ensureDir(this.destinationDir);
  }

  // @abstract
  prepareMenu() {
    throw new Error("Method 'prepareMenu' must be implimented.");
  }

  async fetchItemListFromRepoAndPrepareMenu() {
    const response = await curlRequest(this.sourceRepoUrl, {
      parseJson: true,
    })
      .catch((error) => {
        print("Failed to fetch list of theme extension scripts.", error);
      });

    await this.prepareMenu(response);
  }

  async downloadItemInDestinationDir() {
    if (!this.downloadItemList) {
      this.#cleanUp();
      return;
    }
    const itemsToDownload = this.downloadItemMenu
      .filter((script) => this.downloadItemList.includes(script.tmpFile));
    print("Downloading...");

    const promises = [];
    for (const item of itemsToDownload) {
      print(item.name);
      promises.push(
        curlRequest(item.download_url, {
          outputFile: this.destinationDir.concat("/", item.name),
        })
          .catch((e) => {
            print("Failed to download script ", item.name, "\n", e);
          }),
      );
    }
    this.#cleanUp();
    await Promise.all(promises);
    print("Scripts downloaded.");
  }

  #cleanUp() {
    const tempItemPaths = this.downloadItemMenu.map((script) => script.tmpFile)
      .join("\n");
    tempItemPaths.split("\n")
      .forEach((path) => os.remove(path));
  }
}
