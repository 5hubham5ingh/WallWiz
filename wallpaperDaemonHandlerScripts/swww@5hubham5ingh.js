
/**
 * Command-line arguments for the swww image display command.
 * @constant {string} SWWW_COMMAND - The base command for swww.
 */
const SWWW_COMMAND = './swww';

/**
 * Options for the swww image display command.
 * @constant {Object} SWWW_OPTIONS
 * @property {string} [outputs] - Comma-separated list of outputs to display the image at (e.g., "0,1").
 * @property {boolean} [noResize] - If true, do not resize the image.
 * @property {'no' | 'crop' | 'fit'} [resize] - Resize method (default='crop').
 * @property {string} [fillColor] - Fill color for padding when the output image does not fill the screen (default='000000').
 * @property {'Nearest' | 'Bilinear' | 'CatmullRom' | 'Mitchell' | 'Lanczos3'} [filter] - Filter to use when scaling images (default='Lanczos3').
 * @property {'none' | 'simple' | 'fade' | 'left' | 'right' | 'top' | 'bottom' | 'wipe' | 'wave' | 'grow' | 'center' | 'any' | 'outer' | 'random'} [transitionType] - Type of transition (default='simple').
 * @property {number} [transitionStep] - Speed of transition (default=2 for 'simple', 90 otherwise).
 * @property {number} [transitionDuration] - Duration of transition in seconds (default=3).
 * @property {number} [transitionFps] - Frame rate for transition effect (default=30).
 * @property {number} [transitionAngle] - Angle for "wipe" and "wave" transitions (in degrees, default=45).
 * @property {'center' | 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | `${number},${number}` } [transitionPos] - Center position for "grow" and "outer" transitions. Can be percentage or pixel values (default='center').
 */
const SWWW_OPTIONS = {};

/**
 * Generates the swww command to display an image with specified options.
 * 
 * @param {string} imagePath - The path of the image or hexcode (starting with 0x) to display.
 * @param {Object} [options=SWWW_OPTIONS] - Options for the command.
 * @returns {string[]} An array representing the swww command and its arguments.
 */
function createSwwwCommand(imagePath, options = SWWW_OPTIONS) {
    const command = [SWWW_COMMAND, 'img', imagePath];

    // Adding options to the command
    if (options.outputs) {
        command.push('--outputs', options.outputs);
    }
    if (options.noResize) {
        command.push('--no-resize');
    }
    if (options.resize) {
        command.push('--resize', options.resize);
    }
    if (options.fillColor) {
        command.push('--fill-color', options.fillColor);
    }
    if (options.filter) {
        command.push('-f', options.filter);
    }
    if (options.transitionType) {
        command.push('--transition-type', options.transitionType);
    }
    if (options.transitionStep !== undefined) {
        command.push('--transition-step', options.transitionStep);
    }
    if (options.transitionDuration !== undefined) {
        command.push('--transition-duration', options.transitionDuration);
    }
    if (options.transitionFps !== undefined) {
        command.push('--transition-fps', options.transitionFps);
    }
    if (options.transitionAngle !== undefined) {
        command.push('--transition-angle', options.transitionAngle);
    }
    if (options.transitionPos) {
        command.push('--transition-pos', options.transitionPos);
    }

    return command;
}

// Example usage
const command = createSwwwCommand('path/to/image.png', {
    outputs: '0,1',
    noResize: true,
    resize: 'fit',
    fillColor: 'FFFFFF',
    filter: 'Lanczos3',
    transitionType: 'fade',
    transitionStep: 90,
    transitionDuration: 3,
    transitionFps: 30,
    transitionAngle: 45,
    transitionPos: 'center'
});

console.log(command);


/**
 * Command-line arguments for the swww image display command.
 * @constant {string} SWWW_COMMAND - The base command for swww.
 */
const SWWW_COMMAND = 'swww';

/**
 * Generates the swww command to display an image with specified options.
 * 
 * @param {string} imagePath - The path of the image or hexcode (starting with 0x) to display.
 * @param {Object} options - Options for the command.
 * @param {string} [options.outputs] - Comma-separated list of outputs to display the image at (e.g., "0,1").
 * @param {boolean} [options.noResize] - If true, do not resize the image.
 * @param {'no' | 'crop' | 'fit'} [options.resize] - Resize method (default='crop').
 * @param {string} [options.fillColor] - Fill color for padding when the output image does not fill the screen (default='000000').
 * @param {'Nearest' | 'Bilinear' | 'CatmullRom' | 'Mitchell' | 'Lanczos3'} [options.filter] - Filter to use when scaling images (default='Lanczos3').
 * @param {'none' | 'simple' | 'fade' | 'left' | 'right' | 'top' | 'bottom' | 'wipe' | 'wave' | 'grow' | 'center' | 'any' | 'outer' | 'random'} [options.transitionType] - Type of transition (default='simple').
 * @param {number} [options.transitionStep] - Speed of transition (default=2 for 'simple', 90 otherwise).
 * @param {number} [options.transitionDuration] - Duration of transition in seconds (default=3).
 * @param {number} [options.transitionFps] - Frame rate for transition effect (default=30).
 * @param {number} [options.transitionAngle] - Angle for "wipe" and "wave" transitions (in degrees, default=45).
 * @param {'center' | 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | `${number},${number}` } [options.transitionPos] - Center position for "grow" and "outer" transitions. Can be percentage or pixel values (default='center').
 * @returns {string[]} An array representing the swww command and its arguments.
 */
function createSwwwCommand(imagePath, options = {}) {
    const command = [SWWW_COMMAND, 'img', imagePath];

    // Adding options to the command
    if (options.outputs) {
        command.push('--outputs', options.outputs);
    }
    if (options.noResize) {
        command.push('--no-resize');
    }
    if (options.resize) {
        command.push('--resize', options.resize);
    }
    if (options.fillColor) {
        command.push('--fill-color', options.fillColor);
    }
    if (options.filter) {
        command.push('-f', options.filter);
    }
    if (options.transitionType) {
        command.push('--transition-type', options.transitionType);
    }
    if (options.transitionStep !== undefined) {
        command.push('--transition-step', options.transitionStep);
    }
    if (options.transitionDuration !== undefined) {
        command.push('--transition-duration', options.transitionDuration);
    }
    if (options.transitionFps !== undefined) {
        command.push('--transition-fps', options.transitionFps);
    }
    if (options.transitionAngle !== undefined) {
        command.push('--transition-angle', options.transitionAngle);
    }
    if (options.transitionPos) {
        command.push('--transition-pos', options.transitionPos);
    }

    return command;
}

// Example usage
const command = createSwwwCommand('path/to/image.png', {
    outputs: '0,1',
    noResize: true,
    resize: 'fit',
    fillColor: 'FFFFFF',
    filter: 'Lanczos3',
    transitionType: 'fade',
    transitionStep: 90,
    transitionDuration: 3,
    transitionFps: 30,
    transitionAngle: 45,
    transitionPos: 'center'
});

console.log(command);
