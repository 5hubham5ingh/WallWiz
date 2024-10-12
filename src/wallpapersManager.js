import { Theme } from "./themeManager.js";
import { UserInterface } from "./userInterface.js";
import utils from "./utils.js";
import { ensureDir } from "../../justjs/src/fs.js";

export default class WallpaperSetter {
  constructor() {
    this.picCacheDir = HOME_DIR.concat("/.cache/WallWiz/pic/");
    ensureDir(this.picCacheDir);
    this.wallpapers = this.loadWallpapers();
    this.themeManager = new Theme(
      this.picCacheDir,
      this.wallpapers,
    );
  }

  async init() {
    await this.loadWallpaperDaemonHandlerScript();
    await this.handleWallpaperCacheCreation();
    await this.themeManager.init();
    await this.handleSettingRandomWallpaper();
    await this.handleSettingWallpaper();
  }

  loadWallpapers() {
    const [imgFiles, error] = OS.readdir(
      USER_ARGUMENTS.wallpapersDirectory,
    );
    if (error !== 0) {
      throw new Error(
        "Failed to read wallpapers directory:\n" +
          USER_ARGUMENTS.wallpapersDirectory,
      );
    }
    const wallpapers = imgFiles.filter(
      (name) =>
        name !== "." && name !== ".." && this.isSupportedImageFormat(name),
    ).map((name) => {
      const [stats, error] = OS.stat(
        USER_ARGUMENTS.wallpapersDirectory.concat(name),
      );

      if (error) {
        throw new Error(
          "Failed to read wallpaper stat for:\n" +
            USER_ARGUMENTS.wallpapersDirectory.concat(name),
        );
      }
      const { dev, ino } = stats;
      return {
        name,
        uniqueId: `${dev}${ino}`.concat(name.slice(name.lastIndexOf("."))),
      };
    });

    if (!wallpapers.length) {
      throw new SystemError(
        "No wallpaper found in ".concat(USER_ARGUMENTS.wallpapersDirectory),
        "Male sure the supported image file exists in the directory.",
      );
    }

    return wallpapers;
  }

  async loadWallpaperDaemonHandlerScript() {
    const extensionDir = HOME_DIR.concat("/.config/WallWiz/");
    ensureDir(extensionDir);
    const scriptNames = OS.readdir(extensionDir)[0]
      .filter((name) => name !== "." && name !== ".." && name.endsWith(".js"));
    if (scriptNames.length > 1) {
      throw new SystemError(
        `Too many scripts found in the ${extensionDir}.`,
        "Only one script is required",
      );
    }
    if (scriptNames.length) {
      const extensionPath = extensionDir.concat(scriptNames[0]);
      const wallpaperDaemonHandler = await import(extensionPath);
      if (!wallpaperDaemonHandler.default) {
        throw new SystemError(
          "No default export found.",
          `Script: ${extensionPath}`,
        );
      }
      this.wallpaperDaemonHandler = wallpaperDaemonHandler.default;
    } else {
      throw new SystemError(
        "Failed to find any wallpaper daemon handler script in " + extensionDir,
        'Run "WallWiz --dwh" to download it if you do not have a wallpaper daemon handler script.',
      );
    }
  }

  async handleWallpaperCacheCreation() {
    const [cacheNames, error] = OS.readdir(this.picCacheDir);
    const doesWallaperCacheExist = () => {
      if (error !== 0) return false;
      const cachedWallpaper = cacheNames.filter(
        (name) =>
          name !== "." && name !== ".." && this.isSupportedImageFormat(name),
      );
      if (!cachedWallpaper.length) return false;
      return this.wallpapers.every((wallpaperName) =>
        cachedWallpaper.some((cacheId) => cacheId === wallpaperName.uniqueId)
      );
    };

    const makeCache = async (wallpaper) => {
      // add a check if see it the wallpaper cache already exits, then do not cache it again.
      const cachePicName = this.picCacheDir.concat(
        wallpaper.uniqueId,
      );
      return await execAsync([
        "magick",
        USER_ARGUMENTS.wallpapersDirectory.concat(wallpaper.name),
        "-resize",
        "800x600",
        "-quality",
        "50",
        cachePicName,
      ])
        .catch((e) => {
          throw new SystemError(
            "Failed to create wallpaper cache",
            "Make sure ImageMagick is installed in your system",
            e,
          );
        });
    };

    const createWallpaperCachePromisesQueue = [];
    if (!doesWallaperCacheExist()) {
      this.wallpapers.forEach((wallpaper) => {
        if (!cacheNames.includes(wallpaper.uniqueId)) {
          createWallpaperCachePromisesQueue.push(() => makeCache(wallpaper));
        }
      });
    } else return;

    print("Caching images...");
    await utils.promiseQueueWithLimit(
      createWallpaperCachePromisesQueue,
    );
    print("Done");
  }

  async handleSettingRandomWallpaper() {
    if (!USER_ARGUMENTS.setRandomWallpaper) return;
    const randomWallpaperIndex = Math.floor(
      Math.random() * this.wallpapers.length,
    );
    await this.handleSelection(this.wallpapers[randomWallpaperIndex]);
    STD.exit(0);
  }

  async handleSettingWallpaper() {
    const ui = new UserInterface(
      this.wallpapers,
      this.picCacheDir,
      this.handleSelection.bind(this),
      this.getWallpaperPath.bind(this),
    );
    await ui.init();
  }

  async handleSelection(wallpaper) {
    const { name, uniqueId } = wallpaper;
    const promises = [
      this.themeManager.setTheme(uniqueId)
        .catch(
          async (e) => {
            await utils.notify(
              `Failed to set theme for ${name} ${uniqueId}.`,
              e,
              "critical",
            );
          },
        ),
      this.setWallpaper(name),
    ];
    await Promise.all(promises);
  }

  getWallpaperPath(wallpaper) {
    return USER_ARGUMENTS.wallpapersDirectory.concat(wallpaper.name);
  }

  isSupportedImageFormat(name) {
    const nameArray = name.split(".");
    const format = nameArray[nameArray.length - 1].toLowerCase();
    return /^(jpeg|png|webp|jpg)$/i.test(format);
  }

  async setWallpaper(wallpaperName) {
    const wallpaperDir =
      `${USER_ARGUMENTS.wallpapersDirectory}/${wallpaperName}`;
    try {
      await this.wallpaperDaemonHandler(wallpaperDir);
      await utils.notify("Wallpaper changed:", wallpaperName, "normal");
    } catch (error) {
      await utils.notify(
        "Error in wallpaper daemon handler script.",
        error,
        "critical",
      );
    }
  }
}
