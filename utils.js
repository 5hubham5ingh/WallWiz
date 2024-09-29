import { exec as execAsync } from "../justjs/src/process.js";
import { std } from "./quickJs.js";

const processLimit = await execAsync(["nproc"])
  .then((threads) => parseInt(threads, 10))
  .catch((e) => {
    print("Failed to get process limit. \nUsing default value of 4.", e);
    return 4;
  });

async function promiseQueueWithLimit(tasks, concurrencyLimit = processLimit) {
  const executing = new Set();

  for (const task of tasks) {
    const promise = task().finally(() => executing.delete(promise));
    executing.add(promise);
    if (executing.size >= concurrencyLimit) await Promise.race(executing);
  }

  await Promise.all(executing);
}

async function notify(title, message, urgency = "normal") {
  const command = `notify-send -u ${urgency} "${title}" "${message}"`;
  const handleError = (e) =>
    print(
      "Failed to send notification. \nStderr",
      e,
      "\n\n\nNotification:\n",
      title,
      "\n",
      message,
    );
  return execAsync(command).catch(handleError);
}

// Example usage
// await notify("Test Notification", "This is the notification body.");

function writeFile(content, path) {
  if (typeof content !== "string") return;
  const fileHandler = std.open(path, "w+");
  fileHandler.puts(content);
  fileHandler.close();
}

export { notify, promiseQueueWithLimit, writeFile };
