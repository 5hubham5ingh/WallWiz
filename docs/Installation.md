## Prerequisites

- **Kitty terminal**: For displaying the wallpaper grid in the terminal.
- **ImageMagick**: For extracting colours from wallpaper.
- **Extension scripts**: For setting the wallpaper and themes. You can write
  your own script or download the required ones from
  [here](https://github.com/5hubham5ingh/WallWiz/tree/main?tab=readme-ov-file#step-2-get-the-required-extension-scripts).

## Installation

### Step 1: Get the executable binary

#### Option 1: Download Executable

- You can download the executable binary from the
  [GitHub releases](https://github.com/5hubham5ingh/WallWiz/releases) page.

- Or, run

```bash
sudo curl -L $(curl -s https://api.github.com/repos/5hubham5ingh/WallWiz/releases/latest | grep -oP '"browser_download_url": "\K(.*)(?=")' | grep WallWiz) -o /usr/bin/WallWiz && sudo chmod +x /usr/bin/WallWiz
```

#### Option 2: Build from Source

- Follow the steps written in
  [build.sh](https://github.com/5hubham5ingh/WallWiz/blob/main/build.sh).
- Or, run

```bash
curl -fsSL https://raw.githubusercontent.com/5hubham5ingh/WallWiz/main/build.sh | sh
```

### Step 2: Get the required extension scripts

#### Option 1: Download pre-written extension scripts

##### Wallpaper daemon handlers

- Download it from
  [here](https://github.com/5hubham5ingh/WallWiz/tree/main/wallpaperDaemonHandlerScripts).
- Or, run
  ```bash
  WallWiz -w
  ```

##### Theme extension scripts

- Download it from
  [here](https://github.com/5hubham5ingh/WallWiz/tree/main/themeExtensionScripts).
- Or, run
  ```bash
  WallWiz -t
  ```

_**Note:**_ [curl](https://github.com/curl/curl) and
[fzf](https://github.com/junegunn/fzf) are required to download and filter
script from command line.

#### Option 2: Write your own custom scripts

WallWiz's functionality can be extended through user-defined JavaScript scripts:


