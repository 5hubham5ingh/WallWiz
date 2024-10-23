"use strip";

import { ansi } from "../../justjs/src/just-js/helpers/ansiStyle.js";

class Utils {
  /**
   * @method processLimit
   * @description Determines the number of available CPU threads
   * @returns {Promise<number>} The number of CPU threads or the default pLimit if unable to determine
   */
  async processLimit() {
    return await catchAsyncError(async () => {
      try {
        const threads = await execAsync("nproc");
        return parseInt(threads, 10);
      } catch (e) {
        this.notify(
          "Failed to get process limit. Using default value = 4",
          e,
          "critical",
        );
        return 4;
      }
    }, "processLimit");
  }

  /**
   * @method promiseQueueWithLimit
   * @description Executes an array of promise-returning functions with a concurrency limit.
   * @param {Function[]} tasks - Array of functions that, well called, return a promise.
   * @returns {Promise<void>}
   */
  async promiseQueueWithLimit(tasks) {
    return await catchAsyncError(async () => {
      this.pLimit = (this.pLimit || USER_ARGUMENTS.pLimit) ??
        await this.processLimit();
      const executing = new Set();
      for (const task of tasks) {
        const promise = task().finally(() => executing.delete(promise));
        executing.add(promise);
        if (executing.size >= this.pLimit) {
          await Promise.race(executing);
        }
      }
      return await Promise.all(executing);
    }, "promiseQueueWithLimit");
  }

  /**
   * @method notify
   * @description Sends a desktop notification or prints to console based on urgency and notification settings
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {'normal' | "critical" | 'low' } urgency - default='normal' - The urgency level of the notification ('low', 'normal' or 'critical' )
   * @returns {Promise<void>}
   */
  async notify(title, message, urgency = "normal") {
    await catchAsyncError(async () => {
      const validUrgencies = ["low", "normal", "critical"];

      if (USER_ARGUMENTS.disableNotification) return;

      const command = [
        "notify-send",
        "-u",
        validUrgencies.includes(urgency) ? urgency : validUrgencies[1],
        title,
        message,
      ];

      await execAsync(command)
        .catch((error) => {
          throw new SystemError("Failed to send notification.", error);
        });
    }, "notify");
  }

  /**
   * @method writeFile
   * @description Writes content to a file
   * @param {string} content - The content to write to the file
   * @param {string} path - The path of the file to write to
   */
  writeFile(content, path) {
    catchError(() => {
      if (typeof content !== "string") {
        throw TypeError("File content to wrtie must be string.");
      }
      const fileHandler = STD.open(path, "w+");
      fileHandler.puts(content);
      fileHandler.close();
    }, "writeFile");
  }

  /**
  * @param {string} dir - directory path
  */
  ensureDir(dir){

  }

  log(message) {
    catchError(() => {
      const fmtMsg = message.split(";")
        .map((line) => ` ${ansi.style.brightGreen}◉ ${line}${ansi.style.reset}`)
        .join("\n");

      print(fmtMsg);
    }, "log");
  }
}

export default new Utils();
