# WallWiz

WallWiz (wallpaper wizard) let you select a wallpaper from a grid menu displayed in a terminal emulator (Kitty) and apply not only the wallpaper but also dynamically generated themes to various applications, including terminal emulators and window managers.

## Features

- **Wallpaper Selection**: Choose your wallpaper from a grid menu in the terminal.
- **Theme Generation and Application**: Automatically generates and applies themes based on the chosen wallpaper to applications such as Kitty terminal and Hyprland window manager.
- **Extensible with Scripts**: You can write custom scripts in JavaScript for theme generation and wallpaper application.

## Prerequisites

- **Kitty terminal**: For displaying the wallpaper grid in the terminal.
- **ImageMagick**: For generating color themes.
- **Extension scripts**: For setting the wallpaper and themes. You can write your own script or download the required ones from [here](https://github.com/5hubham5ingh/WallWiz/tree/main?tab=readme-ov-file#step-2-get-the-required-extension-scripts).

## Installation
### Step 1: Get the executable binary
#### Option 1: Download Executable

You can download the executable binary from the [GitHub releases](https://github.com/5hubham5ingh/WallWiz/releases) page.

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

8. Create alias (optional)
   ```bash
   # For bash terminal
   echo "alias ww='WallWiz'" >> ~/.bashrc

### Step 2: Get the required extension scripts

#### Option 1: Download prewritten extension scripts

##### Wallpaper daemon handlers

1. [Hyprpaper](https://github.com/5hubham5ingh/WallWiz/blob/main/wallpaperDaemonHandlerScripts/hyprpaper.js)
   
##### Theme extension scripts
1. [kitty](https://github.com/5hubham5ingh/WallWiz/blob/main/themeExtensionScripts/kitty.js)
2. [hyprland](https://github.com/5hubham5ingh/WallWiz/blob/main/themeExtensionScripts/hyprland.js)

#### Option 2: Write your own custom scripts
WallWiz's functionality can be extended through user-defined JavaScript scripts:

- **Theme Extension Scripts**: Located in `~/.config/WallWiz/themeExtensionScripts/`, these scripts are responsible for generating and applying themes. Each script should export the following functions:
  - `async setTheme(filepath, execAsync)`: This function receives the file path to the cached theme configuration file, then it applies the theme using the configuration file.
  
  - `async getThemeConf(colorHexArray)`: This function generates a theme configuration file from an array of 30 hex color codes derived from the selected wallpaper and returns it as a string. It will only be called when either the cached theme configuration file does not exist or is outdated.
  
    **Example Array**:
    ```javascript
    [
      "#1a1a1a", "#2e2e2e", "#424242", "#565656", "#6a6a6a",
      "#7e7e7e", "#929292", "#a6a6a6", "#bababa", "#cecece",
      "#e2e2e2", "#f6f6f6", "#ff0000", "#ff7f00", "#ffff00",
      "#7fff00", "#00ff00", "#00ff7f", "#00ffff", "#007fff",
      "#0000ff", "#7f00ff", "#ff00ff", "#ff007f", "#ffffff",
      "#000000", "#ffaaaa", "#aaffaa", "#aaaaff", "#ffaa00"
    ]
    ```

- **Wallpaper Daemon Handler**: The single script located in `~/.config/WallWiz/` should default export the function `setWallpaper(wallpaperPath, execAsync)`.

  **Example**:
  ```javascript
  async setWallpaper(wallpaperPath, execAsync){
    os.exec(["hyprctl", "-q", "hyprpaper unload all"]);
    os.exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
    os.exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
  }

  export default setWallpaper;
  ```

- **System Calls**: The standard modules of QuickJS, such as `std` and `os`, can be imported in the scripts for any necessary system calls.

  If you need to run shell commands, `execAsync` can be used like this:
  ```javascript
  const activeWallpaper = await execAsync('hyprctl hyrpaper listactive');
  // or as an array
  const activeWallpaper = await execAsync(['hyprctl', 'hyprpaper', 'listactive']);
  ```

## Usage

| **Option**         | **Description**                                                                                     |
|--------------------|-----------------------------------------------------------------------------------------------------|
| `--wall-dir`, `-d` | Specifies the directory containing wallpapers.                                                      |
| `--random`, `-r`   | Applies a random wallpaper from the specified directory.                                             |
| `--img-size`, `-s` | Sets the size of wallpaper previews in `WIDTHxHEIGHT` format (e.g., `60x20`).                        |
| `--light-theme`, `-l` | Apply light theme instead of the default dark theme                                            |
| `--padding`, `-p`  | Defines padding around previews in `V_PADDINGxH_PADDING` format (e.g., `2x1`).                       |
| `--auto-resize`, `-a` | Automatically resizes the terminal window to fit all wallpaper previews.                           |


## Contributing

Contributions are welcome! Feel free to submit pull requests to extend the functionality of WallWiz.

## Future Plans

- Add support for browsing online wallpapers directly from the terminal.

## License

This project is licensed under the [MIT License](LICENSE).
      
