/*
 For:            Btop, https://github.com/aristocratos/btop
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   Edit the ~/.config/btop/btop.conf file to add this line-
                 color_theme = "WallWiz.theme"

 Note: The theme only takes effect after restarting btop.
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

function generateBtopConfig(theme, isDark) {
  const invertIfLight = (color) =>
    isDark ? color : rgbToHex(...hslToRGB(
      ...rgbToHSL(...hexToRGB(color)).map((v, i) => i === 2 ? 100 - v : v),
    ));

  const config = `
# Main background
theme[main_bg]="${theme.background}"

# Main text color
theme[main_fg]="${theme.foreground}"

# Title color for boxes
theme[title]="${theme.foreground}"

# Highlight color for keyboard shortcuts
theme[hi_fg]="${invertIfLight(theme.color1)}"

# Background color of selected items
theme[selected_bg]="${theme.selection}"

# Foreground color of selected items
theme[selected_fg]="${invertIfLight(theme.color3)}"

# Color of inactive/disabled text
theme[inactive_fg]="${theme.black}"

# Color of text appearing on top of graphs
theme[graph_text]="${theme.foreground}"

# Misc colors for processes box
theme[proc_misc]="${invertIfLight(theme.color2)}"

# CPU box outline color
theme[cpu_box]="${theme.selection}"

# Memory/disks box outline color
theme[mem_box]="${theme.selection}"

# Network up/down box outline color
theme[net_box]="${theme.selection}"

# Processes box outline color
theme[proc_box]="${theme.selection}"

# Box divider lines and small box borders
theme[div_line]="${theme.selection}"

# Temperature graph colors
theme[temp_start]="${invertIfLight(theme.color2)}"
theme[temp_mid]="${invertIfLight(theme.color3)}"
theme[temp_end]="${invertIfLight(theme.color1)}"

# CPU graph colors
theme[cpu_start]="${invertIfLight(theme.color2)}"
theme[cpu_mid]="${invertIfLight(theme.color3)}"
theme[cpu_end]="${invertIfLight(theme.color1)}"

# Mem/Disk free meter
theme[free_start]="${invertIfLight(theme.color1)}"
theme[free_mid]="${invertIfLight(theme.color3)}"
theme[free_end]="${invertIfLight(theme.color2)}"

# Mem/Disk cached meter
theme[cached_start]="${invertIfLight(theme.color6)}"
theme[cached_mid]="${invertIfLight(theme.color2)}"
theme[cached_end]="${invertIfLight(theme.color3)}"

# Mem/Disk available meter
theme[available_start]="${invertIfLight(theme.color1)}"
theme[available_mid]="${invertIfLight(theme.color3)}"
theme[available_end]="${invertIfLight(theme.color2)}"

# Mem/Disk used meter
theme[used_start]="${invertIfLight(theme.color2)}"
theme[used_mid]="${invertIfLight(theme.color3)}"
theme[used_end]="${invertIfLight(theme.color1)}"

# Download graph colors
theme[download_start]="${invertIfLight(theme.color2)}"
theme[download_mid]="${invertIfLight(theme.color6)}"
theme[download_end]="${invertIfLight(theme.color4)}"

# Upload graph colors
theme[upload_start]="${invertIfLight(theme.color3)}"
theme[upload_mid]="${invertIfLight(theme.color5)}"
theme[upload_end]="${invertIfLight(theme.color1)}"

# Process box color gradient for threads, mem and cpu usage
theme[process_start]="${invertIfLight(theme.color2)}"
theme[process_mid]="${invertIfLight(theme.color1)}"
theme[process_end]="${invertIfLight(theme.color4)}"
`.trim();

  return config;
}

function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateBtopConfig(theme, true);
}

function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateBtopConfig(theme, false);
}

function setTheme(themeConfPath) {
  const btopThemeConf = STD.open(
    HOME_DIR.concat("/.config/btop/themes/WallWiz.theme"),
    "w+",
  );
  const conf = STD.loadFile(themeConfPath);
  btopThemeConf.puts(conf);
  btopThemeConf.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
