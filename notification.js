import { exec as execAsync } from '../justjs/src/process.js'

/**
 * Sends a desktop notification using the notify-send command.
 * 
 * @param {string} title - The title of the notification.
 * @param {string} message - The body message of the notification.
 */
function notify(title, message) {
  let command = `notify-send "${title}" "${message}"`;
  return execAsync(command)
    .catch(e => print('Failed to send notification. \nStderr', e, '\n\n\nNotification:\n', title, '\n', message))
}

// Example usage
await notify("Test Notification", "This is the notification body.")

export { notify }

