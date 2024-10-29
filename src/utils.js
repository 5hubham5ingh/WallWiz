import { ansi } from "../../justjs/ansiStyle.js";

"use strip";
class Utils {
  constructor() {
    return Utils.createProxyWithErrorHandling(this);
  }
  /**
   * @method processLimit
   * @description Determines the number of available CPU threads
   * @returns {Promise<number>} The number of CPU threads or the default pLimit if unable to determine
   */
  async processLimit() {
    try {
      const threads = await execAsync("nproc");
      return parseInt(threads, 10) - 1; // Number of available threads minus parent thread
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
   * @description Executes an array of promise-returning functions with a concurrency limit.
   * @param {Function[]} getTaskPromises - Array of functions that, when called, return a promise.
   * @returns {Promise<void>}
   */
  async promiseQueueWithLimit(getTaskPromises) {
    this.pLimit = (this.pLimit || USER_ARGUMENTS.pLimit) ??
      await this.processLimit();
    const executing = new Set();
    for (const getTaskPromise of getTaskPromises) {
      const promise = getTaskPromise().finally(() => executing.delete(promise));
      executing.add(promise);
      if (executing.size == this.pLimit) {
        await Promise.race(executing);
      }
    }
    return await Promise.all(executing);
  }

  /**
   * @method notify
   * @description Send a desktop notification.
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {'normal' | 'critical' | 'low' } urgency - The urgency level of the notification (default='normal')
   * @returns {Promise<void>}
   */
  async notify(title, message = "", urgency = "normal") {
    if (USER_ARGUMENTS.disableNotification) return;

    const command = [
      "notify-send",
      "-u",
      urgency,
      title,
      message,
    ];
    await execAsync(command)
      .catch((error) => {
        throw new SystemError("Failed to send notification.", error);
      });
  }

  /**
   * @method writeFile
   * @description Writes content to a file
   * @param {string} content - The content to write to the file
   * @param {string} path - The path of the file to write to
   */
  writeFile(content, path) {
    if (typeof content !== "string") {
      throw TypeError("File content to wrtie must be of type string.");
    }
    const errObj = {};
    let fileHandler = STD.open(path, "w+", errObj);
    if (errObj.errno === 2) {
      this.ensureDir(
        path.split("/")
          .map((dir, depth, step, end = step.length) =>
            depth === (end - 1) ? "" : dir
          )
          .join("/"),
      );
      fileHandler = STD.open(path, "w+", errObj);
    }
    if (!fileHandler) {
      throw Error(
        "Failed to open file: " + path + "\nError code: " + `${errObj.errno}`,
      );
    }
    fileHandler.puts(content);
    fileHandler.close();
  }

  /**
   * @param {string} dir - directory path
   */
  ensureDir(dir) {
    if (typeof dir !== "string") throw new TypeError("Invalid directory type.");
    let directory;
    switch (dir[0]) {
      case "~":
        directory = HOME_DIR.concat(dir.slice(1));
        break;
      case "/":
        directory = dir;
        break;
      default: {
        const path = OS.realpath(dir);
        if (path[1] !== 0) throw new Error("Failed to read directory");
        directory = path[0];
      }
    }

    directory.split("/").forEach((dir, i, path) => {
      if (!dir) return;
      const currPath = path.filter((_, j) => j <= i).join("/");
      const dirStat = OS.stat(currPath)[0];
      if (!dirStat) OS.mkdir(currPath);
    });
  }

  log(message) {
    const fmtMsg = message.split(";")
      .map((line) => ` ${ansi.style.brightGreen}◉ ${line}${ansi.style.reset}`)
      .join("\n");

    print(fmtMsg);
  }

  static createProxyWithErrorHandling(TargetClass) {
    return new Proxy(TargetClass, {
      construct(target, args) {
        const instance = new target(...args);
        return new Proxy(instance, {
          get(obj, prop) {
            const originalMethod = obj[prop];
            if (typeof originalMethod === "function") {
              return function (...methodArgs) {
                // Check if the original method is async
                const isAsync =
                  originalMethod.constructor.name === "AsyncFunction";

                if (isAsync) {
                  return originalMethod.apply(obj, methodArgs).catch(
                    (error) => {
                      const methodName = prop.toString();
                      const updatedError = new Error(
                        `Error in ${target.name}::${methodName}: ${error.message}`,
                      );
                      updatedError.stack =
                        `${updatedError.stack}\nCaused by: ${error.stack}`;
                      throw updatedError;
                    },
                  );
                } else {
                  try {
                    return originalMethod.apply(obj, methodArgs);
                  } catch (error) {
                    const methodName = prop.toString();
                    const updatedError = new Error(
                      `Error in ${target.name}::${methodName}: ${error.message}`,
                    );
                    updatedError.stack =
                      `${updatedError.stack}\nCaused by: ${error.stack}`;
                    throw updatedError;
                  }
                }
              };
            }
            return originalMethod;
          },
        });
      },
    });
  }
}

export default new Utils();
