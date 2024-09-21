import { exec as execAsync } from "../justjs/src/process.js"

const processLimit = await execAsync(["nproc"])
  .then((threads) => parseInt(threads, 10))
  .catch((e) => {
    print("Failed to get process limit. \nUsing default value of 4.", e);
    return 4;
  });

async function promiseQueueWithLimit(tasks, concurrencyLimit = processLimit) {
  const results = [];
  const executing = new Set();

  for (let i = 0; i < tasks.length; i++) {
    const taskPromise = tasks[i]().then((result) => (results[i] = result));
    executing.add(taskPromise);

    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }

    taskPromise.finally(() => executing.delete(taskPromise));
  }

  await Promise.all(executing);
  return results;
}

/**
 * Sends a desktop notification using the notify-send command.
 * 
 * @param {string} title - The title of the notification.
 * @param {string} message - The body message of the notification.
 */
async function notify(title, message) {
  let command = `notify-send "${title}" "${message}"`;
  const handleError = (e) => print('Failed to send notification. \nStderr', e, '\n\n\nNotification:\n', title, '\n', message);
  return execAsync(command).catch(handleError)
}

// Example usage
// await notify("Test Notification", "This is the notification body.")

function writeFile(content, path) {
  if (typeof content !== "string") return;
  const fileHandler = std.open(path, "w+");
  fileHandler.puts(content);
  fileHandler.close();
}

export { notify, writeFile, promiseQueueWithLimit };
