# Usage Guide  

WallWiz is a versatile wallpaper manager with a variety of options for customizing your desktop's appearance. Below is a detailed guide to its usage, along with examples to help you get started.  

## Command-Line Options  

| Option                    | Shortcut | Default                                                   | Description                                                                                                       |
| ------------------------- | -------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--wall-dir`              | `-d`     | `Current directory`                                       | Wallpaper directory path. Can also be set using the `WALLPAPER_DIR` environment variable.                         |
| `--random`                | `-r`     | `false`                                                   | Apply a random wallpaper from the specified directory.                                                            |
| `--img-size`              | `-s`     | `100x30`                                                  | Image size in cell. Format: `WIDTHxHEIGHT`.                                                                       |
| `--light-theme`           | `-l`     | `false`                                                   | Enables light theme mode.                                                                                         |
| `--padding`               | `-p`     | `1x1`                                                     | Container padding in cells. Format: `VERTICLExHORIZONTAL`.                                                        |
| `--enable-pagination`     | `-e`     | `false`                                                   | Display wallpapers in a fixed-size grid. Remaining wallpapers will be displayed in the next grid upon navigation. |
| `--grid-size`             | `-g`     | `4x4`                                                     | Wallpaper grid size. Format: `WIDTHxHEIGHT`.                                                                      |
| `--theme-extensions`      | `-t`     | `false`                                                   | Download theme extension scripts.                                                                                 |
| `--wallpaper-handler`     | `-w`     | `false`                                                   | Download wallpaper handler script.                                                                                |
| `--browse`                | `-b`     | `false`                                                   | Browse wallpapers online.                                                                                         |
| `--repo-url`              | `-u`     | `https://github.com/5hubham5ingh/WallWiz/tree/wallpapers` | Wallpaper repository GitHub URL(s). Can also be set using the `WALLPAPER_REPO_URLS` environment variable.         |
| `--api-key`               | `-k`     | `None`                                                    | GitHub API key for increasing API's rate limit. Can also be set using the `GITHUB_API_KEY` environment variable.  |
| `--show-keymap`           | `-m`     | `false`                                                   | Print keymaps for the user interface.                                                                           |
| `--disable-notification`  | `-n`     | `false`                                                   | Disable desktop notifications.                                                                                    |
| `--disable-autoscaling`   | `-a`     | `false`                                                   | Disable auto scaling terminal size to fit all images.                                                             |
| `--set-interval`          | `-v`     | `disabled`                                                | Apply random wallpaper periodically at set interval.                                                              |
| `--set-interval-callback` | `-c`     | `none`                                                    | Inject JS to modify the arguments at setInterval.                                                                 |
| `--hold`                  | `-o`     | `flase`                                                    | Hold application open even after the wallpaper has been applied.                                                  |
| `--plimit`                | `-x`     | `auto`                                                    | Number of execution threads used.                                                                                 |
| `--help`              |     `-h`     |  `false`                                                         | Print help.                |
| `--version`               |          |                                                           | Print the program version.         |

---

### `--wall-dir` (`-d`)  
Specifies the directory containing your wallpapers. You can also set this using the `WALLPAPER_DIR` environment variable.  

**Example:**  
```bash  
WallWiz -d ~/Pictures/wallpapers  
```

### `--random` (`-r`)  
Applies a random wallpaper from the specified directory.  

**Example:**  
```bash  
WallWiz -r -d ~/Pictures/wallpapers  
```  

### `--img-size` (`-s`)  
Defines the display size of images in cells. Format: `WIDTHxHEIGHT`.  

**Example:**  
```bash  
WallWiz -s 150x40 -d ~/Pictures/wallpapers  
```  

### `--light-theme` (`-l`)  
Enables light theme mode.  

**Example:**  
```bash  
WallWiz -l -d ~/Pictures  
```  

### `--padding` (`-p`)  
Sets the container padding in cells. Format: `VERTICLExHORIZONTAL`.  

**Example:**  
```bash  
WallWiz -p 2x2 -d ~/Pictures  
```  

### `--enable-pagination` (`-e`)  
Enables grid pagination for wallpaper display.  

**Example:**  
```bash  
WallWiz -e -g 5x5 -d ~/Pictures  
```  

### `--grid-size` (`-g`)  
Defines the size of the wallpaper grid. Format: `WIDTHxHEIGHT`.  

**Example:**  
```bash  
WallWiz -g 3x3 -d ~/Pictures  
```  

### `--theme-extensions` (`-t`)  
Downloads theme extension scripts.  

**Example:**  
```bash  
WallWiz -t -d ~/Pictures  
```  

### `--wallpaper-handler` (`-w`)  
Downloads the wallpaper handler script.  

**Example:**  
```bash  
WallWiz -w -d ~/Pictures  
```  

### `--browse` (`-b`)  
Browse and download wallpapers online.  

**Example:**  
```bash  
WallWiz -b -u https://github.com/5hubham5ingh/WallWiz/tree/wallpapers  
```  

### `--repo-url` (`-u`)  
Specifies a wallpaper repository URL. Supports multiple URLs separated by semicolons (`;`).  

**Example:**  
```bash  
WallWiz -u https://github.com/D3Ext/aesthetic-wallpapers/tree/main/images;https://github.com/5hubham5ingh/WallWiz/tree/wallpapers  
```  

### `--api-key` (`-k`)  
Sets a GitHub API key to increase API rate limits. You can also use the `GITHUB_API_KEY` environment variable.  

**Example:**  
```bash  
WallWiz -k YOUR_API_KEY -b -u https://github.com/5hubham5ingh/WallWiz/tree/wallpapers  
```  

### `--show-keymap` (`-m`)  
Displays the user interface key mappings.  

**Example:**  
```bash  
WallWiz -m  
```  

### `--disable-notification` (`-n`)  
Disables desktop notifications.  

**Example:**  
```bash  
WallWiz -n -d ~/Pictures  
```  

### `--disable-autoscaling` (`-a`)  
Disables auto-scaling of the terminal size to fit all images.  

**Example:**  
```bash  
WallWiz -a -d ~/Pictures  
```  

### `--set-interval` (`-v`)  
Applies a random wallpaper periodically at the specified interval (in milliseconds).  

**Example:**  
```bash  
WallWiz -v 3600000 -d ~/Pictures  
```  

### `--set-interval-callback` (`-c`)  
Injects a JavaScript snippet to modify arguments for `setInterval`.  

**Example:**  
```bash  
WallWiz -v 3600000 -c "(globalThis.USER_ARGUMENTS ??= {})['enableLightTheme'] = ((h) => h >= 6 && h < 18)(new Date().getHours())"  
```  

### `--hold` (`-o`)  
Keeps the application open even after the wallpaper has been applied.  

**Example:**  
```bash  
WallWiz -o -d ~/Pictures  
```  

### `--plimit` (`-x`)  
Sets the number of execution threads to use.  

**Example:**  
```bash  
WallWiz -x 4 -d ~/Pictures  
```  

### `--help` (`-h`)  
Displays the help menu.  

**Example:**  
```bash  
WallWiz -h  
```  

### `--version`  
Displays the program version.  

**Example:**  
```bash  
WallWiz --version  
```  

---

## Combined Examples  

1. **Download Theme Extensions and Apply Light Theme:**  
   ```bash  
   WallWiz -t -l -d ~/Pictures  
   ```  

2. **Enable Grid View with Pagination and Disable Autoscaling:**  
   ```bash  
   WallWiz -e -a -g 4x4 -d ~/Pictures  
   ```  

3. **Set Wallpapers Based on Time of Day:**  
   ```bash  
   WallWiz -v 3600000 -c "(globalThis.USER_ARGUMENTS ??= {})['enableLightTheme'] = ((h) => h >= 6 && h < 18)(new Date().getHours())"  
   ```  

4. **Browse Wallpapers from Multiple Repositories:**  
   ```bash  
   WallWiz -b -u https://github.com/D3Ext/aesthetic-wallpapers/tree/main/images;https://github.com/5hubham5ingh/WallWiz/tree/wallpapers  
   ```  

---

For more information, check out the [FAQ](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/FAQ.md).  
