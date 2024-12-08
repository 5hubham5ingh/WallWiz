/**
 * @description - Promisify the extensionScriptHandlerWorker.
 * @param {Object} data - The data to be passed to the worker.
 * @param {string} data.scriptPath - Path to the script to be imported.
 * @param {string[]} data.functionNames - Name of the function to be imported from the imported script.
 * @param {any[]} data.args - Arguments for the function from the imported script.
 * @returns {Promise<any>} A promise that resolves with the result or rejects with error from the worker script.
 */
export default async function extensionHandler(data) {
  return await catchAsyncError(async () => {
    if (USER_ARGUMENTS.processLimit == 1) {
      return await handleExtensionPromise(data);
    }

    return await handleExtensionThread(data);
  }, "workerPromise");
}

async function handleExtensionPromise(data) {
  return await catchAsyncError(async () => {
    const { scriptPath, functionNames, args } = data;
    const exports = await import(scriptPath);
    const results = [];

    for (const functionName of functionNames) {
      const cb = exports?.[functionName];
      if (!cb) {
        throw SystemError(
          "Error in " + scriptPath,
          "No function named " + functionName + " found.",
        );
      }
      try {
        const result = await cb(...args);
        results.push(result);
      } catch (status) {
        if (status === EXIT) continue;

        throw status;
      }
    }

    return results;
  }, "handleExtensionPromise");
}

async function handleExtensionThread(data) {
  return await catchAsyncError(async () => {
    return await new Promise((resolve, reject) => {
      // When process limit is set greater than one.
      const worker = new OS.Worker(
        "./extensionScriptHandlerWorker.js",
      );
      const abortWorker = () => {
        worker.postMessage({ type: "abort" });
        worker.onmessage = null;
      };

      worker.postMessage({ type: "start", data: data });

      worker.onmessage = (e) => {
        const ev = e.data;
        switch (ev.type) {
          case "success":
            abortWorker();
            resolve(ev.data);
            break;
          case "error": {
            abortWorker();
            const [fileName, cause] = ev.data;
            reject(
              new Error(
                `Error in "${fileName}"`,
                { body: cause },
              ),
            );
            break;
          }
          case "systemError": {
            abortWorker();
            const [name, description, body] = ev.data;
            reject(
              new SystemError(
                name,
                description,
                JSON.parse(body),
              ),
            );
          }
        }
      };
    });
  }, "handleExtensionThread");
}
