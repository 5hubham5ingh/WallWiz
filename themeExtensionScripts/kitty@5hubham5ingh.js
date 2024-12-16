/*
 For:            Kitty terminal emulator, https://sw.kovidgoyal.net/kitty/
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.2
 Prerequisite:   For this script to work, enable remote control in the kitty terminal.
                 To enable remote control, start kitty with allow_remote_control=yes.
                 Ex:- kitty allow_remote_control=yes
 */

export function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateThemeConfig(theme);
}

export function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateThemeConfig(theme);
}

export function setTheme(themeConfPath) {
  return execAsync(["kitty", "@", "set-colors", "-a", "-c", themeConfPath]);
}

function generateTheme(colorCodes, isDark = true) {
  const colors = colorCodes.map((c) => Color(c));
  const pickColor = (dark) => {
    // find the dark or light most frequent color index
    const index = colors.findIndex((color) =>
      (dark ?? isDark) ? color.isDark() : color.isLight()
    );

    return index !== -1
      ? colors.splice(index, 1)[0]
      : isDark
      ? Color("black")
      : Color("white");
  };

  const background = pickColor();

  // Ensure visibility of colors against the background color.
  for (const color of colors) {
    while (!Color.isReadable(color, background)) {
      isDark ? color.saturate(1).brighten(1) : color.desaturate(1).darken(1);
    }
  }

  // Ensure there are atleast 8 colors remaining
  while (colors.length < 8) {
    colors.push(
      colors[Math.floor(Math.random() * colors.length)].analogous()[3],
    );
  }

  // create theme
  return Object.assign(
    {
      background,
      foreground: pickColor(false),
      cursor: pickColor(),
    },
    ...selectDistinctColors(colors, 8).map((color, i) => ({
      [`color${i}`]: color,
    })),
  );
}

function generateThemeConfig(theme) {
  // Create a more harmonized color palette
  const config = `
cursor ${theme.color4.toHexString()}
cursor_text_color ${theme.background.toHexString()}
selection_foreground ${theme.background.toHexString()}
selection_background ${theme.color4.lighten().toHexString()}

url_color ${theme.color1.spin(30).toHexString()}
visual_bell_color ${theme.color2.spin(15).toHexString()}
bell_border_color ${theme.color3.desaturate().toHexString()}

active_border_color ${theme.color4.saturate().toHexString()}
inactive_border_color ${theme.color4.desaturate().toHexString()}

foreground ${theme.foreground.toHexString()}
background ${theme.background.darken(5).toHexString()}

active_tab_foreground ${theme.background.lighten(5).toHexString()}
active_tab_background ${theme.foreground.desaturate().toHexString()}
inactive_tab_foreground ${theme.foreground.desaturate().toHexString()}
inactive_tab_background ${theme.background.lighten(5).toHexString()}

color0 ${theme.color0.toHexString()}
color8 ${theme.color0.darken().toHexString()}
color1 ${theme.color1.toHexString()}
color9 ${theme.color1.saturate().toHexString()}
color2 ${theme.color2.toHexString()}
color10 ${theme.color2.spin(10).toHexString()}
color3 ${theme.color3.toHexString()}
color11 ${theme.color3.desaturate().brighten().toHexString()}
color4 ${theme.color4.toHexString()}
color12 ${theme.color4.lighten().toHexString()}
color5 ${theme.color5.toHexString()}
color13 ${theme.color5.spin(10).toHexString()}
color6 ${theme.color6.toHexString()}
color14 ${theme.color6.saturate().toHexString()}
color7 ${theme.color7.toHexString()}
color15 ${theme.color7.lighten().toHexString()}
`.trim();

  return config;
}

function selectDistinctColors(colorObjects, count) {
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

  return selectedColors;
}
