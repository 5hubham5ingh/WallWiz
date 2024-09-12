import { curlRequest } from "../justjs/src/curl.js";
import { wait } from "../justjs/src/timers.js";
import Queue from "./promiseQueue.js";

// Create a queue with concurrency of 3, meaning only 3 fetch requests will run simultaneously
const queue = new Queue(3);

// Example URLs for fetching data
const urls = [
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/posts/2',
  'https://jsonplaceholder.typicode.com/posts/3',
  'https://jsonplaceholder.typicode.com/posts/4',
  'https://jsonplaceholder.typicode.com/posts/5'
];

// Function to create a fetch task
const createFetchTask = (url) => () => curlRequest(url)
  .then(response => response.json())
  .then(data => {
    console.log(`Data fetched from ${url}`, data);
    return data;  // Return data to the queue
  })
  .catch(err => {
    console.error(`Error fetching from ${url}`, err);
  });

// Add all fetch tasks to the queue
urls.forEach(url => {
  queue.add(createFetchTask(url));
});

// Wait until all fetch operations are done
queue.done().then(() => {
  console.log('All fetch operations completed');
});

