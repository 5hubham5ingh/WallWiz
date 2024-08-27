class Hyprpaper {
  constructor(os, std) {
    this.os = os;
    this.std = std;
  }

  async setWallpaper(wallpaperPath, execAsync) {
    this.os.exec(["hyprctl", "-q", "hyprpaper unload all"]);
    this.os.exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
    this.os.exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
  }

}
export default Hyprpaper;
