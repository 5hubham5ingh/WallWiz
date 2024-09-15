async function promiseQueueWithLimit(tasks, concurrencyLimit) {
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
