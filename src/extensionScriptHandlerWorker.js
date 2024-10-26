import * as _ from "./globalConstants.js";

const parent = OS.Worker.parent;

/**
 * @param {Object} data
 * @param {string} data.scriptPath - Path to the script to be imported.
 * @param {string} data.functionName - Name of the function to be imported from the imported script.
 * @param {any[]} data.args - Arguments for the function from the imported script.
 */
const startWork = async (data) => {
  await catchAsyncError(async () => {
    const { scriptPath, functionName, args } = data;
    const exports = await import(scriptPath);
    const cb = exports?.[functionName];
    if (!cb) {
      parent.postMessage({
        type: "error",
        data: (
          "Error in " + scriptPath + ";" +
          "No function named " + functionName + " found."
        ),
      });
      return;
    }
    try {
      const result = await cb(...args);
      parent.postMessage({ type: "success", data: result });
    } catch (error) {
      parent.postMessage({
        type: "error",
        data: (
          error instanceof SystemError
            ? error.error + ";" + error.description + ": " +
              JSON.stringify(error.body)
            : "Error in " + scriptPath + ";" + error.name + ": " +
              error.message
        ),
      });
    }
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
