class Utils {
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
        "critical",
      );
      return 4;
    }
  }

  /**
   * @method promiseQueueWithLimit
   * @description Executes an array of promise-returning functions with a concurrency limit
   * @param {Function[]} tasks - Array of functions that return promises
   * @returns {Promise<void>}
   */
  async promiseQueueWithLimit(tasks) {
    this.pLimit = (this.pLimit || USER_ARGUMENTS.pLimit) ??
      await this.processLimit();
    const executing = new Set();
    for (const task of tasks) {
      const promise = task().finally(() => executing.delete(promise));
      executing.add(promise);
      if (executing.size >= this.pLimit) await Promise.race(executing);
    }
    await Promise.all(executing);
  }

  /**
   * @method notify
   * @description Sends a desktop notification or prints to console based on urgency and notification settings
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {'normal' | "critical" | 'low' } [urgency='normal'] - The urgency level of the notification ('low', 'normal' or 'critical' )
   * @returns {Promise<void>}
   */
  async notify(title, message, urgency = "normal") {
    const validUrgencies = ["low", "normal", "critical"];

    if (USER_ARGUMENTS.disableNotification) return;

    const command = `notify-send -u ${
      validUrgencies.includes(urgency) ? urgency : validUrgencies[1]
    } "${title}" "${message}"`;

    try {
      await execAsync(command);
    } catch (e) {
      throw new SystemError("Failed to send notification.", e);
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
      throw TypeError("File content to wrtie must be string.");
    }
    const fileHandler = STD.open(path, "w+");
    fileHandler.puts(content);
    fileHandler.close();
  }
}

export default new Utils();
