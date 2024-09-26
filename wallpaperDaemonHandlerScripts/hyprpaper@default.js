import { exec } from 'os'

function setWallpaper(wallpaperPath, execAsync) {
  exec(["hyprctl", "-q", "hyprpaper unload all"]);
  exec(["hyprctl", "-q", `hyprpaper preload ${wallpaperPath}`]);
  exec(["hyprctl", "-q", `hyprpaper wallpaper eDP-1,${wallpaperPath}`]);
}


export default setWallpaper;
