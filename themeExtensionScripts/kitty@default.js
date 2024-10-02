/*
 For:            Kitty terminal emulator, https://sw.kovidgoyal.net/kitty/
 Author:         https://github.com/5hubham5ingh
 Prerequisite:   For this script to work, enable remote control in the kitty terminal.
                 To enable remote control, start kitty with allow_remote_control=yes.
                 Ex:- -o kitty allow_remote_control=yes
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

function adjustColorForReadability(baseColor, textColor, minContrast = 4.5) {
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

function findColorByHue(
  colors,
  targetHue,
  saturationThreshold = 20,
  lightnessThreshold = 20,
) {
  return colors.reduce((best, color) => {
    const [h, s, l] = rgbToHSL(...hexToRGB(color));
    const hueDiff = Math.min(
      Math.abs(h - targetHue),
      360 - Math.abs(h - targetHue),
    );
    if (s > saturationThreshold && l > lightnessThreshold && l < 80) {
      if (!best || hueDiff < best.hueDiff) {
        return { color, hueDiff };
      }
    }
    return best;
  }, null)?.color;
}

function invertLightness(hex) {
  let [h, s, l] = rgbToHSL(...hexToRGB(hex));
  l = 100 - l; // Invert lightness
  return rgbToHex(...hslToRGB(h, s, l));
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

  const red = findColorByHue(colors, 0) || "#cc241d";
  const green = findColorByHue(colors, 120) || "#98971a";
  const yellow = findColorByHue(colors, 60) || "#d79921";
  const blue = findColorByHue(colors, 240) || "#458588";
  const purple = findColorByHue(colors, 300) || "#b16286";
  const aqua = findColorByHue(colors, 180) || "#689d6a";

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
    red,
    green,
    yellow,
    blue,
    purple,
    aqua,
    black,
    white,
  };
}

function generateThemeConfig(theme, isDark) {
  const invertIfLight = (color) => isDark ? color : invertLightness(color);

  const config = `
cursor ${invertIfLight(theme.cursor)}
cursor_text_color ${theme.background}

url_color ${invertIfLight(theme.blue)}

visual_bell_color ${invertIfLight(theme.green)}
bell_border_color ${invertIfLight(theme.green)}

active_border_color ${invertIfLight(theme.purple)}
inactive_border_color ${isDark ? theme.black : theme.white}

foreground ${theme.foreground}
background ${theme.background}
selection_foreground ${invertIfLight(theme.cursor)}
selection_background ${invertIfLight(theme.selection)}

active_tab_foreground ${isDark ? theme.white : theme.black}
active_tab_background ${theme.cursor}
inactive_tab_foreground ${isDark ? theme.white : theme.black}
inactive_tab_background ${isDark ? theme.black : theme.white}

# black
color0 ${isDark ? theme.black : theme.white}
color8 ${
    adjustColorForReadability(
      theme.background,
      isDark ? theme.black : theme.white,
    )
  }

# red
color1 ${invertIfLight(theme.red)}
color9 ${adjustColorForReadability(theme.background, invertIfLight(theme.red))}

# green
color2 ${invertIfLight(theme.green)}
color10 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.green))
  }

# yellow
color3 ${invertIfLight(theme.yellow)}
color11 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.yellow))
  }

# blue
color4 ${invertIfLight(theme.blue)}
color12 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.blue))
  }

# purple
color5 ${invertIfLight(theme.purple)}
color13 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.purple))
  }

# aqua
color6 ${invertIfLight(theme.aqua)}
color14 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.aqua))
  }

# white
color7 ${isDark ? theme.white : theme.black}
color15 ${
    adjustColorForReadability(
      theme.background,
      isDark ? theme.white : theme.black,
    )
  }
`.trim();

  return config;
}

function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateThemeConfig(theme, true);
}

function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateThemeConfig(theme, false);
}

function setTheme(themeConfPath, execAsync) {
  return execAsync(["kitty", "@", "set-colors", "-a", "-c", themeConfPath]);
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
