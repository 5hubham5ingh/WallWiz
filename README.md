# WallWiz

WallWiz is a tool for generating and applying themes from wallpapers to your terminal and window manager.

## Features

- Generates themes from wallpapers
- Applies themes to Kitty terminal and Hyprland window manager
- Sets wallpaper using Hyprpaper (support for swww planned)

## Prerequisites

- Kitty terminal (for displaying images in the terminal)
- ImageMagick (for generating themes)
- Hyprpaper (for setting wallpaper)

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
      
