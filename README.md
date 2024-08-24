# WallWiz

WallWiz is a lightweight tool designed to enhance your desktop environment by allowing you to easily navigate, select, and apply wallpapers directly from your terminal. Additionally, WallWiz generates a color theme from the selected wallpaper and applies it across your desktop environment, including your terminal and window manager.

## Features

- **Wallpaper Navigation:** Navigate through wallpapers presented in a grid using your keyboard.
- **Wallpaper Application:** Apply selected wallpapers directly from the terminal.
- **Theme Generation:** Automatically generates a color theme from the applied wallpaper.
- **Theme Application:** Applies the generated theme to the Kitty terminal and Hyprland window manager.

## Requirements

- **Kitty Terminal:** Required for displaying images in the terminal.
- **ImageMagick:** Used for generating color themes.
- **Hyprpaper:** Currently supported for setting wallpapers (support for `swww` is planned).

## Installation

### Option 1: Download Executable

You can download the executable binary from the [GitHub releases](https://github.com/5hubham5ingh/WallWiz/releases) page.

### Option 2: Build from Source

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

7. Install WallWiz:
   ```bash
   sudo cp WallWiz /usr/bin/

## Usage

[Add usage instructions here]

## Contributing

Contributions are welcome! Feel free to submit pull requests to extend the functionality of WallWiz.

## Future Plans

- Add support for swww as an alternative wallpaper setter

## License

This project is licensed under the [MIT License](LICENSE).
      
