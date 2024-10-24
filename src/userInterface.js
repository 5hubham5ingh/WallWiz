import {
  clearTerminal,
  cursorHide,
  cursorMove,
  cursorShow,
  cursorTo,
  eraseDown,
} from "../../justjs/cursor.js";
import { ansi } from "../../justjs/ansiStyle.js";
import { handleKeysPress, keySequences } from "../../justjs/terminal.js";
import utils from "./utils.js";

/**
 * @typedef {import('./types.d.ts').WallpapersList} WallpapersList
 */

"use strip";
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
    catchError(() => {
      this.wallpapers = wallpaperList;
      this.wallpapersDir = wallpapersDirectory;
      this.handleSelection = handleSelection;
      this.getWallpaperPath = getWallpaperPath;
      this.prepareUiConfig();
    }, "UserInterface :: constructor");
  }

  /**
   * Initialize the user interface
   */
  async init() {
    await catchAsyncError(async () => {
      print(clearTerminal, cursorHide);
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
    }, "UserInterface :: init").finally(() => {
      print(clearTerminal, cursorShow);
      OS.exec(["kitty", "@", "set-font-size", "--", "0"]);
    });
  }

  prepareUiConfig() {
    catchError(() => {
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
        const batchSize = USER_ARGUMENTS.gridSize[0] *
          USER_ARGUMENTS.gridSize[1];
        this.wallpaperBatch = [];
        for (
          let start = 0;
          start < this.wallpapers.length;
          start += batchSize
        ) {
          this.wallpaperBatch.push(
            this.wallpapers.slice(start, start + batchSize),
          );
        }
        this.pageNo = 0;
        this.wallpapers = this.wallpaperBatch[this.pageNo];
      }
    }, "prepareUiConfig");
  }

  async increaseTerminalSize() {
    await catchAsyncError(async () => {
      const handleError = () => {
        throw new SystemError(
          "Insufficient screen size.",
          "You can use pagination, or reduce the image preview size.",
        );
      };

      if (USER_ARGUMENTS.disableAutoScaling) handleError();

      try {
        await execAsync(["kitty", "@", "set-font-size", "--", "-1"]);
      } catch (e) {
        throw new SystemError(
          "Terminal size too small.",
          "Either set it manually or enable kitty remote control for automatic scaling.",
          e,
        );
      }

      const [w, h] = OS.ttyGetWinSize();
      if (w === this.terminalWidth && h === this.terminalHeight) {
        handleError();
      }
      this.terminalWidth = w;
      this.terminalHeight = h;
    }, "increaseTerminalSize");
  }

  /**
   * Calculate coordinates for wallpaper placement in a grid
   */
  calculateCoordinates() {
    catchError(() => {
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
          generatedCount < totalImages &&
          generatedCount < this.wallpapers.length
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
    }, "calculateCoordinates");
  }

  /**
   * Check if screen height is insufficient
   * @returns {boolean} True if screen height is insufficient, false otherwise
   */
  isScreenHeightInsufficient() {
    return catchError(() =>
      this.xy.some(
        ([x, y]) =>
          y + this.containerHeight > this.terminalHeight ||
          x + this.containerWidth > this.terminalWidth,
      ), "isScreenHeightInsufficient");
  }

  /**
   * Draw the user interface- The wallpapers grid.
   */
  drawUI() {
    catchError(() => {
      if (!this.wallpapers) return;
      print(clearTerminal);
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
    }, "drawUI");
  }

  /**
   * Draw container border
   * @param {number[]} coordinates - [x, y] coordinates of the container
   */
  drawContainerBorder([x, y]) {
    catchError(() => {
      const OO = cursorTo(x, y);
      const xBorderUp = "\b╭" + "─".repeat(this.containerWidth - 1) + "╮";
      const xBorderDown = " ╰" + "─".repeat(this.containerWidth - 1) + "╯";
      const newLine = cursorMove(-1 * (this.containerWidth + 2), 1);
      const yBorder = ` │${" ".repeat(this.containerWidth - 1)}│${newLine}`;
      const border = `${OO}${xBorderUp}${newLine}${
        yBorder.repeat(this.containerHeight - 1)
      }${xBorderDown}${OO}`;
      print(cursorTo(0, 0), eraseDown, ansi.style.brightWhite, border);
    }, "drawContainerBorder");
  }

  /**
   * Change page in pagination mode
   * @param {number} direction - Direction of page change (1 for next, -1 for previous)
   * @param {boolean} selectStart - Whether to select the start of the new page
   * @returns {boolean} True if page changed successfully, false otherwise
   */
  changePage(direction, selectStart) {
    return catchError(() => {
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
    }, "changePage");
  }

  /**
   * Wrap selection to the other end of the list
   * @param {number} direction - Direction of wrap (1 for start, -1 for end)
   */
  wrapSelection(direction) {
    catchError(() => {
      this.selection = direction > 0 ? 0 : this.wallpapers.length - 1;
    }, "wrapSelection");
  }

  /**
   * Move selection in a given direction
   * @param {number} direction - Direction of movement (1 for next, -1 for previous)
   * @returns {boolean} True if selection moved successfully, false otherwise
   */
  moveSelection(direction) {
    return catchError(() => {
      const newSelection = this.selection + direction;
      if (newSelection >= 0 && newSelection < this.wallpapers.length) {
        this.selection = newSelection;
        return true;
      }
      return false;
    }, "moveSelection");
  }

  /**
   * Print key mappings for user reference
   */
  static printKeyMaps() {
    catchError(() => {
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
      throw SUCCESS;
    }, "printKeyMaps");
  }

  /**
   * Move selection left
   */
  moveLeft() {
    catchError(() => {
      if (!this.moveSelection(-1) && !this.changePage(-1)) {
        this.wrapSelection(-1);
      }
      this.drawContainerBorder(this.xy[this.selection]);
    }, "moveLeft");
  }

  /**
   * Move selection right
   */
  moveRight() {
    catchError(() => {
      if (!this.moveSelection(1) && !this.changePage(1)) {
        this.wrapSelection(1);
      }
      this.drawContainerBorder(this.xy[this.selection]);
    }, "moveRight");
  }

  /**
   * Move to next page
   */
  nextPage() {
    catchError(() => this.changePage(1, true), "nextPage");
  }

  /**
   * Move to previous page
   */
  prevPage() {
    catchError(() => this.changePage(-1, true), "prevPage");
  }

  /**
   * Move selection up
   */
  moveUp() {
    catchError(() => {
      const currentX = this.xy[this.selection][0];
      for (let i = this.selection - 1; i >= 0; i--) {
        if (this.xy[i][0] === currentX) {
          this.selection = i;
          this.drawContainerBorder(this.xy[this.selection]);
          return;
        }
      }
    }, "moveUp");
  }

  /**
   * Move selection down
   */
  moveDown() {
    catchError(() => {
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
    }, "moveDown");
  }

  /**
   * Enable fullscreen preview of the selected wallpaper
   */
  async enableFullScreenPreview() {
    await catchAsyncError(async () => {
      const wallpaperPath = this.getWallpaperPath(
        this.wallpapers[this.selection],
      );
      try {
        await execAsync(
          `kitty @ launch --type=overlay kitten icat --hold --stdin=no --scale-up ${wallpaperPath}`,
        );
      } catch (_) {
        utils.notify(
          "Failed to launch fullscreen preview.",
          "Make sure kitty remote control is enabled.",
          "critical",
        );
      }
    }, "enableFullScreenPreview");
  }

  /**
   * Handle enter key press (apply/download wallpaper)
   */
  async handleEnter() {
    await catchAsyncError(async () =>
      await this.handleSelection(this.wallpapers[this.selection])
    );
  }

  /**
   * Handle exit (quit the application)
   * @param {*} _ - Unused parameter
   * @param {Function} quit - Function to quit the application
   */
  handleExit(_, quit) {
    catchError(() => {
      print(clearTerminal, cursorShow);
      OS.exec(["kitty", "@", "set-font-size", "--", "0"]);
      quit();
    }, "handleExit");
  }

  /**
   * Set up key press handlers and start listening for key presses
   */
  async handleKeysPress() {
    await catchAsyncError(async () => {
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
    }, "handleKeysPress");
  }
}

export { UserInterface };
