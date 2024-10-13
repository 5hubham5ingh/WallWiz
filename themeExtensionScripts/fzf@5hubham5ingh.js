/*
 For:            fzf, https://junegunn.github.io/fzf
 Author:         https://github.com/5hubham5ingh
 Prerequisite:   Shell configuration file. (default: .bashrc)

 Note: The new theme only takes effect in a new shell, or requires
       sourcing the shell configuration file in already running shell.
*/

import { getenv, loadFile, open, SEEK_SET } from "std";

const SHELL_CONFIG_FILE = "/.bashrc";

function getDarkThemeConf(colours) {
  return getThemeConf(colours, true);
}

function getLightThemeConf(colours) {
  return getThemeConf(colours, false);
}

function setTheme(themeConfig) {
  const fzfConfig = loadFile(themeConfig);
  updateOrAddEnvVar(
    getenv("HOME") + SHELL_CONFIG_FILE,
    "FZF_DEFAULT_OPTS",
    fzfConfig,
  );
}

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
  const highlight = sortedColors[midIndex];
  const accent = isDark
    ? sortedColors[Math.floor(midIndex / 2)]
    : sortedColors[Math.floor(midIndex * 1.5)];

  const secondary = sortedColors[Math.floor(midIndex * 0.75)];
  const tertiary = sortedColors[Math.floor(midIndex * 1.25)];

  return {
    background,
    foreground,
    highlight,
    accent,
    secondary,
    tertiary,
  };
}

function getThemeConf(colors, isDark = true) {
  const theme = generateTheme(colors, isDark);

  const config = `
    fg:${theme.foreground},
    bg:${theme.background},
    hl:${theme.highlight},
    fg+:${theme.accent},
    bg+:${theme.secondary},
    hl+:${theme.highlight},
    info:${theme.tertiary},
    prompt:${theme.highlight},
    pointer:${theme.accent},
    marker:${theme.accent},
    spinner:${theme.secondary},
    header:${theme.highlight},
    border:${theme.tertiary},
    gutter:${theme.background},
    preview-fg:${theme.foreground},
    preview-bg:${theme.background}
  `.replace(/\n+|\s/g, "").trim();

  return `--color ${config}`;
}

function updateOrAddEnvVar(filePath, variable, value) {
  let fileContent = "";

  const file = open(filePath, "r+");
  fileContent = file.readAsString();

  const regex = new RegExp(`^\\s*export\\s+${variable}="[^"]*"`, "m");
  const newEnvLine = `export ${variable}="${value}"`;

  if (regex.test(fileContent)) {
    fileContent = fileContent.replace(regex, newEnvLine);
  } else {
    fileContent += `\n${newEnvLine}\n`;
  }

  file.seek(0, SEEK_SET);
  file.puts(fileContent);
  file.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
