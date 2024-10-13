import { getenv, loadFile, open } from "std";
import { exec } from "os";

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHSL(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function generateTheme(colors, isDark) {
  const sortedColors = [...colors].sort((a, b) => {
    const [, , lA] = rgbToHSL(...hexToRGB(a));
    const [, , lB] = rgbToHSL(...hexToRGB(b));
    return isDark ? lA - lB : lB - lA;
  });

  const backgroundIndex = isDark ? 0 : sortedColors.length - 1;
  const foregroundIndex = isDark ? sortedColors.length - 1 : 0;

  const background = sortedColors[backgroundIndex];
  const foreground = sortedColors[foregroundIndex];

  const midIndex = Math.floor(sortedColors.length / 2);
  const frameColor = sortedColors[midIndex];
  const criticalColor = sortedColors[Math.floor(midIndex * 0.75)];

  return {
    background,
    foreground,
    frameColor,
    criticalColor,
  };
}

function getThemeConf(colours, isDark) {
  const theme = generateTheme(colours, isDark);

  const config = `
# WallWiz theme
[global]
frame_color = "${theme.frameColor}"
separator_color = frame

[urgency_low]
background = "${theme.background}"
foreground = "${theme.foreground}"

[urgency_normal]
background = "${theme.background}"
foreground = "${theme.foreground}"

[urgency_critical]
background = "${theme.background}"
foreground = "${theme.foreground}"
frame_color = "${theme.criticalColor}"
# end
  `.trim();

  return config;
}

function getDarkThemeConf(colours) {
  return getThemeConf(colours, true);
}

function getLightThemeConf(colours) {
  return getThemeConf(colours, false);
}

function setTheme(newThemeConfigPath) {
  const dunstConfigPath = getenv("HOME").concat("/.config/dunst/dunstrc");
  const dunstOldConfig = loadFile(dunstConfigPath);
  const newThemeConfig = loadFile(newThemeConfigPath);
  let filterOut = false;
  let updated = false;
  const updatedConfig = dunstOldConfig.split("\n")
    .filter((line) => {
      if (line.includes("# WallWiz theme")) {
        filterOut = true;
        updated = true;
        return false;
      }
      if (filterOut) {
        if (line.includes("# end")) {
          filterOut = false;
          return false;
        }
        return false;
      }
      return true;
    })
    .join("\n") + "\n" + newThemeConfig;

  if (!updated) dunstOldConfig.concat("\n", newThemeConfig);
  const dunstConfig = open(dunstConfigPath, "w+");

  dunstConfig.puts(updatedConfig);
  dunstConfig.close();

  exec(["pkill", "dunst"]);
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
