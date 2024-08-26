import { exec, readdir, ttyGetWinSize } from "os";
import { exit, getenv } from "std";
import {
  cursorTo,
  cursorMove,
  cursorHide,
  eraseDown,
  cursorShow,
  clearTerminal,
} from "../justjs/src/just-js/helpers/cursor.js";
import { ansi } from "../justjs/src/just-js/helpers/ansiStyle.js";
import arg from "../justjs/src/arg.js";
import { exec as execAsync } from "../justjs/src/process.js";
import {
  handleKeysPress,
  keySequences,
} from "../justjs/src/just-js/helpers/terminal.js";
import { Theme } from "./theme.js";
import { ensureDir } from "../justjs/src/fs.js";

("use strip");

const isValidColourCode = (str) => {
  const rgbRegex = /^(\d{1,3}),(\d{1,3}),(\d{1,3})$/;
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  const rgbMatch = str.match(rgbRegex);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch.map(Number);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  }
  return hexRegex.test(str);
};

const args = arg
  .parser({
    "--wall-dir": arg.path(".").check().desc("Wallpaper directory path"),
    "--random": arg
      .flag(false)
      .desc("Apply random wallpaper from the directory."),
    "--img-size": arg
      .str("42x10")
      .reg(/^\d+x\d+$/)
      .desc("Image size in pixel")
      .err("Invalid size, it should be of WIDTHxHEIGHT format. \n Ex:- 60x20")
      .map((size) => size.split("x").map(Number)),
    "--colour": arg // remove this option and make it black as default in the code.
      .str("")
      .cust(isValidColourCode)
      .val("ANSI or RGB colour")
      // .env('ForegroundColour')
      // .map(colour => colour[0] === '#' ? ansi.hex(colour) : ansi.rgb(colour.split(',')))
      .desc("Border colour"),
    "--light-theme": arg.flag().desc("Enable light theme."),
    "--padding": arg
      .str("1x1")
      .reg(/^\d+x\d+$/)
      .err(
        "Invalid padding, it should of V_PADDINGxH_PADDING format. \n Ex:- 2x1"
      )
      .map((padding) => padding.split("x").map(Number))
      .desc("Container padding in cells"),
    "--auto-resize": arg
      .flag(true)
      .desc(
        "Auto resize the kitty terminal when screen is insufficient to show all wallpapers."
      ),
    "--override": [
      arg
        .str()
        .reg(/^([a-zA-Z0-9]+=[^"]*|)$/)
        .err("Invalid value, it should be of the form NAME=VALUE")
        .desc("Do not override the specified default theme colour."),
    ],
    "-d": "--wall-dir",
    "-r": "--random",
    "-s": "--img-size",
    "-p": "--padding",
    "-c": "--colour",
    "-l": "--light-theme",
    "-a": "--auto-resize",
    "-o": "--override",
  })
  .ex([
    "-d ~/Pics/wallpaper/wallpaper.jpeg -s 42x10",
    "-p 4x4",
    "-c 50,168,52",
    '-o background=""',
  ])
  .ver("0.0.1")
  .parse();

const wallpapersDir = args["--wall-dir"];
const foregroundColour = args["--colour"];
const enableLightTheme = args["--light-theme"];

const isSupportedImageFormat = (name) => {
  const nameArray = name.split(".");
  const format = nameArray[nameArray.length - 1].toLowerCase();
  return /^(jpeg|png|webp|jpg)$/i.test(format);
};

const wallpapers = readdir(wallpapersDir)[0].filter(
  (name) => name !== "." && name !== ".." && isSupportedImageFormat(name)
);

if (!wallpapers.length) {
  print(
    `No wallpapers found in "${ansi.styles(["bold", "underline", "red"]) +
    wallpapersDir +
    ansi.style.reset
    }".`
  );
  print(cursorShow);
  exit(1);
}

if (args["--random"])
  await handleSelection(
    undefined,
    undefined,
    Math.floor(Math.random() * wallpapers.length)
  )
    .catch(print)
    .finally((_) => handleExit());

const picCacheDir = getenv("HOME").concat("/.cache/WallWiz/pic/");

ensureDir(picCacheDir);

const wallpaperCache = readdir(picCacheDir)[0].filter(
  (name) => name !== "." && name !== ".." && isSupportedImageFormat(name)
);

const makeCache = (wallpaper) =>
  execAsync([
    "magick",
    wallpapersDir.concat(wallpaper),
    "-resize",
    "800x600",
    "-quality",
    "50",
    picCacheDir.concat(wallpaper),
  ]);

const createWallpaperCachePromises = [];

if (!wallpaperCache.length)
  wallpapers.forEach((wallpaper) => {
    createWallpaperCachePromises.push(makeCache(wallpaper));
    wallpaperCache.push(wallpaper)
  }
  );
else if (wallpapers.length > wallpaperCache.length)
  wallpapers.forEach((wallpaper) => {
    const cacheExists = wallpaperCache.includes(wallpaper);
    if (!cacheExists) {
      createWallpaperCachePromises.push(makeCache(wallpaper));
      wallpaperCache.push(wallpaper)
    }
  });

if (createWallpaperCachePromises.length) await Promise.all(createWallpaperCachePromises);

const theme = new Theme(picCacheDir, wallpaperCache);

await theme.createThemes().catch(
  (e) => {
    print(e);
    exit(2);
  }
);


const [imageWidth, imageHeight] = args["--img-size"];
const [paddV, paddH] = args["--padding"];

const containerWidth = imageWidth + paddH;
const containerHeight = imageHeight + paddV;
let [width, height] = ttyGetWinSize();
const xy = [];

const increaseTerminalSize = async () => {
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
  if (w === width && h === height) throw new Error('Maximum screen size reached. \nScreen insufficient, switching pagination on.')
  width = w;
  height = h;
};

while (containerWidth + 2 > width) {
  await increaseTerminalSize();
} // Is terminal width insufficient

const calculateCoordinates = () => {
  let generatedCount = 0;
  xy.length = 0;
  for (let y = 2; ; y += containerHeight) {
    for (let x = 2; x + containerWidth < width; x += containerWidth) {
      if (generatedCount < wallpapers.length) {
        xy.push([x, y]);
        generatedCount++;
      } else return;
    }
  }
};

calculateCoordinates();

const isScreenHeightInsufficient = () =>
  xy.some(
    ([x, y]) => y + containerHeight > height || x + containerWidth > width
  );

while (isScreenHeightInsufficient()) {
  await increaseTerminalSize();
  calculateCoordinates();
}

print(clearTerminal, cursorHide);

wallpapers.forEach((wallpaper, i) => {
  const wallpaperDir = `${picCacheDir}/${wallpaper}`;
  const [x, y] = i < xy.length ? xy[i] : xy[i % xy.length];
  const cordinates = `${imageWidth}x${imageHeight}@${x}x${y}`;
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

let selection = 0;
const drawContainerBorder = ([x, y]) => {
  const OO = cursorTo(x, y);
  const xBorderUp = "\b╭" + "─".repeat(containerWidth - 1) + "╮";
  const xBorderDown = " ╰" + "─".repeat(containerWidth - 1) + "╯";
  const newLine = cursorMove(-1 * (containerWidth + 2), 1);
  const yBorder = ` │${" ".repeat(containerWidth - 1)}│${newLine}`;
  const border = `${OO}${xBorderUp}${newLine}${yBorder.repeat(
    containerHeight - 1
  )}${xBorderDown}${OO}`;
  print(cursorTo(0, 0), eraseDown, foregroundColour, border);
};

drawContainerBorder(xy[selection]);

const moveLeft = () => {
  if (selection < 1) selection = xy.length - 1;
  else selection--;
  drawContainerBorder(xy[selection]);
};

const moveRight = () => {
  if (selection + 1 === xy.length) selection = 0;
  else selection++;
  drawContainerBorder(xy[selection]);
};

async function handleSelection(_, __, index = selection) {
  const wallpaperName = wallpapers[index];
  const wallpaperDir = `${wallpapersDir}/${wallpaperName}`;

  exec(["hyprctl", "-q", "hyprpaper unload all"]);
  exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperDir}`]);
  exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperDir}`]);

  const cachedWallpaperPath = picCacheDir.concat(wallpaperName);
  await theme.setTheme(wallpaperName, enableLightTheme).catch(
    (e) => {
      print(clearTerminal, 'maim.js: line:279', e);
    }
  );
}

const moveUp = () => {
  const currentContainer = xy[selection];
  let upperContainer = null;
  for (let i = selection - 1; i >= 0; i--) {
    const prevContainer = xy[i];
    if (prevContainer[0] === currentContainer[0]) {
      selection = i;
      upperContainer = xy[selection];
      break;
    }
  }
  if (!upperContainer) return;
  drawContainerBorder(upperContainer);
};

const moveDown = () => {
  const currentContainer = xy[selection];
  let upperContainer = null;
  for (let i = selection + 1; i < xy.length; i++) {
    const nextContainer = xy[i];
    if (nextContainer[0] === currentContainer[0]) {
      selection = i;
      upperContainer = xy[selection];
      break;
    }
  }
  if (!upperContainer) return;
  drawContainerBorder(upperContainer);
};

function handleExit() {
  print(clearTerminal, cursorShow);
  exit(1);
}

const keyPressHandlers = {
  k: moveUp,
  [keySequences.ArrowUp]: moveUp,
  l: moveRight,
  [keySequences.ArrowRight]: moveRight,
  j: moveDown,
  [keySequences.ArrowDown]: moveDown,
  h: moveLeft,
  [keySequences.ArrowLeft]: moveLeft,
  " ": handleSelection,
  [keySequences.Enter]: handleSelection,
  q: handleExit,
  [keySequences.Escape]: handleExit,
};

await handleKeysPress(keyPressHandlers);
