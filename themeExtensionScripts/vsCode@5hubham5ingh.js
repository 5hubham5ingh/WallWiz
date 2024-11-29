/*
 For:            Visual studio code
 Author:         https://github.com/5hubham5ingh
 Prerequisite:   Installed and enabled WallWiz-theme in vscode from vscode marketplace.
 */

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

function hslToRGB(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function calculateContrast(rgb1, rgb2) {
  const luminance = (rgb) => {
    const a = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function adjustColorForReadability(baseColor, textColor, minContrast = 4) {
  let rgb1 = hexToRGB(baseColor);
  let rgb2 = hexToRGB(textColor);
  let hsl2 = rgbToHSL(...rgb2);

  const maxIterations = 20;
  let iterations = 0;

  while (
    calculateContrast(rgb1, rgb2) < minContrast && iterations < maxIterations
  ) {
    if (hsl2[2] > 50) {
      hsl2[2] = Math.min(hsl2[2] + 5, 95);
    } else {
      hsl2[2] = Math.max(hsl2[2] - 5, 5);
    }
    rgb2 = hslToRGB(...hsl2);
    iterations++;
  }

  if (calculateContrast(rgb1, rgb2) < minContrast) {
    const bgLuminance = rgbToHSL(...rgb1)[2];
    return bgLuminance > 50 ? "#000000" : "#ffffff";
  }

  return rgbToHex(...rgb2);
}

function invertLightness(hex) {
  let [h, s, l] = rgbToHSL(...hexToRGB(hex));
  l = 100 - l; // Invert lightness
  return rgbToHex(...hslToRGB(h, s, l));
}

function selectDistinctColors(colors, count) {
  const distinctColors = [];
  const step = Math.floor(colors.length / count);

  for (let i = 0; i < count; i++) {
    distinctColors.push(colors[i * step]);
  }

  return distinctColors;
}

function generateTheme(colors, isDark) {
  /* This function now supports VS Code themes by including 24 additional colors
     beyond the standard set used in the Kitty terminal theme.
  */

  // Sort colors by luminance
  const sortedColors = [...colors].sort((a, b) => {
    const [, , lA] = rgbToHSL(...hexToRGB(a));
    const [, , lB] = rgbToHSL(...hexToRGB(b));
    return isDark ? lA - lB : lB - lA;
  });

  // Select background and foreground based on theme brightness
  const backgroundIndex = isDark ? 0 : sortedColors.length - 1;
  const foregroundIndex = isDark ? sortedColors.length - 1 : 0;

  const background = sortedColors[backgroundIndex];
  const foreground = sortedColors[foregroundIndex];

  // Select other primary colors for the theme
  const midIndex = Math.floor(sortedColors.length / 2);
  const selection = sortedColors[midIndex];
  const cursor = isDark
    ? sortedColors[Math.floor(midIndex / 2)]
    : sortedColors[Math.floor(midIndex * 1.5)];

  const black = isDark
    ? sortedColors[1]
    : sortedColors[sortedColors.length - 2];
  const white = isDark
    ? sortedColors[sortedColors.length - 2]
    : sortedColors[1];

  // Remove the primary theme colors from the sorted list
  const remainingColors = sortedColors.filter(
    (color) =>
      color !== background &&
      color !== foreground &&
      color !== selection &&
      color !== cursor &&
      color !== black &&
      color !== white,
  );

  // Assign the remaining colors to color1, color2, ..., color24
  const additionalColors = remainingColors.slice(0, 24);
  const additionalColorsMap = additionalColors.reduce((acc, color, index) => {
    acc[`color${index + 1}`] = color;
    return acc;
  }, {});

  // Return the theme object
  return {
    background,
    foreground,
    selection,
    cursor,
    black,
    white,
    ...additionalColorsMap,
  };
}

function generateThemeConfig(theme, isDark) {
  /* theme has total 30 colors */

  const invertIfLight = (color) => isDark ? color : invertLightness(color);

  const vscodeTheme = {
    "$schema": "vscode://schemas/color-theme",
    "name": `WallWiz ${isDark ? "Dark" : "Light"}`,
    "author": "Shubham Singh",
    "maintainers": ["Shubham Singh <ss.dev.me@gmail.com>"],
    "semanticClass": `theme.wallwiz.${isDark ? "dark" : "light"}`,
    "semanticHighlighting": true,

    "wallwiz": {
      "base": [
        theme.background,
        theme.foreground,
        invertIfLight(theme.selection),
        invertIfLight(theme.color3),
        invertIfLight(theme.color4),
        invertIfLight(theme.color5),
        invertIfLight(theme.color6),
        invertIfLight(theme.cursor),
        theme.color1,
        theme.color2,
        theme.color3,
      ],
      "ansi": [
        isDark ? theme.black : theme.white,
        invertIfLight(theme.color1),
        invertIfLight(theme.color2),
        invertIfLight(theme.color3),
        invertIfLight(theme.color4),
        invertIfLight(theme.color5),
        invertIfLight(theme.color6),
        isDark ? theme.white : theme.black,
        adjustColorForReadability(
          theme.background,
          invertIfLight(theme.color1),
        ),
        adjustColorForReadability(
          theme.background,
          invertIfLight(theme.color2),
        ),
        adjustColorForReadability(
          theme.background,
          invertIfLight(theme.color3),
        ),
        adjustColorForReadability(
          theme.background,
          invertIfLight(theme.color4),
        ),
        adjustColorForReadability(
          theme.background,
          invertIfLight(theme.color5),
        ),
        adjustColorForReadability(
          theme.background,
          invertIfLight(theme.color6),
        ),
        adjustColorForReadability(
          theme.background,
          isDark ? theme.white : theme.black,
        ),
        theme.foreground,
      ],
      "brightOther": [
        invertIfLight(theme.color3),
        invertIfLight(theme.color4),
      ],
      "other": [
        theme.background,
        theme.foreground,
        isDark ? theme.black : theme.white,
        invertIfLight(theme.selection),
        theme.color3,
      ],
    },

    "colors": {
      // Terminal Colors
      "terminal.background": theme.background,
      "terminal.foreground": theme.foreground,
      "terminal.ansiBrightBlack": invertIfLight(theme.color3),
      "terminal.ansiBrightRed": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.color1),
      ),
      "terminal.ansiBrightGreen": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.color2),
      ),
      "terminal.ansiBrightYellow": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.color3),
      ),
      "terminal.ansiBrightBlue": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.color4),
      ),
      "terminal.ansiBrightMagenta": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.color5),
      ),
      "terminal.ansiBrightCyan": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.color6),
      ),
      "terminal.ansiBrightWhite": theme.foreground,
      "terminal.ansiBlack": isDark ? theme.black : theme.white,
      "terminal.ansiRed": invertIfLight(theme.color1),
      "terminal.ansiGreen": invertIfLight(theme.color2),
      "terminal.ansiYellow": invertIfLight(theme.color3),
      "terminal.ansiBlue": invertIfLight(theme.color4),
      "terminal.ansiMagenta": invertIfLight(theme.color5),
      "terminal.ansiCyan": invertIfLight(theme.color6),
      "terminal.ansiWhite": isDark ? theme.white : theme.black,

      // Editor Colors
      "editor.background": theme.background,
      "editor.foreground": theme.foreground,
      "editorLineNumber.foreground": invertIfLight(theme.color3),
      "editor.selectionBackground": invertIfLight(theme.selection),
      "editor.selectionHighlightBackground": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.selection),
        0.3,
      ),

      // UI Colors
      "foreground": theme.foreground,
      "focusBorder": invertIfLight(theme.color3),
      "selection.background": invertIfLight(theme.selection),

      // Status Bar
      "statusBar.background": isDark ? theme.black : theme.white,
      "statusBar.foreground": theme.foreground,

      // Activity Bar
      "activityBar.background": isDark ? theme.black : theme.white,
      "activityBar.foreground": theme.foreground,
      "activityBar.inactiveForeground": invertIfLight(theme.color3),

      // Side Bar
      "sideBar.background": isDark ? theme.black : theme.white,
      "sideBar.foreground": theme.foreground,

      // List
      "list.activeSelectionBackground": invertIfLight(theme.selection),
      "list.activeSelectionForeground": theme.foreground,
      "list.hoverBackground": adjustColorForReadability(
        theme.background,
        invertIfLight(theme.selection),
        0.2,
      ),

      // Input
      "input.background": isDark ? theme.black : theme.white,
      "input.foreground": theme.foreground,

      // Button
      "button.background": invertIfLight(theme.cursor),
      "button.foreground": theme.background,

      // Dropdown
      "dropdown.background": isDark ? theme.black : theme.white,
      "dropdown.foreground": theme.foreground,
    },

    "tokenColors": [
      // Comments
      {
        "scope": ["comment", "punctuation.definition.comment"],
        "settings": {
          "foreground": invertIfLight(theme.color3),
          "fontStyle": "italic",
        },
      },
      // Strings
      {
        "scope": ["string"],
        "settings": {
          "foreground": invertIfLight(theme.color2),
        },
      },
      // Keywords
      {
        "scope": ["keyword", "storage.type", "storage.modifier"],
        "settings": {
          "foreground": invertIfLight(theme.color5),
          "fontStyle": "italic",
        },
      },
      // Functions
      {
        "scope": ["entity.name.function", "support.function"],
        "settings": {
          "foreground": invertIfLight(theme.color4),
        },
      },
      // Classes
      {
        "scope": ["entity.name.type", "entity.name.class"],
        "settings": {
          "foreground": invertIfLight(theme.color6),
          "fontStyle": "italic",
        },
      },
      // Variables
      {
        "scope": ["variable", "variable.other.readwrite"],
        "settings": {
          "foreground": theme.foreground,
        },
      },
      // Constants
      {
        "scope": ["constant", "variable.other.constant"],
        "settings": {
          "foreground": invertIfLight(theme.color1),
        },
      },
    ],
  };

  return JSON.stringify(vscodeTheme);
}

function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateThemeConfig(theme, true);
}

function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateThemeConfig(theme, false);
}

function setTheme(themeConfPath) {
  const config = STD.loadFile(themeConfPath);
  const vscodeThemeFile = STD.open(
    HOME_DIR.concat(".vscode/extensions/wallwiz-theme.json"),
    "w",
  );
  if (!vscodeThemeFile) return;
  vscodeThemeFile.puts(config);
  vscodeThemeFile.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
