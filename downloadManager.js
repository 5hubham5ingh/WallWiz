import { Curl, curlRequest } from "../justjs/src/curl.js";
import { ensureDir } from "../justjs/src/fs.js";
import { exec as execAsync } from "../justjs/src/process.js";
import { HOME_DIR } from "./constant.js";
import utils from "./utils.js";
import * as std from 'std'
/**
 * @typedef {import('./types.ts').IStd} IStd
 */


/**
 * Parsed command-line arguments.
* @type {IStd}
 */
const std = std;

export default class Download {
  constructor(sourceRepoUrl, destinationDir) {
    this.destinationDir = destinationDir;
    this.sourceRepoUrl = Download.ensureGitHubApiUrl(sourceRepoUrl);
    this.downloadItemList;
    this.apiCacheDir = HOME_DIR.concat(
      "/.cache/WallWiz/api/",
    );
    this.apiCacheFilePath = this.apiCacheDir.concat("apiCache.json");
    this.apiCacheFile = std.loadFile(this.apiCacheFilePath);
    this.apiCache = this.apiCacheFile
      ? std.parseExtJSON(this.apiCacheFile)
      : null;

    ensureDir(this.destinationDir);
    ensureDir(this.apiCacheDir);
  }

  async fetchItemListFromRepo() {
    let currentCache;
    if (this.apiCache) {
      currentCache = this.apiCache.find((cache) =>
        cache.url === this.sourceRepoUrl
      );
    } else {
      // initialise api cache
      this.apiCache = [{ url: this.sourceRepoUrl }];
    }

    const curl = new Curl(this.sourceRepoUrl, {
      parseJson: true,
      headers: {
        etag: currentCache?.etag,
      },
    });

    await curl.run()
      .catch((error) => {
        print("Failed to fetch list of theme extension scripts.", error);
      });

    print(curl.headers.etag)
    if (curl.statusCode !== 304 && !curl.failed) {
      currentCache.etag = curl.headers.etag;
      currentCache.data = curl.body;
      this.updateCache(currentCache);
      return curl.body;
    }

    if (!currentCache) {
      currentCache = {
        url: this.sourceRepoUrl,
        etag: curl.headers.etag,
        data: curl.body,
      };
      this.updateCache(currentCache);
      return currentCache.data;
    }
    throw new Error("Something went wrong.");
  }

  updateCache(updatedData) {
    this.apiCache.forEach((cache) => {
      if (cache.url === updatedData.url) {
        cache = updatedData;
      }
    });
    utils.writeFile(JSON.stringify(this.apiCache), this.apiCacheDir);
  }

  async downloadItemInDestinationDir() {
    if (!this.downloadItemList) {
      print("No item selected.");
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

    print("Downloading...");

    await execAsync(Download.generateCurlParallelCommand(fileListForCurl))
      .catch((e) => print("Download failed:", e));

    print("Items downloaded:", fileListForCurl.length);
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
      /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/;
    const match = gitHubUrl.match(githubRegex);

    if (!match) {
      throw new Error("Invalid GitHub URL format.");
    }

    const [_, owner, repo, branch, directoryPath] = match;

    // Construct the GitHub API URL
    const apiUrl =
      `https://api.github.com/repos/${owner}/${repo}/contents/${directoryPath}?ref=${branch}`;

    return apiUrl;
  }
}
