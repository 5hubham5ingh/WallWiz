/**
 * @description - Promisify the extensionScriptHandlerWorker.
 * @param {Object} data - The data to be passed to the worker.
 * @param {string} data.scriptPath - Path to the script to be imported.
 * @param {string} data.functionName - Name of the function to be imported from the imported script.
 * @param {any[]} data.args - Arguments for the function from the imported script.
 * @returns {Promise<any>} A promise that resolves with the result or rejects with error from the worker script.
 */
export default async function workerPromise(data) {
  return await catchAsyncError(async () => {
    return await new Promise((resolve, reject) => {
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

            reject(
              new SystemError(
                ...ev.data.split(";"),
              ),
            );
            break;
          }
        }
      };
    });
  }, "workerPromise");
}
