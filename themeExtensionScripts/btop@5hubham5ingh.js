/*
 For:            Btop, https://github.com/aristocratos/btop
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   Edit the ~/.config/btop/btop.conf file to add this line-
                 color_theme = "WallRizz.theme"

 Note: The theme only takes effect after restarting btop.
*/

function generateTheme(colors, isDark) {
  const sortedColors = colors.sort((a, b) => {
    const la = Color(a).getLuminance();
    const lb = Color(b).getLuminance();
    return isDark ? la - lb : lb - la;
  });

  const background = sortedColors[0];
  const foreground = sortedColors[colors.length - 1];

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

  return Object.assign(
    {
      background,
      foreground,
      selection,
      cursor,
      black,
      white,
    },
    ...sortedColors.filter(
      (color) =>
        color !== selection ||
        color !== cursor,
    )
      .map((color, i) => ({
        [`color${i + 1}`]: adjustColorForReadability(background, color),
      })),
  );
}

function adjustColorForReadability(background, foreground) {
  const fg = Color(foreground);
  while (!Color.isReadable(background, foreground)) {
    fg.brighten(1).saturate(1);
    const hex = fg.toHex();
    if (hex === "000000" || hex === "ffffff") {
      return Color(foreground).brighten().saturate().toHexString();
    }
  }

  return fg.toHexString();
}

function generateBtopConfig(theme) {
  const config = `
# Main background
theme[main_bg]="${theme.background}"

# Main text color
theme[main_fg]="${theme.foreground}"

# Title color for boxes
theme[title]="${theme.foreground}"

# Highlight color for keyboard shortcuts
theme[hi_fg]="${theme.color1}"

# Background color of selected items
theme[selected_bg]="${theme.selection}"

# Foreground color of selected items
theme[selected_fg]="${theme.color3}"

# Color of inactive/disabled text
theme[inactive_fg]="${theme.black}"

# Color of text appearing on top of graphs
theme[graph_text]="${theme.foreground}"

# Misc colors for processes box
theme[proc_misc]="${theme.color2}"

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
theme[temp_start]="${theme.color2}"
theme[temp_mid]="${theme.color3}"
theme[temp_end]="${theme.color1}"

# CPU graph colors
theme[cpu_start]="${theme.color2}"
theme[cpu_mid]="${theme.color3}"
theme[cpu_end]="${theme.color1}"

# Mem/Disk free meter
theme[free_start]="${theme.color1}"
theme[free_mid]="${theme.color3}"
theme[free_end]="${theme.color2}"

# Mem/Disk cached meter
theme[cached_start]="${theme.color6}"
theme[cached_mid]="${theme.color2}"
theme[cached_end]="${theme.color3}"

# Mem/Disk available meter
theme[available_start]="${theme.color1}"
theme[available_mid]="${theme.color3}"
theme[available_end]="${theme.color2}"

# Mem/Disk used meter
theme[used_start]="${theme.color2}"
theme[used_mid]="${theme.color3}"
theme[used_end]="${theme.color1}"

# Download graph colors
theme[download_start]="${theme.color2}"
theme[download_mid]="${theme.color6}"
theme[download_end]="${theme.color4}"

# Upload graph colors
theme[upload_start]="${theme.color3}"
theme[upload_mid]="${theme.color5}"
theme[upload_end]="${theme.color1}"

# Process box color gradient for threads, mem and cpu usage
theme[process_start]="${theme.color2}"
theme[process_mid]="${theme.color1}"
theme[process_end]="${theme.color4}"
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
    HOME_DIR.concat("/.config/btop/themes/WallRizz.theme"),
    "w+",
  );
  const conf = STD.loadFile(themeConfPath);
  btopThemeConf.puts(conf);
  btopThemeConf.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
