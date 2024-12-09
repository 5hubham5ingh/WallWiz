/*
 For:            Hyprland, https://hyprland.org
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   Edit the ~/.config/hypr/hyprland.conf file to add this line-
                 source = "WallRizzTheme.conf"

 Note: Sourcing the file on top will not override the predefined colours in hyprland.conf.
       So, to override the default theme colours, source the WallRizzTheme.conf at the bottom.
*/

function calculateColorHarmony(baseColor) {
  const tinyBase = Color(baseColor);

  // Advanced color harmony calculations
  return {
    complementary: tinyBase.complement().toHexString(),
    splitCompplementary: [
      tinyBase.spin(150).toHexString(),
      tinyBase.spin(210).toHexString(),
    ],
    analogous: [
      tinyBase.spin(-30).toHexString(),
      tinyBase.spin(30).toHexString(),
    ],
    triadic: [
      tinyBase.spin(120).toHexString(),
      tinyBase.spin(240).toHexString(),
    ],
  };
}

function selectColorPalette(colors, isDark) {
  // Analyze color properties
  const colorAnalysis = colors.map((color) => {
    const tinyColor = Color(color);
    return {
      original: color,
      hue: tinyColor.toHsl().h,
      saturation: tinyColor.toHsl().s,
      luminance: tinyColor.getLuminance(),
      brightness: tinyColor.getBrightness(),
    };
  });

  const sortedColors = colorAnalysis.sort((a, b) => {
    // Prioritize colors with balanced properties
    const scoreA = Math.abs(a.saturation - 0.5) * 2 +
      Math.abs(a.luminance - (isDark ? 0.2 : 0.8));
    const scoreB = Math.abs(b.saturation - 0.5) * 2 +
      Math.abs(b.luminance - (isDark ? 0.2 : 0.8));

    return scoreA - scoreB;
  });

  return sortedColors.map((color) => color.original);
}

function generateTheme(colors, isDark = true) {
  // Ensure we have enough colors
  if (colors.length < 10) {
    throw new Error("Insufficient colors for theme generation");
  }

  // Select and analyze color palette
  const sortedColors = selectColorPalette(colors, isDark);

  // Create color harmony groups
  const baseColor = sortedColors[Math.floor(sortedColors.length / 2)];
  const harmony = calculateColorHarmony(baseColor);

  // Refined color selection
  const background = isDark
    ? Color(sortedColors[0]).darken(10).toHexString()
    : Color(sortedColors[sortedColors.length - 1]).lighten(10).toHexString();

  const foreground = isDark
    ? Color(sortedColors[sortedColors.length - 1]).lighten(20).toHexString()
    : Color(sortedColors[0]).darken(20).toHexString();

  return {
    background,
    foreground,
    // Use color harmony for more coherent color selection
    selection: harmony.complementary,
    cursor: harmony.splitCompplementary[0],

    // Distributed accent colors from harmony groups
    color1: harmony.analogous[0],
    color2: harmony.analogous[1],
    color3: harmony.triadic[0],
    color4: harmony.triadic[1],
    color5: harmony.splitCompplementary[1],
    color6: baseColor,

    black: isDark
      ? Color(sortedColors[1]).darken(20).toHexString()
      : Color(sortedColors[sortedColors.length - 2]).lighten(20).toHexString(),

    white: isDark
      ? Color(sortedColors[sortedColors.length - 2]).lighten(30).toHexString()
      : Color(sortedColors[1]).darken(30).toHexString(),
  };
}

function generateHyprlandConfig(theme) {
  const config = `
general {
  # Active border with gradient and angle for visual depth
  col.active_border = rgb(${
    Color(theme.color4).setAlpha(0.7).toHexString().substring(1)
  }) rgb(${theme.color3.substring(1)}) 45deg
  
  # Inactive border with reduced saturation
  col.inactive_border = rgb(${
    Color(theme.selection).desaturate(30).toHexString().substring(1)
  })
  
  col.nogroup_border = rgb(${theme.color1.substring(1)})
  col.nogroup_border_active = rgb(${theme.color2.substring(1)})
}

decoration {
  # Subtle, slightly transparent shadow
  col.shadow = rgba(${
    Color(theme.black).setAlpha(0.4).toRgbString().replace(/^rgba?\(/, "")
      .replace(/\)$/, "")
  })
  col.shadow_inactive = rgba(${
    Color(theme.black).setAlpha(0.2).toRgbString().replace(/^rgba?\(/, "")
      .replace(/\)$/, "")
  })
}

group {
  col.border_active = rgb(${theme.color5.substring(1)})
  col.border_inactive = rgb(${theme.color6.substring(1)})
  col.border_locked_active = rgb(${theme.color1.substring(1)})
  col.border_locked_inactive = rgb(${theme.color2.substring(1)})
  
  groupbar {
    text_color = rgb(${theme.foreground.substring(1)})
    col.active = rgb(${theme.color3.substring(1)})
    col.inactive = rgb(${theme.color4.substring(1)})
    col.locked_active = rgb(${theme.color5.substring(1)})
    col.locked_inactive = rgb(${theme.color6.substring(1)})
  }
}

misc {
  # Background with slight variation
  background_color = rgb(${theme.background.substring(1)})
  
  # Splash color with intentional harmony
  col.splash = rgb(${theme.cursor.substring(1)})
}
`.trim();

  return config;
}

const getDarkThemeConf = (colors) =>
  generateHyprlandConfig(generateTheme(colors, true));

const getLightThemeConf = (colors) =>
  generateHyprlandConfig(generateTheme(colors, false));

function setTheme(themeConfPath) {
  const newConfig = STD.loadFile(themeConfPath);
  const oldConfigPath = HOME_DIR.concat(
    "/.config/hypr/WallRizzTheme.conf",
  );
  const oldConfig = STD.open(oldConfigPath, "w+");
  oldConfig.puts(newConfig);
  oldConfig.flush();
  oldConfig.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
