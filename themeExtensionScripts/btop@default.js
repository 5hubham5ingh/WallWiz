/*
 For:            Btop, https://github.com/aristocratos/btop
 Author:         https://github.com/5hubham5ingh
 Prerequisite:   Edit the ~/.config/btop/btop.conf file to add this line-
                 color_theme = "WallWiz.theme"

 Note: The theme only takes effect after restarting btop.
*/

import { getenv, loadFile, open } from "std";

// Function to set the btop theme
function setTheme(themeConfPath) {
  const btopThemeConf = open(
    getenv("HOME").concat("/.config/btop/themes/WallWiz.theme"),
    "w+",
  );
  const conf = loadFile(themeConfPath);
  btopThemeConf.puts(conf);
  btopThemeConf.close();
}

// Function to generate the btop theme configuration from given colors
function getThemeConf(colors) {
  if (colors.length < 8) {
    throw new Error("At least 8 colors are required");
  }

  function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
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

  // Sort colors by lightness
  const sortedColors = [...colors].sort((a, b) => {
    const [, , lA] = hexToHSL(a);
    const [, , lB] = hexToHSL(b);
    return lA - lB;
  });

  const darkestColor = sortedColors[0];
  const lightestColor = sortedColors[sortedColors.length - 1];
  const midColor = sortedColors[Math.floor(sortedColors.length / 2)];

  // Find vibrant colors for different hues
  const vibrantColors = colors.filter((color) => {
    const [, s, l] = hexToHSL(color);
    return s > 50 && l > 30 && l < 70;
  });

  const colorPool = vibrantColors.length >= 6 ? vibrantColors : colors;

  function findColorByHue(startHue, endHue, fallback) {
    return (
      colorPool.find((color) => {
        const [h] = hexToHSL(color);
        return startHue <= endHue
          ? h >= startHue && h < endHue
          : h >= startHue || h < endHue;
      }) || fallback
    );
  }

  const redColor = findColorByHue(330, 30, colorPool[0]);
  const greenColor = findColorByHue(90, 150, colorPool[1]);
  const blueColor = findColorByHue(210, 270, colorPool[2]);
  const yellowColor = findColorByHue(30, 90, colorPool[3]);
  const magentaColor = findColorByHue(270, 330, colorPool[4]);
  const cyanColor = findColorByHue(150, 210, colorPool[5]);

  const theme = `
# Main background
theme[main_bg]="${darkestColor}"

# Main text color
theme[main_fg]="${lightestColor}"

# Title color for boxes
theme[title]="${lightestColor}"

# Highlight color for keyboard shortcuts
theme[hi_fg]="${redColor}"

# Background color of selected items
theme[selected_bg]="${midColor}"

# Foreground color of selected items
theme[selected_fg]="${yellowColor}"

# Color of inactive/disabled text
theme[inactive_fg]="${darkestColor}"

# Color of text appearing on top of graphs
theme[graph_text]="${lightestColor}"

# Misc colors for processes box (includes mini CPU graphs, memory graphs, etc.)
theme[proc_misc]="${greenColor}"

# CPU box outline color
theme[cpu_box]="${midColor}"

# Memory/disks box outline color
theme[mem_box]="${midColor}"

# Network up/down box outline color
theme[net_box]="${midColor}"

# Processes box outline color
theme[proc_box]="${midColor}"

# Box divider lines and small box borders
theme[div_line]="${midColor}"

# Temperature graph gradient
theme[temp_start]="${greenColor}"
theme[temp_mid]="${yellowColor}"
theme[temp_end]="${redColor}"

# CPU graph gradient
theme[cpu_start]="${greenColor}"
theme[cpu_mid]="${yellowColor}"
theme[cpu_end]="${redColor}"

# Memory/Disk free meter gradient
theme[free_start]="${redColor}"
theme[free_mid]="${yellowColor}"
theme[free_end]="${greenColor}"

# Memory/Disk cached meter gradient
theme[cached_start]="${cyanColor}"
theme[cached_mid]="${greenColor}"
theme[cached_end]="${yellowColor}"

# Memory/Disk available meter gradient
theme[available_start]="${redColor}"
theme[available_mid]="${yellowColor}"
theme[available_end]="${greenColor}"

# Memory/Disk used meter gradient
theme[used_start]="${greenColor}"
theme[used_mid]="${yellowColor}"
theme[used_end]="${redColor}"

# Download graph gradient
theme[download_start]="${greenColor}"
theme[download_mid]="${cyanColor}"
theme[download_end]="${blueColor}"

# Upload graph gradient
theme[upload_start]="${yellowColor}"
theme[upload_mid]="${magentaColor}"
theme[upload_end]="${redColor}"

# Process box color gradient for threads, memory, and CPU usage
theme[process_start]="${greenColor}"
theme[process_mid]="${redColor}"
theme[process_end]="${blueColor}"`
    .trim();

  return theme;
}

export { getThemeConf, setTheme };
