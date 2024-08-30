# WallWiz

WallWiz (wallpaper wizard) let you select a wallpaper from a grid menu displayed in a terminal emulator (Kitty) and apply not only the wallpaper but also dynamically generated themes to various applications, including terminal emulators and window managers.

## Features

- **Wallpaper Selection**: Choose your wallpaper from a grid menu in the terminal.
- **Theme Generation and Application**: Automatically generates and applies themes based on the chosen wallpaper to applications such as Kitty terminal and Hyprland window manager.
- **Extensible with Scripts**: You can write custom scripts in JavaScript for theme generation and wallpaper application.

## Prerequisites

- **Kitty terminal**: For displaying the wallpaper grid in the terminal.
- **ImageMagick**: For generating color themes.
- **Extension scripts**: For setting the wallpaper and themes. You can write your own script or download the required ones from here [1](https://github.com/5hubham5ingh/WallWiz/tree/main/themeExtensionScripts) [2](https://github.com/5hubham5ingh/WallWiz/tree/main/wallpaperDaemonHandlerScripts).

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

- **Theme Extension Scripts**: Located in `~/.config/WallWiz/themeExtensionScripts/`, these scripts are responsible for generating and applying themes. Each script should export a default class with a constructor and two methods: 
  - `setTheme(filepath, execAsync)`: Applies the theme based on the generated configuration file and uses the provided `execAsync` function for asynchronous command execution.
  - `getThemeConf(colorHexArray)`: Generates a theme configuration file from an array of colors and returns it as a string.
  
- **Wallpaper Daemon Handler**: The single script located in `~/.config/WallWiz/` should also export a default class with a mandatory `setWallpaper(wallpaperPath, execAsync)` method to apply the selected wallpaper.
- All the scripts receives the `os` and `std` modules from [QuickJS](https://bellard.org/quickjs/quickjs.html), in the class's constructor, for system-level operations.

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
      
