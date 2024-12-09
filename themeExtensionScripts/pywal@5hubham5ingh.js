/*
 For:            Pywal
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1

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
    `\n\nexport background='${theme.background}'\nexport foreground='${theme.foreground}'\nexport cursor='${theme.cursor}'`;

  // Generate the colors.json file (JSON format)
  const colorsJson = JSON.stringify(
    {
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
