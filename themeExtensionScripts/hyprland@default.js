/*
 For:            Hyprland, https://hyprland.org
 Author:         https://github.com/5hubham5ingh (original)
                 Modified by Claude (improvements based on Kitty script)
 Prerequisite:   Edit the ~/.config/hypr/hyprland.conf file to add this line-
                 source = "WallWizTheme.conf"

 Note: Sourcing the file on top will not override the predefined colours in hyprland.conf.
       So, to override the default theme colours, source the WallWizTheme.conf at the bottom.
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
  const selection = sortedColors[midIndex];
  const cursor = isDark
    ? sortedColors[Math.floor(midIndex / 2)]
    : sortedColors[Math.floor(midIndex * 1.5)];

  // Select 6 distinct colors from the middle of the sorted array
  const middleColors = sortedColors.slice(
    Math.floor(sortedColors.length / 4),
    Math.floor(sortedColors.length * 3 / 4),
  );
  const [color1, color2, color3, color4, color5, color6] = selectDistinctColors(
    middleColors,
    6,
  );

  const black = isDark
    ? sortedColors[1]
    : sortedColors[sortedColors.length - 2];
  const white = isDark
    ? sortedColors[sortedColors.length - 2]
    : sortedColors[1];

  return {
    background,
    foreground,
    selection,
    cursor,
    color1,
    color2,
    color3,
    color4,
    color5,
    color6,
    black,
    white,
  };
}

function generateHyprlandConfig(theme, isDark) {
  const invertIfLight = (color) => isDark ? color : invertLightness(color);

  const config = `
general {
    col.active_border = rgba(${invertIfLight(theme.color3).slice(1)}ee) rgba(${
    invertIfLight(theme.color4).slice(1)
  }ee) 45deg
    col.inactive_border = rgba(${theme.selection.slice(1)}aa)
}

decoration {
    col.shadow = rgba(${theme.black.slice(1)}ee)
    col.shadow_inactive = rgba(${theme.black.slice(1)}aa)
}

misc {
    background_color = rgb(${theme.background.slice(1)})
}

decoration {
    col.shadow_inactive = rgba(${theme.black.slice(1)}aa)
}

# Window rules
windowrulev2 = bordercolor rgba(${
    invertIfLight(theme.color1).slice(1)
  }ee), fullscreen:1
windowrulev2 = bordercolor rgba(${
    invertIfLight(theme.color2).slice(1)
  }ee), floating:1
`.trim();

  return config;
}

function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateHyprlandConfig(theme, true);
}

function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateHyprlandConfig(theme, false);
}

function setTheme(themeConfPath, execAsync) {
  return execAsync(
    ["cat", themeConfPath, ">", "~/.config/hypr/WallWizTheme.conf"],
    { useShell: true },
  );
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
