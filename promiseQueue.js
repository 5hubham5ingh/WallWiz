import config from "./config.js";

class Queue {
  constructor() {
    this.concurrency = config.processLimit;
    this.active = 0;
    this.size = 0;
    this.head = null;
    this.tail = null;
    this.resolveDonePromise = null;
    this.donePromise = null;
  }

  /**
   * Callback after a task is run to reduce active count and run the next task if available.
   */
  afterRun() {
    this.active--;
    if (--this.size) {
      this.run();
    } else if (this.resolveDonePromise) {
      this.donePromise = this.resolveDonePromise();
    }
  }

  /**
   * Executes the next task in the queue if concurrency limit allows.
   */
  run() {
    if (this.head && this.active < this.concurrency) {
      this.active++;
      const curHead = this.head;
      this.head = this.head.next;
      curHead.task()
        .then((result) => {
          curHead.resolve(result);
          this.afterRun();
        })
        .catch((error) => {
          curHead.reject(error);
          this.afterRun();
        });
    }
  }

  /**
   * Adds a new task to the queue.
   *
   * @param {() => Promise<any>} task - A function that returns a Promise.
   * @returns {Promise<any>} A promise that resolves or rejects when the task completes.
   */
  add(task) {
    const node = { task, next: null };
    const promise = new Promise((resolve, reject) => {
      node.resolve = resolve;
      node.reject = reject;
    });

    if (this.head) {
      this.tail.next = node;
    } else {
      this.head = node;
    }
    this.tail = node;

    this.size++;
    this.run();
    return promise;
  }

  /**
   * Returns a promise that resolves when all tasks in the queue are complete.
   *
   * @returns {Promise<void>} A promise that resolves when the queue is done.
   */
  done() {
    if (!this.size) {
      return Promise.resolve();
    }
    if (this.donePromise) {
      return this.donePromise;
    }
    return (this.donePromise = new Promise((resolve) => {
      this.resolveDonePromise = resolve;
    }));
  }

  /**
   * Clears the queue by resetting the head, tail, and size.
   */
  clear() {
    this.head = this.tail = null;
    this.size = this.active;
  }

  /**
   * Returns the current number of active tasks.
   *
   * @returns {number} The number of active tasks.
   */
  activeCount() {
    return this.active;
  }

  /**
   * Returns the current size of the queue.
   *
   * @returns {number} The number of tasks in the queue.
   */
  sizeCount() {
    return this.size;
  }
}

export default Queue;
