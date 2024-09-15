import { curlRequest } from "../justjs/src/curl.js";
import { ensureDir } from "../justjs/src/fs.js";
import { exec as execAsync } from "../justjs/src/process.js";

export default class Download {
  constructor(sourceRepoUrl, destinationDir) {
    this.destinationDir = destinationDir;
    this.sourceRepoUrl = Download.ensureGitHubApiUrl(sourceRepoUrl);
    this.downloadItemList;
    ensureDir(this.destinationDir);
  }

  async fetchItemListFromRepo() {
    const response = await curlRequest(this.sourceRepoUrl, {
      parseJson: true,
    })
      .catch((error) => {
        print("Failed to fetch list of theme extension scripts.", error);
      });

    return response;
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
