# Setup  

Refer to [Installation](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Installation.md) and [Extension](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Extensions.md) for instructions on installing WallWiz and obtaining the required extensions.  

- Launch Kitty with remote control enabled, as this is necessary for fullscreen image previews and terminal auto-scaling to fit all images.  
- Run the command:  
  ```bash  
  WallWiz -d [path to your wallpaper directory]  
  ```  
- WallWiz will scan the wallpapers and extract colors. This process occurs only during the first execution or when a new wallpaper is added to the wallpaper directory.  
- WallWiz will then display the wallpapers in a grid within the terminal, allowing you to select a wallpaper.  
- The selected wallpaper will be applied, along with the corresponding application themes.  

Refer to [Usage](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Usage.md) for more information on additional features and usage instructions.

## FAQ

### Q: Do I need Node.js for WallWiz to work?
No, WallWiz is a self-contained binary, written in QuickJS. It doesn't require any external runtime to function.

### Q: Can I customize the color extraction process?
Yes, you can specify a custom color extraction command using the `-c` argument. 

**Example:**

```bash
WallWiz -c "magick {} -colors 16 -unique-colors txt:-"
WallWiz -c "matugen image {} -j hex"
```

**Note:** To ensure the new command takes effect, delete the `~/.cache/WallWiz/colours.json` file.

### Q: Can I use WallWiz as a standalone theme manager?
Yes, you can disable the wallpaper setting functionality by adding a `return` statement within the `setWallpaper` function in your wallpaper handler script located at `~/.config/WallWiz/`.

**Example:**

Create a script named `temp.js` at `~/.config/WallWiz/` with the following content:

```javascript
export function setWallpaper() {
  return;
}
```

### Q: Can I use WallWiz solely as a wallpaper manager?
Yes, you can remove all theme extension scripts from the `~/.config/WallWiz/themeExtensionScripts` directory.

