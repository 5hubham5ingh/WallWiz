/*
 For:            Hyprland, https://hyprland.org
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   Edit the ~/.config/hypr/hyprland.conf file to add this line-
                 source = "WallWizTheme.conf"

 Note: Sourcing the file on top will not override the predefined colours in hyprland.conf.
       So, to override the default theme colours, source the WallWizTheme.conf at the bottom.
*/

function selectDistinctColors(colors, count) {
  const distinctColors = [];
  const step = Math.floor(colors.length / count);

  for (let i = 0; i < count; i++) {
    distinctColors.push(colors[i * step]);
  }

  return distinctColors;
}

function generateTheme(colors, isDark) {
  const sortedColors = colors.sort((a, b) => {
    const la = Color(a).getLuminance();
    const lb = Color(b).getLuminance();
    return isDark ? la - lb : lb - la;
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

function generateHyprlandConfig(theme) {
  const config = `
general {
    col.active_border = ${Color(theme.color3).toRgbString()} ${
    Color(theme.color4).toRgbString()
  } 45deg
    col.inactive_border = ${Color(theme.selection).toRgbString()}
}

decoration {
    col.shadow = ${Color(theme.black).toRgbString()}
    col.shadow_inactive = ${Color(theme.black).toRgbString()}
}

misc {
    background_color = ${Color(theme.background).toRgbString()}
}

decoration {
    col.shadow_inactive = ${Color(theme.black).toRgbString()}
}

# Window rules
windowrulev2 = bordercolor ${Color(theme.color1).toRgbString()}, fullscreen:1
windowrulev2 = bordercolor ${Color(theme.color2).toRgbString()}, floating:1
`.trim();

  return config;
}

function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateHyprlandConfig(theme);
}

function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateHyprlandConfig(theme);
}

function setTheme(themeConfPath) {
  const newConfig = loadFile(themeConfPath);
  const oldConfigPath = getenv("HOME").concat(
    "/.config/hypr/WallWizTheme.conf",
  );
  const oldConfig = open(oldConfigPath, "w+");
  oldConfig.puts(newConfig);
  oldConfig.flush();
  oldConfig.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
