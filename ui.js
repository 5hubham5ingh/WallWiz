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

class UiInitializer {
  constructor({
    imageWidth,
    paddH,
    imageHeight,
    paddV,
    wallpapers,
    picCacheDir,
    handleSelection,
  }) {
    this.imageWidth = imageWidth;
    this.paddH = paddH;
    this.imageHeight = imageHeight;
    this.paddV = paddV;
    this.wallpapers = wallpapers;
    this.picCacheDir = picCacheDir;
    this.containerWidth = imageWidth + paddH;
    this.containerHeight = imageHeight + paddV;
    this.terminalWidth = 0;
    this.terminalHeight = 0;
    this.xy = [];
    this.selection = 0;
    this.handleSelection = handleSelection;
  }

  async init() {
    [this.terminalWidth, this.terminalHeight] = ttyGetWinSize();

    while (this.containerWidth + 2 > this.terminalWidth) {
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

  calculateCoordinatesOld() {
    let generatedCount = 0;
    this.xy = [];
    for (let y = 2;; y += this.containerHeight) {
      for (
        let x = 2;
        x + this.containerWidth < this.terminalWidth;
        x += this.containerWidth
      ) {
        if (generatedCount < this.wallpapers.length) {
          this.xy.push([x, y]);
          generatedCount++;
        } else return;
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
    if (this.selection < 1) this.selection = this.xy.length - 1;
    else this.selection--;
    this.drawContainerBorder(this.xy[this.selection]);
  }

  moveRight() {
    if (this.selection + 1 === this.xy.length) this.selection = 0;
    else this.selection++;
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
    for (let i = this.selection + 1; i < this.xy.length; i++) {
      const nextContainer = this.xy[i];
      if (nextContainer[0] === currentContainer[0]) {
        this.selection = i;
        this.drawContainerBorder(this.xy[this.selection]);
        return;
      }
    }
  }

  async handleEnter(index = this.selection) {
    await this.handleSelection(index);
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
