// Import necessary modules and functions
import { exec as execAsync } from "../justjs/src/process.js";
import {
  clearTerminal,
  cursorHide,
  cursorMove,
  cursorShow,
  cursorTo,
  eraseDown,
} from "../justjs/src/just-js/helpers/cursor.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import {
  handleKeysPress,
  keySequences,
} from "../justjs/src/just-js/helpers/terminal.js";
import utils from "./utils.js";

/**
 * @typedef {import('./types.d.ts').WallpapersList} WallpapersList
 */

class UserInterface {
  /**
   * Constructor for the UserInterface class
   * @param {WallpapersList} wallpaperList - List of wallpapers
   * @param {string} wallpapersDirectory - Directory containing wallpapers
   * @param {Function} handleSelection - Function to handle wallpaper selection
   * @param {Function} getWallpaperPath - Function to get wallpaper path
   */
  constructor(
    wallpaperList,
    wallpapersDirectory,
    handleSelection,
    getWallpaperPath,
  ) {
    this.wallpapers = wallpaperList;
    this.wallpapersDir = wallpapersDirectory;
    this.handleSelection = handleSelection;
    this.getWallpaperPath = getWallpaperPath;
    this.prepareUiConfig();
  }

  /**
   * Initialize the user interface
   */
  async init() {
    // Get initial terminal size
    [this.terminalWidth, this.terminalHeight] = OS.ttyGetWinSize();

    // Ensure terminal is wide enough
    while (this.containerWidth > this.terminalWidth) {
      await this.increaseTerminalSize();
    }

    this.calculateCoordinates();

    // Ensure terminal is tall enough
    while (this.isScreenHeightInsufficient()) {
      await this.increaseTerminalSize();
      this.calculateCoordinates();
    }

    this.drawUI();
    await this.handleKeysPress();
  }

  /**
   * Prepare UI configuration
   */
  prepareUiConfig() {
    // Set image dimensions and container size
    [this.imageWidth, this.imageHeight] = USER_ARGUMENTS.imageSize;
    this.containerHeight = this.imageHeight + USER_ARGUMENTS.padding[0];
    this.containerWidth = this.imageWidth + USER_ARGUMENTS.padding[1];
    this.terminalWidth = 0;
    this.terminalHeight = 0;
    this.xy = [];
    this.selection = 0;

    // Handle pagination if enabled
    if (USER_ARGUMENTS.enablePagination) {
      const batchSize = USER_ARGUMENTS.gridSize[0] * USER_ARGUMENTS.gridSize[1];
      this.wallpaperBatch = [];
      for (let start = 0; start < this.wallpapers.length; start += batchSize) {
        this.wallpaperBatch.push(
          this.wallpapers.slice(start, start + batchSize),
        );
      }
      this.pageNo = 0;
      this.wallpapers = this.wallpaperBatch[this.pageNo];
    }
  }

  /**
   * Increase terminal size if necessary
   */
  async increaseTerminalSize() {
    const handleError = () =>
      utils.error(
        "Insufficient screen size.",
        "You can use pagination, or reduce the image preview size.",
      );

    if (USER_ARGUMENTS.disableAutoScaling) handleError();

    try {
      await execAsync(["kitty", "@", "set-font-size", "--", "-1"]);
    } catch (_e) {
      utils.error(
        "Terminal size too small.",
        "Either set it manually or enable kitty remote control for automatic scaling.",
      );
    }

    const [w, h] = OS.ttyGetWinSize();
    if (w === this.terminalWidth && h === this.terminalHeight) {
      OS.exec(["kitty", "@", "set-font-size", "--", "0"]);
      handleError();
    }
    this.terminalWidth = w;
    this.terminalHeight = h;
  }

  /**
   * Calculate coordinates for wallpaper placement
   */
  calculateCoordinates() {
    let generatedCount = 0;
    this.xy = [];

    // Calculate the number of images that can fit horizontally
    const numCols = Math.floor(this.terminalWidth / this.containerWidth);

    // Calculate margins to center the grid horizontally
    const totalGridWidth = numCols * this.containerWidth;
    const horizontalMargin = Math.floor(
      (this.terminalWidth - totalGridWidth) / 2,
    );

    // Calculate the starting x position
    const startX = horizontalMargin;

    // Start y position with a top margin of 2 units
    let y = 2; // Top margin

    if (USER_ARGUMENTS.enablePagination) {
      // If gridSize is provided, parse the grid size and calculate coordinates accordingly
      const [numRows, numCols] = USER_ARGUMENTS.gridSize;

      // Calculate the number of images to generate based on the grid size
      const totalImages = numRows * numCols;

      while (
        generatedCount < totalImages && generatedCount < this.wallpapers.length
      ) {
        const currentRow = Math.floor(generatedCount / numCols);
        const currentCol = generatedCount % numCols;

        const x = startX + currentCol * this.containerWidth;
        const y = 2 + currentRow * this.containerHeight;

        this.xy.push([x, y]);
        generatedCount++;
      }
    } else {
      // Original behavior if no gridSize is provided
      while (generatedCount < this.wallpapers.length) {
        for (
          let x = startX;
          x + this.containerWidth <= this.terminalWidth;
          x += this.containerWidth
        ) {
          if (generatedCount < this.wallpapers.length) {
            this.xy.push([x, y]);
            generatedCount++;
          } else return;
        }
        y += this.containerHeight; // Move down for the next row of images
      }
    }
  }

  /**
   * Check if screen height is insufficient
   * @returns {boolean} True if screen height is insufficient, false otherwise
   */
  isScreenHeightInsufficient() {
    return this.xy.some(
      ([x, y]) =>
        y + this.containerHeight > this.terminalHeight ||
        x + this.containerWidth > this.terminalWidth,
    );
  }

  /**
   * Draw the user interface
   */
  drawUI() {
    print(clearTerminal, cursorHide);

    if (!this.wallpapers) STD.exit(2);

    // Draw wallpapers
    this.wallpapers.forEach((wallpaper, i) => {
      const wallpaperDir = `${this.wallpapersDir}/${wallpaper.uniqueId}`;
      const [x, y] = i < this.xy.length
        ? this.xy[i]
        : this.xy[i % this.xy.length];
      const coordinates = `${this.imageWidth}x${this.imageHeight}@${x}x${y}`;
      OS.exec([
        "kitten",
        "icat",
        "--stdin=no",
        "--scale-up",
        "--place",
        coordinates,
        wallpaperDir,
      ]);
    });

    this.drawContainerBorder(this.xy[this.selection]);
  }

  /**
   * Draw container border
   * @param {number[]} coordinates - [x, y] coordinates of the container
   */
  drawContainerBorder([x, y]) {
    const OO = cursorTo(x, y);
    const xBorderUp = "\b╭" + "─".repeat(this.containerWidth - 1) + "╮";
    const xBorderDown = " ╰" + "─".repeat(this.containerWidth - 1) + "╯";
    const newLine = cursorMove(-1 * (this.containerWidth + 2), 1);
    const yBorder = ` │${" ".repeat(this.containerWidth - 1)}│${newLine}`;
    const border = `${OO}${xBorderUp}${newLine}${
      yBorder.repeat(this.containerHeight - 1)
    }${xBorderDown}${OO}`;
    print(cursorTo(0, 0), eraseDown, ansi.style.brightWhite, border);
  }

  /**
   * Change page in pagination mode
   * @param {number} direction - Direction of page change (1 for next, -1 for previous)
   * @param {boolean} selectStart - Whether to select the start of the new page
   * @returns {boolean} True if page changed successfully, false otherwise
   */
  changePage(direction, selectStart) {
    if (!USER_ARGUMENTS.enablePagination) return false;

    const newPageNo = this.pageNo + direction;
    if (newPageNo >= 0 && newPageNo < this.wallpaperBatch.length) {
      this.pageNo = newPageNo;
      this.wallpapers = this.wallpaperBatch[this.pageNo];
      this.selection = direction > 0 || selectStart
        ? 0
        : this.wallpapers.length - 1;
      this.drawUI();
      return true;
    }
    return false;
  }

  /**
   * Wrap selection to the other end of the list
   * @param {number} direction - Direction of wrap (1 for start, -1 for end)
   */
  wrapSelection(direction) {
    this.selection = direction > 0 ? 0 : this.wallpapers.length - 1;
  }

  /**
   * Move selection in a given direction
   * @param {number} direction - Direction of movement (1 for next, -1 for previous)
   * @returns {boolean} True if selection moved successfully, false otherwise
   */
  moveSelection(direction) {
    const newSelection = this.selection + direction;
    if (newSelection >= 0 && newSelection < this.wallpapers.length) {
      this.selection = newSelection;
      return true;
    }
    return false;
  }

  /**
   * Print key mappings for user reference
   */
  static printKeyMaps() {
    const styles = {
      underline: ansi.style.underline,
      header: ansi.styles(["red", "bold"]),
      reset: ansi.style.reset,
      key: ansi.styles(["cyan", "bold"]),
    };

    const keyMaps = `
${styles.header} Key Maps                                        ${styles.reset}
${styles.underline}                                                 ${styles.reset}

 ${styles.key}k/ArrowUp             ${styles.reset}: Move Up
 ${styles.key}l/ArrowRight          ${styles.reset}: Move Right
 ${styles.key}j/ArrowDown           ${styles.reset}: Move down
 ${styles.key}h/ArrowLeft           ${styles.reset}: Move Left
 ${styles.key}L/PageDown            ${styles.reset}: Next page
 ${styles.key}H/PageUp              ${styles.reset}: Previous page
 ${styles.key}Enter                 ${styles.reset}: Apply/Download wallpaper
 ${styles.key}f                     ${styles.reset}: Fullscreen
 ${styles.key}ESC/Enter             ${styles.reset}: Exit fullscreen
 ${styles.key}q                     ${styles.reset}: Quit
${styles.underline}                                                 ${styles.reset}
`;
    print(keyMaps);
  }

  /**
   * Move selection left
   */
  moveLeft() {
    if (!this.moveSelection(-1) && !this.changePage(-1)) {
      this.wrapSelection(-1);
    }
    this.drawContainerBorder(this.xy[this.selection]);
  }

  /**
   * Move selection right
   */
  moveRight() {
    if (!this.moveSelection(1) && !this.changePage(1)) {
      this.wrapSelection(1);
    }
    this.drawContainerBorder(this.xy[this.selection]);
  }

  /**
   * Move to next page
   */
  nextPage() {
    this.changePage(1, true);
  }

  /**
   * Move to previous page
   */
  prevPage() {
    this.changePage(-1, true);
  }

  /**
   * Move selection up
   */
  moveUp() {
    const currentX = this.xy[this.selection][0];
    for (let i = this.selection - 1; i >= 0; i--) {
      if (this.xy[i][0] === currentX) {
        this.selection = i;
        this.drawContainerBorder(this.xy[this.selection]);
        return;
      }
    }
  }

  /**
   * Move selection down
   */
  moveDown() {
    const currentX = this.xy[this.selection][0];
    for (
      let i = this.selection + 1;
      i < this.xy.length && i < this.wallpapers.length;
      i++
    ) {
      if (this.xy[i][0] === currentX) {
        this.selection = i;
        this.drawContainerBorder(this.xy[this.selection]);
        return;
      }
    }
  }

  /**
   * Enable fullscreen preview of the selected wallpaper
   */
  async enableFullScreenPreview() {
    const wallpaperPath = this.getWallpaperPath(
      this.wallpapers[this.selection],
    );
    try {
      await execAsync(
        `kitty @ launch --type=overlay kitten icat --hold --stdin=no --scale-up ${wallpaperPath}`,
      );
    } catch (error) {
      utils.error("Toggle fullscreen", error);
      utils.notify(
        "Failed to launch fullscreen preview.",
        "Make sure kitty remote control is enabled.",
        "critical",
      );
    }
  }

  /**
   * Handle enter key press (apply/download wallpaper)
   */
  async handleEnter() {
    await this.handleSelection(this.wallpapers[this.selection]);
  }

  /**
   * Handle exit (quit the application)
   * @param {*} _ - Unused parameter
   * @param {Function} quit - Function to quit the application
   */
  handleExit(_, quit) {
    print(clearTerminal, cursorShow);
    OS.exec(["kitty", "@", "set-font-size", "--", "0"]);
    quit();
  }

  /**
   * Set up key press handlers and start listening for key presses
   */
  async handleKeysPress() {
    const keyPressHandlers = {
      k: this.moveUp.bind(this),
      [keySequences.ArrowUp]: this.moveUp.bind(this),
      l: this.moveRight.bind(this),
      [keySequences.ArrowRight]: this.moveRight.bind(this),
      j: this.moveDown.bind(this),
      [keySequences.ArrowDown]: this.moveDown.bind(this),
      h: this.moveLeft.bind(this),
      [keySequences.ArrowLeft]: this.moveLeft.bind(this),
      L: this.nextPage.bind(this),
      [keySequences.PageDown]: this.nextPage.bind(this),
      H: this.prevPage.bind(this),
      [keySequences.PageUp]: this.prevPage.bind(this),
      q: this.handleExit.bind(this),
      [keySequences.Enter]: this.handleEnter.bind(this),
      [keySequences.Escape]: this.handleExit.bind(this),
      f: this.enableFullScreenPreview.bind(this),
    };

    await handleKeysPress(keyPressHandlers);
  }
}

export { UserInterface };
