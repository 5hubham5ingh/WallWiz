import { UiInitializer } from "./ui.js";
import cache from "./cache.js";
import { Theme } from "./theme.js";

export default class WallpaperSetter extends UiInitializer {
  constructor(params) {
    super(params);
    this.wallpapersDir = params.wallpapersDir;
    this.picCacheDir = cache.picCacheDir;
    this.wallpapers = [];
  }

  async init() {
    this.loadWallpapers();
    await this.createCache();
    this.themeManager = new Theme(this.wallpapersDir, this.wallpapers);
    await this.themeManager.init();
  }

  // abstract function of UI getting overwritten here
  async handleSelection(wallpaper) {
    const { name, uniqueId } = wallpaper;

    const promises = [ // this.enableLightTheme should be passed in the themes constructor, not here.
      this.themeManager.setTheme(uniqueId, this.enableLightTheme).catch((e) => {
        print(clearTerminal, "Failed to set theme for ", name, uniqueId, e);
      }),
      this.setWallpaper(name),
    ];
    await Promise.all(promises);
  }

  isSupportedImageFormat(name) {
    const nameArray = name.split(".");
    const format = nameArray[nameArray.length - 1].toLowerCase();
    return /^(jpeg|png|webp|jpg)$/i.test(format);
  }

  loadWallpapers() {
    const [wallpapers, error] = readdir(this.wallpapersDir);
    if (error !== 0) {
      print("Failed to read wallpapers directory: ", this.wallpapersDir);
      exit(error);
    }
    this.wallpapers = wallpapers.filter(
      (name) =>
        name !== "." && name !== ".." && this.isSupportedImageFormat(name),
    ).map((name) => {
      const [stats, error] = stat(
        this.wallpapersDir.concat(name),
      );

      if (error) {
        print(
          "Failed to read wallpaper stat for :",
          this.wallpapers.concat(name),
        );
        exit(error);
      }
      const { dev, ino } = stats;
      return {
        name,
        uniqueId: `${dev}${ino}`.concat(name.slice(name.lastIndexOf("."))),
      };
    });

    if (!this.wallpapers.length) {
      print(
        `No wallpapers found in "${
          ansi.styles(["bold", "underline", "red"]) +
          this.wallpapersDir +
          ansi.style.reset
        }".`,
      );
      print(cursorShow);
      exit(2);
    }
  }

  async createCache() {
    const [cacheNames, error] = readdir(this.picCacheDir);
    const doesWallaperCacheExist = () => {
      if (error !== 0) return false;
      const cachedWallpaper = cacheNames.filter(
        (name) =>
          name !== "." && name !== ".." && this.isSupportedImageFormat(name),
      );
      if (!cachedWallpaper.length) return false;
      return this.wallpapers.every((cacheName) =>
        cachedWallpaper.some((wp) => wp.uniqueId === cacheName)
      );
    };

    const createWallpaperCachePromises = [];

    const makeCache = async (wallpaper) => {
      // add a check if see it the wallpaper cache already exits, then do not cache it again.
      const cachePicName = this.picCacheDir.concat(
        wallpaper.uniqueId,
      );
      return execAsync([
        "magick",
        this.wallpapersDir.concat(wallpaper.name),
        "-resize",
        "800x600",
        "-quality",
        "50",
        cachePicName,
      ])
        .catch((e) => {
          print(
            "Failed to create wallpaper cache. Make sure ImageMagick is installed in your system",
            e,
          );
          exit(2);
        });
    };

    if (!doesWallaperCacheExist()) {
      print("Processing images...");
      this.wallpapers.forEach((wallpaper) => {
        if (!cacheNames.includes(wallpaper.uniqueId)) {
          createWallpaperCachePromises.push(makeCache(wallpaper));
        }
      });
    }

    await Promise.all(createWallpaperCachePromises);
  }

  async setWallpaper(wallpaperName) {
    const wallpaperDir = `${this.wallpapersDir}/${wallpaperName}`;
    return config.wallpaperDaemonHandler(wallpaperDir); // calling the handler function to set the wallpaper
  }
}
