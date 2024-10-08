import { Curl, curlRequest } from "../justjs/src/curl.js";
import { ensureDir } from "../justjs/src/fs.js";
import { exec as execAsync } from "../justjs/src/process.js";
import { HOME_DIR } from "./constant.js";
import utils from "./utils.js"
import * as std from "std"
/**
 * @typedef {import('./types.ts').IStd} IStd
 */


/**
* @type {IStd}
 */
const std = std;

export default class Download {
  constructor(sourceRepoUrls, destinationDir) {
    this.destinationDir = destinationDir;
    this.sourceRepoUrls = sourceRepoUrls.map((url) =>
      Download.ensureGitHubApiUrl(url)
    );
    this.downloadItemList;
    ensureDir(this.destinationDir);
    this.apiCacheFilePath = HOME_DIR.concat("/.cache/WallWiz/apiCache.json");
    this.apiCacheFile = std.loadFile(this.apiCacheFilePath);
    this.apiCache = this.apiCacheFile ? std.parseExtJSON(this.apiCacheFile) ?? [] : [];
  }

  async fetchItemListFromRepo() {

    const upsertCache = (updatedData) => {
      let updated = false;
      this.apiCache.forEach((cache) => {
        if (cache.url === updatedData.url) {
          cache = updatedData;
          updated = true;
        }
      });
      if (!updated)
        this.apiCache.push(updatedData);
      utils.writeFile(JSON.stringify(this.apiCache), this.apiCacheFilePath);
    }

    const responses = await Promise.all(
      this.sourceRepoUrls.map(async (sourceRepoUrl) => {
        const currentCache = this.apiCache.find((cache) =>
          cache.url === sourceRepoUrl
        ) ?? { url: sourceRepoUrl };

        const curl = new Curl(sourceRepoUrl, {
          parseJson: true,
          headers: {
            "if-none-match": currentCache?.etag,
          },
        });

        await curl.run()
          .catch((error) => {
            utils.notify("Failed to fetch list of theme extension scripts.", error, "error");
          });

        if (curl.statusCode !== 304 && !curl.failed) {
          currentCache.etag = curl.headers.etag;
          currentCache.data = curl.body;
          upsertCache(currentCache);
          return curl.body;
        }
        return currentCache.data;
      }),
    );
    return responses.reduce((acc, itemList) => {
      Array.prototype.push.apply(acc, itemList);
      return acc;
    }, []);
  }


  async downloadItemInDestinationDir() {
    if (!this.downloadItemList) {
      utils.notify("No item selected.", "Select atleast one item.", "error");
      return;
    }

    const fileListForCurl = [];

    for (const item of this.downloadItemList) {
      print(item.name);
      fileListForCurl.push([
        item.downloadUrl,
        this.destinationDir.concat("/", item.name),
      ]);
    }
    await execAsync(Download.generateCurlParallelCommand(fileListForCurl))
      .catch((e) => utils.notify("Download failed:", e, "error"));
  }

  static generateCurlParallelCommand(fileList) {
    let curlCommand = "curl --parallel --parallel-immediate";

    fileList.forEach(([sourceUrl, destPath]) => {
      const escapedSourceUrl = sourceUrl.replace(/(["\s'$`\\])/g, "\\$1");
      const escapedDestPath = destPath.replace(/(["\s'$`\\])/g, "\\$1");

      curlCommand += ` -o "${escapedDestPath}" "${escapedSourceUrl}"`;
    });

    return curlCommand;
  }

  static ensureGitHubApiUrl(gitHubUrl) {
    // Check if the URL is already a GitHub API URL
    const apiUrlRegex =
      /^https:\/\/api\.github\.com\/repos\/([^\/]+)\/([^\/]+)\/contents\/(.+)(\?ref=.+)?$/;
    if (apiUrlRegex.test(gitHubUrl)) {
      return gitHubUrl; // It's already a GitHub API URL
    }

    // Ensure the input is a valid GitHub URL
    const githubRegex =
      /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)(\/(.+))?/;
    const match = gitHubUrl.match(githubRegex);

    if (!match) {
      throw new Error("Invalid GitHub URL format. " + gitHubUrl);
    }

    const [_, owner, repo, branch, , directoryPath] = match;

    // Construct the GitHub API URL
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${directoryPath || ""
      }?ref=${branch}`;

    return apiUrl;
  }
}
