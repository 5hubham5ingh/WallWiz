# Extension
Extensions may be acquired through either of the following two methods:
- Download Pre-written extensions.
- Write your own extensions.
  
## 1. Pre-written extensions

### Wallpaper daemon handlers

- Download it from [here](https://github.com/5hubham5ingh/WallWiz/tree/main/wallpaperDaemonHandlerScripts), and put it in `~/.config/WallWiz/`.
- Or, run
  ```bash
  WallWiz -w
  ```

### Theme extension scripts

- Download it from [here](https://github.com/5hubham5ingh/WallWiz/tree/main/themeExtensionScripts), and put it in `~/.config/WallWiz/themeExtensionScripts/`.
- Or, run
  ```bash
  WallWiz -t
  ```

_**Note:**_ [curl](https://github.com/curl/curl) and
[fzf](https://github.com/junegunn/fzf) are required to download and filter
script from command line.

## 2. User defined extensions

WallWiz's functionality can be extended through user-defined JavaScript scripts:

- **Theme Extension Scripts**: Located in
  `~/.config/WallWiz/themeExtensionScripts/`, these scripts are responsible for
  generating and applying themes. Each script should export the following
  functions:

  - `async function setTheme(filepath){}`: This function receives the
    file path to the cached theme configuration file and applies the theme using
    the provided configuration file.

  - `async function getLightThemeConf(colorHexArray){}` and
    `async function getDarkThemeConf(colorHexArray){}`: These functions generate
    theme configuration files from an array of up to 16 hex color codes derived (using the default color backend) 
    from the selected wallpaper and return them as strings. These functions will
    only be called when the cached theme configuration file either does not
    exist or has been changed.

    **Example Array**:
    ```javascript
    // Array of up to 16 colors (by default color back-end) derived from the wallpaper, ordered by their frequency in the wallpaper
    [ "#1a1a1a", "#2e2e2e", "#424242", "#565656", "#6a6a6a", "#7e7e7e", "#929292", "#a6a6a6", "#bababa", "#cecece", "#e2e2e2", "#f6f6f6" , "#ff0000", "#ff7f00", "#ffff00", ];
    ```
- **Wallpaper Daemon Handler**: The single script located in
  `~/.config/WallWiz/` should export a `setWallpaper` function for applying
  wallpaper.

  **Example**:
  ```javascript
  export function setWallpaper(wallpaperPath) {
    OS.exec(["hyprctl", "-q", "hyprpaper unload all"]);
    OS.exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
    OS.exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
  }
  ```
 #### Global Variables and Methods
   QuickJs's [OS](https://quickjs-ng.github.io/quickjs/stdlib#qjsos-module) and [STD](https://quickjs-ng.github.io/quickjs/stdlib#qjsstd-module) modules, along with a built-in [Color library](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Color.md) and few other helper [methods](https://github.com/5hubham5ingh/WallWiz/blob/dev/src/globalConstants.js), are available in the global scope. This allows them to be used directly in the extension script.

  **Examples:**
  ```javascript
  const activeWallpaper = await execAsync("hyprctl hyrpaper listactive");
  // or as an array
  const activeWallpaper = await execAsync([
    "hyprctl",
    "hyprpaper",
    "listactive",
  ]);
  ```
  ```javascript
  export function setWallpaper(wallpaperPath) {
      OS.exec(["hyprctl", "-q", "hyprpaper unload all"]);
      OS.exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
      OS.exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
  }
  ```

