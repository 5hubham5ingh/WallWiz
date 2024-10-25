
export function setWallpaper(wallpaperPath) {
  OS.exec(["hyprctl", "-q", "hyprpaper unload all"]);
  OS.exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
  OS.exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
}


