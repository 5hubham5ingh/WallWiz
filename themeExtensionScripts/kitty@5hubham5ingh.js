/*
 For:            Kitty terminal emulator, https://sw.kovidgoyal.net/kitty/
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   For this script to work, enable remote control in the kitty terminal.
                 To enable remote control, start kitty with allow_remote_control=yes.
                 Ex:- kitty allow_remote_control=yes
 */

/**
 * Selects distinct colors from an array of colors based on color distance
 * @param {string[]} colors - Array of color hex strings
 * @param {number} count - Number of distinct colors to select
 * @returns {string[]} Array of selected distinct colors
 */
function selectDistinctColors(colors, count) {
  // Convert colors to tinycolor objects
  const colorObjects = colors.map((c) => Color(c));

  // Sort colors by perceived brightness
  const sortedColors = colorObjects.sort((a, b) =>
    a.getBrightness() - b.getBrightness()
  );

  // Select colors with maximum color distance
  const selectedColors = [];
  while (selectedColors.length < count && colorObjects.length > 0) {
    // If first selection, pick from middle of brightness range
    if (selectedColors.length === 0) {
      const midIndex = Math.floor(sortedColors.length / 2);
      selectedColors.push(sortedColors[midIndex]);
      sortedColors.splice(midIndex, 1);
      continue;
    }

    // Find color with maximum distance from previously selected colors
    let maxDistanceColor = null;
    let maxDistance = -1;

    for (let i = 0; i < sortedColors.length; i++) {
      const currentColor = sortedColors[i];
      const minDistance = Math.min(
        ...selectedColors.map((selected) =>
          Color.readability(selected, currentColor)
        ),
      );

      if (minDistance > maxDistance) {
        maxDistance = minDistance;
        maxDistanceColor = currentColor;
      }
    }

    if (maxDistanceColor) {
      selectedColors.push(maxDistanceColor);
      sortedColors.splice(sortedColors.indexOf(maxDistanceColor), 1);
    } else {
      break;
    }
  }

  return selectedColors.map((c) => c.toHexString());
}

/**
 * Generate a Kitty theme from an array of colors
 * @param {string[]} colors - Array of color hex strings
 * @param {boolean} [isDark=true] - Whether to generate a dark or light theme
 * @returns {Object} Generated theme configuration
 */
function generateTheme(colors, isDark = true) {
  // Convert colors to tinycolor objects and sort by brightness
  const colorObjects = colors.map((c) => Color(c));
  const sortedColors = colorObjects.sort((a, b) =>
    isDark
      ? a.getBrightness() - b.getBrightness()
      : b.getBrightness() - a.getBrightness()
  );

  // Select background and foreground
  const backgroundIndex = isDark ? 0 : sortedColors.length - 1;
  const foregroundIndex = isDark ? sortedColors.length - 1 : 0;
  const background = sortedColors[backgroundIndex].toHexString();
  const foreground = sortedColors[foregroundIndex].toHexString();

  // Select middle colors for theme accents
  const midSection = sortedColors.slice(
    Math.floor(sortedColors.length / 4),
    Math.floor(sortedColors.length * 3 / 4),
  );

  // Select distinct colors with good contrast
  const [color1, color2, color3, color4, color5, color6] = selectDistinctColors(
    midSection.map((c) => c.toHexString()),
    6,
  );

  // Cursor and selection colors
  const midIndex = Math.floor(sortedColors.length / 2);
  const selection = sortedColors[midIndex].toHexString();
  const cursor = isDark
    ? sortedColors[Math.floor(midIndex / 2)].toHexString()
    : sortedColors[Math.floor(midIndex * 1.5)].toHexString();

  // Black and white variants
  const black = isDark
    ? sortedColors[1].toHexString()
    : sortedColors[sortedColors.length - 2].toHexString();
  const white = isDark
    ? sortedColors[sortedColors.length - 2].toHexString()
    : sortedColors[1].toHexString();

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

/**
 * Generate Kitty terminal configuration from a theme
 * @param {Object} theme - Theme object from generateTheme
 * @param {boolean} [isDark=true] - Whether the theme is dark or light
 * @returns {string} Kitty configuration string
 */
function generateThemeConfig(theme, isDark = true) {
  // Helper function to adjust color for readability and invert in light mode
  const processColor = (color) => {
    const tc = Color(color);

    // In light mode, increase contrast by darkening
    if (!isDark) {
      return tc.darken(15).toHexString();
    }

    return color;
  };

  // Helper to ensure good contrast with background
  const ensureContrast = (baseColor, bgColor) => {
    const tc = Color(baseColor);
    const bg = Color(bgColor);

    // Adjust color if contrast is too low
    if (Color.readability(tc, bg) < 4.5) {
      return tc.darken(isDark ? 20 : -20).toHexString();
    }

    return tc.toHexString();
  };

  // Configuration template
  const config = `
# Cursor and selection
cursor ${processColor(theme.cursor)}
cursor_text_color ${theme.background}
selection_foreground ${processColor(theme.cursor)}
selection_background ${processColor(theme.selection)}

# URL and bell colors
url_color ${processColor(theme.color1)}
visual_bell_color ${processColor(theme.color2)}
bell_border_color ${processColor(theme.color2)}

# Border colors
active_border_color ${processColor(theme.color3)}
inactive_border_color ${isDark ? theme.black : theme.white}

# Primary colors
foreground ${theme.foreground}
background ${theme.background}

# Tab colors
active_tab_foreground ${isDark ? theme.white : theme.black}
active_tab_background ${processColor(theme.cursor)}
inactive_tab_foreground ${isDark ? theme.white : theme.black}
inactive_tab_background ${isDark ? theme.black : theme.white}

# Color palette
# Black
color0 ${isDark ? theme.black : theme.white}
color8 ${ensureContrast(isDark ? theme.black : theme.white, theme.background)}

# Red
color1 ${processColor(theme.color1)}
color9 ${ensureContrast(processColor(theme.color1), theme.background)}

# Green
color2 ${processColor(theme.color2)}
color10 ${ensureContrast(processColor(theme.color2), theme.background)}

# Yellow
color3 ${processColor(theme.color3)}
color11 ${ensureContrast(processColor(theme.color3), theme.background)}

# Blue
color4 ${processColor(theme.color4)}
color12 ${ensureContrast(processColor(theme.color4), theme.background)}

# Magenta
color5 ${processColor(theme.color5)}
color13 ${ensureContrast(processColor(theme.color5), theme.background)}

# Cyan
color6 ${processColor(theme.color6)}
color14 ${ensureContrast(processColor(theme.color6), theme.background)}

# White
color7 ${isDark ? theme.white : theme.black}
color15 ${ensureContrast(isDark ? theme.white : theme.black, theme.background)}
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

function setTheme(themeConfPath) {
  return execAsync(["kitty", "@", "set-colors", "-a", "-c", themeConfPath]);
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
