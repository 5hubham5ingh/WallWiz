import { exec as execAsync } from "../justjs/src/process.js";
import { exec, ttyGetWinSize } from "os";
import { exit } from "std";
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

"use strip";

class UiInitializer {
  constructor({
    imageWidth,
    paddH,
    imageHeight,
    paddV,
    wallpapers,
    picCacheDir,
    handleSelection,
    pagination,
    gridSize,
  }) {
    this.imageWidth = imageWidth;
    this.paddH = paddH;
    this.imageHeight = imageHeight;
    this.paddV = paddV;
    this.wallpapers = wallpapers;
    this.wallpaperBatch = [];
    this.picCacheDir = picCacheDir;
    this.containerWidth = imageWidth + paddH;
    this.containerHeight = imageHeight + paddV;
    this.terminalWidth = 0;
    this.terminalHeight = 0;
    this.xy = [];
    this.selection = 0;
    this.handleSelection = handleSelection;
    this.pagination = pagination;
    this.defaultGridSize = gridSize;

    if (this.pagination) {
      const batchSize = gridSize[0] * gridSize[1];
      this.getWallpaperBatch(batchSize);
      this.pageNo = 0;
      this.wallpapers = this.wallpaperBatch[this.pageNo];
    }
  }

  async init() {
    [this.terminalWidth, this.terminalHeight] = ttyGetWinSize();

    while (this.containerWidth > this.terminalWidth) {
      await this.increaseTerminalSize();
    }

    this.calculateCoordinates();

    while (this.isScreenHeightInsufficient()) {
      await this.increaseTerminalSize();
      this.calculateCoordinates();
    }

    this.drawUI();
    await this.handleKeysPress();
  }

  getWallpaperBatch(batchSize) {
    this.wallpaperBatch = [];
    for (let start = 0; start < this.wallpapers.length; start += batchSize) {
      this.wallpaperBatch.push(
        this.wallpapers.slice(start, start + batchSize),
      );
    }
  }

  async increaseTerminalSize() {
    await execAsync(["kitty", "@", "set-font-size", "--", "-1"]).catch((e) => {
      print(
        ansi.styles(["bold", "red"]),
        "Terminal size too small.\n",
        ansi.style.reset,
        "\bEither set it manually or enable kitty remote control for automatic screen resizing.",
      );
      exit(1);
    });
    const [w, h] = ttyGetWinSize();
    if (w === this.terminalWidth && h === this.terminalHeight) {
      exec(["kitty", "@", "set-font-size", "--", "0"]);
      throw new Error(
        "Maximum screen size reached. \nScreen insufficient, switching pagination on.",
      );
    }
    this.terminalWidth = w;
    this.terminalHeight = h;
  }

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

    if (this.pagination) {
      // If gridSize is provided, parse the grid size and calculate coordinates accordingly
      const [numRows, numCols] = this.defaultGridSize;

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

  isScreenHeightInsufficient() {
    return this.xy.some(
      ([x, y]) =>
        y + this.containerHeight > this.terminalHeight ||
        x + this.containerWidth > this.terminalWidth,
    );
  }

  drawUI() {
    print(clearTerminal, cursorHide);

    if (!this.wallpapers) exit(2);
    this.wallpapers.forEach((wallpaper, i) => {
      const wallpaperDir = `${this.picCacheDir}/${wallpaper.uniqueId}`;
      const [x, y] = i < this.xy.length
        ? this.xy[i]
        : this.xy[i % this.xy.length];
      const cordinates = `${this.imageWidth}x${this.imageHeight}@${x}x${y}`;
      exec([
        "kitten",
        "icat",
        "--stdin=no",
        "--scale-up",
        "--transfer-mode=file",
        "--place",
        cordinates,
        wallpaperDir,
      ]);
    });

    this.drawContainerBorder(this.xy[this.selection]);
  }

  drawContainerBorder([x, y]) {
    const OO = cursorTo(x, y);
    const xBorderUp = "\b╭" + "─".repeat(this.containerWidth - 1) + "╮";
    const xBorderDown = " ╰" + "─".repeat(this.containerWidth - 1) + "╯";
    const newLine = cursorMove(-1 * (this.containerWidth + 2), 1);
    const yBorder = ` │${" ".repeat(this.containerWidth - 1)}│${newLine}`;
    const border = `${OO}${xBorderUp}${newLine}${
      yBorder.repeat(
        this.containerHeight - 1,
      )
    }${xBorderDown}${OO}`;
    print(cursorTo(0, 0), eraseDown, ansi.style.brightWhite, border);
  }

  moveLeft() {
    if (!this.selection) { // if currently on the first wallpaper of the grid
      if (this.pagination) {
        if (this.pageNo - 1 < 0) return; // if currently on the first page then do nothinga.
        this.wallpapers = this.wallpaperBatch[--this.pageNo]; // set the previous batch to display
        this.selection = this.wallpapers.length - 1; // select first wallpaper of the new batch.
        this.drawUI();
        return;
      } else this.selection = this.wallpapers.length - 1; // select last wallpaper on the grid.
    } else if (this.selection > 0) {
      this.selection--;
    }
    this.drawContainerBorder(this.xy[this.selection]);
  }

  moveRight() {
    if (this.selection + 1 === this.xy.length) { // if currently on the last wallpaper
      if (this.pagination) { // set next page if pagination enabled
        if (this.pageNo + 1 === this.wallpaperBatch.length) return; // if currently on the last page then do nothing.
        this.wallpapers = this.wallpaperBatch[++this.pageNo]; // set the next batch to display
        this.selection = 0; // select the first wallpaper of the new batch
        this.drawUI();
        return;
      } else this.selection = 0; // select first wallpaper
    } else if (this.selection + 1 < this.wallpapers.length) { // check if the next wallpaper in the grid exist
      this.selection++; // select next wallpaper in the grid
    }

    this.drawContainerBorder(this.xy[this.selection]);
  }

  moveUp() {
    const currentContainer = this.xy[this.selection];
    for (let i = this.selection - 1; i >= 0; i--) {
      const prevContainer = this.xy[i];
      if (prevContainer[0] === currentContainer[0]) {
        this.selection = i;
        this.drawContainerBorder(this.xy[this.selection]);
        return;
      }
    }
  }

  moveDown() {
    const currentContainer = this.xy[this.selection];
    for (
      let i = this.selection + 1;
      i < this.xy.length && i < this.wallpapers.length;
      i++
    ) {
      const nextContainer = this.xy[i];
      if (nextContainer[0] === currentContainer[0]) {
        this.selection = i;
        this.drawContainerBorder(this.xy[this.selection]);
        return;
      }
    }
  }

  async handleEnter(index = this.selection) {
    await this.handleSelection(this.wallpapers[index]);
  }

  handleExit() {
    print(clearTerminal, cursorShow);
    exit(0);
  }

  async handleKeysPress() {
    const keyPressHandlers = {
      k: () => this.moveUp(),
      [keySequences.ArrowUp]: () => this.moveUp(),
      l: () => this.moveRight(),
      [keySequences.ArrowRight]: () => this.moveRight(),
      j: () => this.moveDown(),
      [keySequences.ArrowDown]: () => this.moveDown(),
      h: () => this.moveLeft(),
      [keySequences.ArrowLeft]: () => this.moveLeft(),
      " ": () => this.handleEnter(),
      [keySequences.Enter]: () => this.handleEnter(),
      q: () => this.handleExit(),
      [keySequences.Escape]: () => this.handleExit(),
    };

    await handleKeysPress(keyPressHandlers);
  }
}

export { UiInitializer };
