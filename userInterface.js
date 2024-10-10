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

"use strip";
class UserInterface {
  constructor(
    wallpaperNames,
    wallpapersDirectory,
    handleSelection,
  ) {
    this.wallpapers = wallpaperNames;
    this.picCacheDir = wallpapersDirectory;
    this.handleSelection = handleSelection;
    this.prepareUiConfig();
  }

  async init() {
    [this.terminalWidth, this.terminalHeight] = OS.ttyGetWinSize();

    while (
      this.containerWidth > this.terminalWidth
    ) {
      await this.increaseTerminalSize();
    }

    this.calculateCoordinates();

    while (
      this.isScreenHeightInsufficient()
    ) {
      await this.increaseTerminalSize();
      this.calculateCoordinates();
    }
    this.drawUI();
    await this.handleKeysPress();
  }

  prepareUiConfig() {
    [this.imageWidth, this.imageHeight] = USER_ARGUMENTS.imageSize;
    this.containerHeight = this.imageHeight + USER_ARGUMENTS.padding[0];
    this.containerWidth = this.imageWidth + USER_ARGUMENTS.padding[1];
    this.terminalWidth = 0;
    this.terminalHeight = 0;
    this.xy = [];
    this.selection = 0;

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

  async increaseTerminalSize() {
    const handleError = () =>
      utils.error(
        "Insufficient screen size.",
        "You can use pagination, or reduce the image preview size.",
      );

    if (USER_ARGUMENTS.disableAutoScaling) handleError();

    await execAsync(["kitty", "@", "set-font-size", "--", "-1"]).catch(
      (_e) => {
        utils.error(
          "Terminal size too small.",
          "Either set it manually or enable kitty remote control for automatic scaling.",
        );
      },
    );

    const [w, h] = OS.ttyGetWinSize();
    if (w === this.terminalWidth && h === this.terminalHeight) {
      OS.exec(["kitty", "@", "set-font-size", "--", "0"]);
      handleError();
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

  isScreenHeightInsufficient() {
    return this.xy.some(
      ([x, y]) =>
        y + this.containerHeight > this.terminalHeight ||
        x + this.containerWidth > this.terminalWidth,
    );
  }

  drawUI() {
    print(clearTerminal, cursorHide);

    if (!this.wallpapers) STD.exit(2);
    this.wallpapers.forEach((wallpaper, i) => {
      const wallpaperDir = `${this.picCacheDir}/${wallpaper.uniqueId}`;
      const [x, y] = i < this.xy.length
        ? this.xy[i]
        : this.xy[i % this.xy.length];
      const cordinates = `${this.imageWidth}x${this.imageHeight}@${x}x${y}`;
      OS.exec([
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

  changePage(direction, selectStart) {
    const newPageNo = this.pageNo + direction;
    if (
      USER_ARGUMENTS.enablePagination && newPageNo >= 0 &&
      newPageNo < this.wallpaperBatch.length
    ) {
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

  wrapSelection(direction) {
    this.selection = direction > 0 ? 0 : this.wallpapers.length - 1;
  }

  moveSelection(direction) {
    const newSelection = this.selection + direction;
    if (newSelection >= 0 && newSelection < this.wallpapers.length) {
      this.selection = newSelection;
      return true;
    }
    return false;
  }

  //#region Handle key press

  static printKeyMaps() {
    const l = ansi.style.underline;
    const h = ansi.styles(["red", "bold"]);
    const r = ansi.style.reset;
    const g = ansi.styles(["cyan", "bold"]);
    const keyMaps = `
${h} Key Maps                                        ${r}
${l}                                                 ${r}
 ${g}k/ArrowUp             ${r}: Move Up
 ${g}l/ArrowRight          ${r}: Move Right
 ${g}j/ArrowDown           ${r}: Move down
 ${g}h/ArrowLeft           ${r}: Move Left
 ${g}L/PageDown            ${r}: Next page
 ${g}H/PageUp              ${r}: Previous page
 ${g}Enter                 ${r}: Apply/Download wallpaper
 ${g}q                     ${r}: Quit
${l}                                                 ${r}
`;

    print(keyMaps);
  }

  moveLeft() {
    if (!this.moveSelection(-1) && !this.changePage(-1)) {
      this.wrapSelection(-1);
    }
    this.drawContainerBorder(this.xy[this.selection]);
  }

  moveRight() {
    if (!this.moveSelection(1) && !this.changePage(1)) {
      this.wrapSelection(1);
    }
    this.drawContainerBorder(this.xy[this.selection]);
  }

  nextPage() {
    this.changePage(1, true);
  }

  prevPage() {
    this.changePage(-1, true);
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

  handleExit(quit) {
    print(clearTerminal, cursorShow);
    OS.exec(["kitty", "@", "set-font-size", "--", "0"]);
    quit();
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
      L: () => this.nextPage(),
      [keySequences.PageDown]: () => this.nextPage(),
      H: () => this.prevPage(),
      [keySequences.PageUp]: () => this.prevPage(),
      q: (_, quit) => this.handleExit(quit),
      [keySequences.Enter]: () => this.handleEnter(),
      [keySequences.Escape]: () => this.handleExit(),
    };

    await handleKeysPress(keyPressHandlers);
  }

  //#endregion
}

export { UserInterface };
