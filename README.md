# WallWiz

https://github.com/user-attachments/assets/26a494b5-0457-4bbf-b44e-c1f34410b3f2

WallWiz (wallpaper wizard) let you select a wallpaper from a grid menu displayed in a terminal emulator (Kitty) and apply not only the wallpaper but also dynamically generated themes to various applications, including terminal emulators and window managers.

## Features

- **Wallpaper Selection**: Choose your wallpaper from a grid menu in the terminal.
- **Theme Generation and Application**: Automatically generates and applies themes based on the chosen wallpaper to applications such as Kitty terminal and Hyprland window manager.
- **Wallpaper Browsing**: Browse wallpapers online directly from your terminal and download them to the specified wallpaper directory.
- **Extensible with Scripts**: You can write custom scripts in JavaScript for theme generation and wallpaper application.

## Prerequisites

- **Kitty terminal**: For displaying the wallpaper grid in the terminal.
- **ImageMagick**: For extracting colours from wallpaper.
- **Extension scripts**: For setting the wallpaper and themes. You can write your own script or download the required ones from [here](https://github.com/5hubham5ingh/WallWiz/tree/main?tab=readme-ov-file#step-2-get-the-required-extension-scripts).

## Installation
### Step 1: Get the executable binary
#### Option 1: Download Executable

- You can download the executable binary from the [GitHub releases](https://github.com/5hubham5ingh/WallWiz/releases) page.

- Or, run 
```bash
sudo curl -L $(curl -s https://api.github.com/repos/5hubham5ingh/WallWiz/releases/latest | grep -oP '"browser_download_url": "\K(.*)(?=")' | grep WallWiz) -o /usr/bin/WallWiz && sudo chmod +x /usr/bin/WallWiz
```

#### Option 2: Build from Source

1. Clone the required library:
   ```bash
   git clone https://github.com/5hubham5ingh/justjs.git

3. Clone the project repository:
   ```bash
   git clone https://github.com/5hubham5ingh/WallWiz.git

3. Get the qjsc compiler source, build, and install it:
   ```bash
   git clone https://github.com/bellard/quickjs.git &&
   cd quickjs &&
   make &&
   sudo make install 

5. Build WallWiz:
   ```bash
   cd WallWiz
   qjsc main.js -o WallWiz

6. Make the binary executable
   ```bash
   sudo chmod +x WallWiz

7. Install WallWiz:
   ```bash
   sudo cp WallWiz /usr/bin/


### Step 2: Get the required extension scripts

#### Option 1: Download prewritten extension scripts

##### Wallpaper daemon handlers

- Download it from [here](https://github.com/5hubham5ingh/WallWiz/tree/main/wallpaperDaemonHandlerScripts).
- Or, run
  ```bash
  WallWiz -w
  ```
##### Theme extension scripts
- Download it from [here](https://github.com/5hubham5ingh/WallWiz/tree/main/themeExtensionScripts).
- Or, run
  ```bash
  WallWiz -t
  ```
***Note:*** [curl](https://github.com/curl/curl) and [fzf](https://github.com/junegunn/fzf) are required to download and filter script from command line.
#### Option 2: Write your own custom scripts
WallWiz's functionality can be extended through user-defined JavaScript scripts:

- **Theme Extension Scripts**: Located in `~/.config/WallWiz/themeExtensionScripts/`, these scripts are responsible for generating and applying themes. Each script should export the following functions:
  
  - `async function setTheme(filepath, execAsync){}`: This function receives the file path to the cached theme configuration file and applies the theme using the provided configuration file.
  
  - `async function getLightThemeConf(colorHexArray){}` and `async function getDarkThemeConf(colorHexArray){}`: These functions generate theme configuration files from an array of up to 30 hex color codes derived from the selected wallpaper and return them as strings. These functions will only be called when the cached theme configuration file either does not exist or is outdated.
  
    **Example Array**:
    ```javascript
    // Array of up to 30 colors derived from the wallpaper, ordered by their frequency in the wallpaper
    [
      "#1a1a1a", "#2e2e2e", "#424242", "#565656", "#6a6a6a",
      "#7e7e7e", "#929292", "#a6a6a6", "#bababa", "#cecece",
      "#e2e2e2", "#f6f6f6", "#ff0000", "#ff7f00", "#ffff00",
      "#7fff00", "#00ff00", "#00ff7f", "#00ffff", "#007fff",
      "#0000ff", "#7f00ff", "#ff00ff", "#ff007f", "#ffffff",
      "#000000", "#ffaaaa", "#aaffaa", "#aaaaff", "#ffaa00"
    ]
    ```
- **Wallpaper Daemon Handler**: The single script located in `~/.config/WallWiz/` should default export a function for applying wallpaper.

  **Example**:
  ```javascript
  import * as os from 'os'
  async function setWallpaper(wallpaperPath, execAsync){
    os.exec(["hyprctl", "-q", "hyprpaper unload all"]);
    os.exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
    os.exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
  }

  export default setWallpaper;
  ```

- **System Calls**: The standard modules of QuickJS, such as `std` and `os`, can be used in the scripts for any necessary system calls.

  If you need to run shell commands asynchronously, `execAsync` callback function can be used like this:
  ```javascript
  const activeWallpaper = await execAsync('hyprctl hyrpaper listactive');
  // or as an array
  const activeWallpaper = await execAsync(['hyprctl', 'hyprpaper', 'listactive']);
  ```

## Usage

| Option                | Shortcut | Default   | Description                                                                                     |
|-----------------------|----------|-----------|-------------------------------------------------------------------------------------------------|
| `--wall-dir`           | `-d`     | `Current directory` | Wallpaper directory path. Can also be set using the `WALLPAPER_DIR` environment variable. |
| `--random`             | `-r`  | `false`   | Apply a random wallpaper from the specified directory.                                           |
| `--img-size`           | `-s`     | `100x30`  | Image size in cell. Format: `WIDTHxHEIGHT`.                                                     |
| `--light-theme`        | `-l`  | `false`    | Enables light theme mode.                                                                       |
| `--padding`            | `-p`     | `1x1`     | Container padding in cells. Format: `VERTICLExHORIZONTAL`.                                       |
| `--enable-pagination`  | `-e`  | `false`   | Display wallpapers in a fixed-size grid. Remaining wallpapers will be displayed in the next grid upon navigation. |
| `--grid-size`          | `-g`     | `4x4`     | Wallpaper grid size. Format: `WIDTHxHEIGHT`.                                                     |
| `--theme-extensions`   | `-t` | `false`   | Download theme extension scripts.                                                               |
| `--wallpaper-handler`  | `-w` | `false`   | Download wallpaper handler script.                                                              |
| `--browse`             | `-b` | `false`   | Browse wallpapers online.                                                                       |
| `--repo-url`           | `-u`     | `https://github.com/5hubham5ingh/WallWiz/tree/wallpapers` | Wallpaper repository GitHub URL(s). Can also be set using the `WALLPAPER_REPO_URLS` environment variable. |
| `--api-key`            | `-k`     | `None`    | GitHub API key for increasing API's rate limit. Can also be set using the `GITHUB_API_KEY` environment variable. |
| `--show-keymap`        | `-m`  | `false`   | Display keymaps for the user interface.                                                         |
| `--disable-notification`| `-n` | `false`   | Disable desktop notifications.                                                                  |
| `--disable-autoscaling`| `-a`  | `false`   | Disable auto scaling terminal size to fit all images.                                            |
| `--set-interval` | `-v`| `disabled` | After random wallpaper at set interval. |
| `--hold` | `-o` | `true` | Hold application open even after the wallpaper has been applied. |
| `--plimit`             | `-x`     | `auto`    | Number of execution threads used.                                                               |
| `-h, --help`           |          |           | Print help.                                                                                     |
| `--version`            |          |           | Print the program version.                                                                      |

**Example:**
```bash
# Browse online wallpapers
WallWiz -d ~/Pictures -u https://github.com/D3Ext/aesthetic-wallpapers/tree/main/images;https://github.com/5hubham5ingh/WallWiz/tree/wallpapers

# Download theme extension scripts
WallWiz -t -d ~/Pictures

# Apply wallpaper and light theme
WallWiz -l -d ~/Pictures/wallpapers

# Enable grid view and disable terminal auto-scaling
WallWiz -e -a -d ~/Pictures
```
## Todo
- Worker thread pool for handling theme extension scripts.
- `swww` wallpaper daemon handler script.
- VS Code theme extension script.
- Firefox theme extension script.

## Contributing

Contributions are welcome! Feel free to submit pull requests.

- For extension scripts, name the script after the program for which it is intended, followed by your GitHub username to ensure uniqueness.  
  **Syntax**: `programName@userName.js`  
  **Example**: `kittyTerminalEmulator@5hubham5ngh.js`
- The beginning of the script should contain information about it. For reference, check out the [existing scripts](https://github.com/5hubham5ingh/WallWiz/tree/main/themeExtensionScripts).
  
- To contribute wallpapers, visit the [wallpapers repository](https://github.com/5hubham5ingh/WallWiz/tree/wallpapers).

## License

This project is licensed under the [MIT License](LICENSE).
      
