import { exec as execAsync } from "../justjs/src/process.js";
import { exec, ttyGetWinSize } from "os";
import { exit } from "std";
import {
  cursorTo,
  cursorMove,
  cursorHide,
  eraseDown,
  cursorShow,
  clearTerminal,
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
    handleSelection
  }) {
    this.imageWidth = imageWidth;
    this.paddH = paddH;
    this.imageHeight = imageHeight;
    this.paddV = paddV;
    this.wallpapers = wallpapers;
    this.picCacheDir = picCacheDir;
    this.containerWidth = imageWidth + paddH;
    this.containerHeight = imageHeight + paddV;
    this.width = 0;
    this.height = 0;
    this.xy = [];
    this.selection = 0;
    this.handleSelection = handleSelection
  }

  async init() {
    [this.width, this.height] = ttyGetWinSize();

    while (this.containerWidth + 2 > this.width) {
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
        "\bEither set it manually or enable kitty remote control for automatic screen resizing."
      );
      exit(1);
    });
    const [w, h] = ttyGetWinSize();
    if (w === this.width && h === this.height)
      throw new Error(
        "Maximum screen size reached. \nScreen insufficient, switching pagination on."
      );
    this.width = w;
    this.height = h;
  }

  calculateCoordinates() {
    let generatedCount = 0;
    this.xy = [];
    for (let y = 2; ; y += this.containerHeight) {
      for (let x = 2; x + this.containerWidth < this.width; x += this.containerWidth) {
        if (generatedCount < this.wallpapers.length) {
          this.xy.push([x, y]);
          generatedCount++;
        } else return;
      }
    }
  }

  isScreenHeightInsufficient() {
    return this.xy.some(
      ([x, y]) => y + this.containerHeight > this.height || x + this.containerWidth > this.width
    );
  }

  drawUI() {
    print(clearTerminal, cursorHide);

    this.wallpapers.forEach((wallpaper, i) => {
      const wallpaperDir = `${this.picCacheDir}/${wallpaper}`;
      const [x, y] = i < this.xy.length ? this.xy[i] : this.xy[i % this.xy.length];
      const cordinates = `${this.imageWidth}x${this.imageHeight}@${x}x${y}`;
      exec([
        "kitten",
        "icat",
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
    const border = `${OO}${xBorderUp}${newLine}${yBorder.repeat(
      this.containerHeight - 1
    )}${xBorderDown}${OO}`;
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
    await this.handleSelection(index)
  }

  handleExit() {
    print(clearTerminal, cursorShow);
    exit(1);
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
