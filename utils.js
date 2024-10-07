/**
 * @file Utils.js
 * @description Utility class for process management, notifications, and file operations
 */
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import { exec as execAsync } from "../justjs/src/process.js";
import QJS from "./quickJs.js";

/**
 * @typedef {import('./types.ts').IStd} IStd
 */

/**
* @type {{ std: IStd }}
 */
const { std } = QJS;

class Utils {
  /**
   * @type {number} [pLimit=4] - Default process limit.
   */
  static pLimit;

  /**
   * @type {boolean} [enableNotification=true] - Default notification setting.
   */
  static enableNotification;

  /**
   * @method processLimit
   * @description Determines the number of available CPU threads
   * @returns {Promise<number>} The number of CPU threads or the default pLimit if unable to determine
   */
  async processLimit() {
    try {
      const threads = await execAsync("nproc");
      return parseInt(threads, 10);
    } catch (e) {
      this.notify(
        "Failed to get process limit. Using default value = 4",
        e,
        "low",
      );
      return 4;
    }
  }

  /**
   * @method promiseQueueWithLimit
   * @description Executes an array of promise-returning functions with a concurrency limit
   * @param {Function[]} tasks - Array of functions that return promises
   * @param {number} [limit] - Maximum number of promises to execute simultaneously
   * @returns {Promise<void>}
   */
  async promiseQueueWithLimit(tasks) {
    Utils.pLimit = Utils.pLimit ?? await this.processLimit();
    const executing = new Set();
    for (const task of tasks) {
      const promise = task().finally(() => executing.delete(promise));
      executing.add(promise);
      if (executing.size >= Utils.pLimit) await Promise.race(executing);
    }
    await Promise.all(executing);
  }

  /**
   * @method notify
   * @description Sends a desktop notification or prints to console based on urgency and notification settings
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} [urgency='normal'] - The urgency level of the notification ('low', 'normal', 'critical', or 'error')
   * @returns {Promise<void>}
   */
  async notify(title, message, urgency = "normal") {
    const validUrgencies = ["low", "normal", "critical"];
    const notifyError = (source = title, error = message) => {
      print(
        "\n",
        ansi.styles(["bold", "red"]),
        source,
        ":",
        ansi.style.reset,
        "\n",
        ansi.style.red,
        error,
        ansi.style.reset,
        "\n",
      );
      std.exit(1);
    };

    if (urgency === "error") {
      notifyError();
    }

    if (!Utils.enableNotification) return;

    const command = `notify-send -u ${validUrgencies.includes(urgency) ? urgency : validUrgencies[1]
      } "${title}" "${message}"`;

    try {
      await execAsync(command);
    } catch (e) {
      notifyError("Failed to send notification.", e);
    }
  }

  /**
   * @method writeFile
   * @description Writes content to a file
   * @param {string} content - The content to write to the file
   * @param {string} path - The path of the file to write to
   */
  writeFile(content, path) {
    if (typeof content !== "string") {
      print("Error: Content must be a string");
      return;
    }
    try {
      const fileHandler = std.open(path, "w+");
      fileHandler.puts(content);
      fileHandler.close();
    } catch (e) {
      print(`Error writing to file ${path}:`, e);
    }
  }
}

export default new Utils();
