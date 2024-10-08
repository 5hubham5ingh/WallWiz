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
    this.apiCache = this.apiCacheFile ? std.parseExtJSON(this.apiCacheFile) : [];
  }

  static GITHUB_API_KEY;

  async fetch(url, headers) {

    const upsertCache = (updatedData) => {
      const writeCache = () =>
        utils.writeFile(JSON.stringify(this.apiCache), this.apiCacheFilePath);

      for (let cache of this.apiCache) {
        if (cache.url === updatedData.url) {
          cache = updatedData;
          writeCache();
          return
        }
      }

      this.apiCache.push(updatedData);
      writeCache();
    }

    const currentCache = this.apiCache.find((cache) =>
      cache.url === url
    ) ?? { url };

    const curl = new Curl(url, {
      parseJson: true,
      headers: {
        "if-none-match": currentCache?.etag,
        Authorization: Download.GITHUB_API_KEY ? `token ${Download.GITHUB_API_KEY}` : null,
        ...headers
      },
    });

    await curl.run()
      .catch((error) => {
        utils.notify("Failed to fetch list of theme extension scripts.", error, "error");
      });

    if (curl.statusCode === 304) {
      return currentCache.data;
    }

    if (curl.failed) utils.notify("Error:", curl.error, 'error');

    currentCache.etag = curl.headers.etag;
    currentCache.data = curl.body;
    upsertCache(currentCache);
    return curl.body;

  }


  async fetchItemListFromRepo() {
    const responses = await Promise.all(
      this.sourceRepoUrls.map(this.fetch.bind(this)),
    );

    return responses.reduce((acc, itemList) => {
      Array.prototype.push.apply(acc, itemList)
      return acc;
    }, []);
  }


  async downloadItemInDestinationDir(itemList = this.downloadItemList, destinationDir = this.destinationDir) {
    const fileListForCurl = [];

    for (const item of itemList) {
      print('- ', item.name);
      fileListForCurl.push([
        item.downloadUrl,
        destinationDir.concat("/", item.name),
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
      utils.notify("Invalid GitHub URL format.", gitHubUrl, 'error')
    }

    const [_, owner, repo, branch, , directoryPath] = match;

    // Construct the GitHub API URL
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${directoryPath || ""
      }?ref=${branch}`;

    return apiUrl;
  }
}
