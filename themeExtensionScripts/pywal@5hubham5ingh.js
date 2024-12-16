/*
 For:            Pywal
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.2

 This is a compatibility script for Pywal.
 It ensures that extensions and applications compatible with Pywal
 also work seamlessly with WallRizz.
 */

export function getDarkThemeConf(colors) {
  const theme = generateTheme(colors, true);
  return generateConfigFiles(theme);
}

export function getLightThemeConf(colors) {
  const theme = generateTheme(colors, false);
  return generateConfigFiles(theme);
}

export function setTheme(
  themeConfPath,
) {
  const pywalCacheDir = HOME_DIR.concat("/.cache/wal");

  // ensure pywalCacheDir directory.
  pywalCacheDir.split("/").forEach((dir, i, path) => {
    if (!dir) return;
    const currPath = path.filter((_, j) => j <= i).join("/");
    const dirStat = OS.stat(currPath)[0];
    if (!dirStat) OS.mkdir(currPath);
  });

  const themeConfig = JSON.parse(STD.loadFile(themeConfPath));

  const textFile = STD.open(pywalCacheDir.concat("/colors"), "w+");
  textFile.puts(themeConfig.colors);
  textFile.close();

  const bashFile = STD.open(pywalCacheDir.concat("/colors.sh"), "w+");
  bashFile.puts(themeConfig["colors.sh"]);
  bashFile.close();

  const jsonFile = STD.open(pywalCacheDir.concat("/colors.json"), "w+");
  jsonFile.puts(themeConfig["colors.json"]);
  jsonFile.close();

  // update firefox theme
  OS.exec(["pywalfox", "update"]);
}

function generateConfigFiles(theme) {
  // Extract the colors and other properties from the theme object
  const colorKeys = Object.keys(theme).filter((key) => key.startsWith("color"));
  const colors = colorKeys.map((key) => theme[key]);

  // Generate the colors file (plain text format)
  const colorsFile = colors.join("\n");

  // Generate the colors.sh file (shell script format)
  const colorsSh = colorKeys
    .map((key, index) => `export ${key}='${colors[index]}'`)
    .join("\n") +
    `\n\nexport background='${theme.background}'\nexport foreground='${theme.foreground}'\nexport cursor='${theme.cursor}'\nwallpaper='/path/to/your/wallpaper.jpg'`;

  // Generate the colors.json file (JSON format)
  const colorsJson = JSON.stringify(
    {
      wallpaper: "/dummy/path/to/wallpaper.jpg",
      special: {
        background: theme.background,
        foreground: theme.foreground,
        cursor: theme.cursor,
      },
      colors: colorKeys.reduce((acc, key, index) => {
        acc[key] = colors[index];
        return acc;
      }, {}),
    },
    null,
    2,
  );

  // Return the generated configuration files
  return JSON.stringify({
    colors: colorsFile,
    "colors.sh": colorsSh,
    "colors.json": colorsJson,
  });
}

/** Helpers */

function generateTheme(colorCodes, isDark) {
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

  const background = pickColor().toHexString();
  const foreground = pickColor().toHexString();
  const cursor = pickColor().toHexString();

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

  const distinctColors = selectDistinctColors(colors, 8);

  return Object.assign(
    {
      background,
      foreground,
      cursor,
    },
    ...distinctColors.map((color, i) => ({
      [`color${i}`]: color.toHexString(),
    })),
    ...distinctColors.map((color, i) => ({
      [`color${i + 8}`]: color.brighten(5).toHexString(),
    })),
  );
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
