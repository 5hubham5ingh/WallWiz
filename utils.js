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

export { promiseQueueWithLimit };
