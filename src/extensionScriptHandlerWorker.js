import * as _ from "./globalConstants.js";

const parent = OS.Worker.parent;

/**
 * @param {Object} data
 * @param {string} data.scriptPath - Path to the script to be imported.
 * @param {string[]} data.functionNames - Name of the functions to be imported from the imported script.
 * @param {any[]} data.args - Arguments for the functions from the imported script.
 */
const startWork = async (data) => {
  await catchAsyncError(async () => {
    const { scriptPath, functionNames, args } = data;
    const exports = await import(scriptPath);
    const results = [];
    for (const functionName of functionNames) {
      const cb = exports?.[functionName];
      if (!cb) {
        parent.postMessage({
          type: "systemError",
          data: (
            "Error in " + scriptPath + ";" +
            "No function named " + functionName + " found."
          ),
        });
        break;
      }
      try {
        const result = await cb(...args);
        results.push(result);
      } catch (error) {
        error instanceof SystemError
          ? parent.postMessage({
            type: "systemError",
            data: [
              error.name,
              error.description,
              JSON.stringify(error.body ?? ""),
            ],
          })
          : parent.postMessage({
            type: "error",
            data: [
              scriptPath,
              JSON.stringify(error),
            ],
          });
      }
    }

    parent.postMessage({ type: "success", data: results });
  }, "startWork");
};

parent.onmessage = async (e) => {
  await catchAsyncError(async () => {
    const ev = e.data;
    switch (ev.type) {
      case "start":
        await startWork(ev.data);
        break;
      case "abort":
        parent.onmessage = null;
    }
  }, "Worker :: onmessage");
};
