/*
 For:            dunst,https://dunst-project.org
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   Dunst must be running for the theme to take effect.

 Note: Remove all the theme colour option from the /.config/dunst/dunstrc,
       as they might overwrite the generated theme.
 */

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
  const frameColor = sortedColors[midIndex];
  const criticalColor = sortedColors[Math.floor(midIndex * 0.75)];

  return {
    background,
    foreground,
    frameColor,
    criticalColor,
  };
}

function getThemeConf(colours, isDark) {
  const theme = generateTheme(colours, isDark);

  const config = `
# WallWiz theme
[global]
frame_color = "${theme.frameColor}"
separator_color = frame

[urgency_low]
background = "${theme.background}"
foreground = "${theme.foreground}"

[urgency_normal]
background = "${theme.background}"
foreground = "${theme.foreground}"

[urgency_critical]
background = "${theme.background}"
foreground = "${theme.foreground}"
frame_color = "${theme.criticalColor}"
# end
  `.trim();

  return config;
}

function getDarkThemeConf(colours) {
  return getThemeConf(colours, true);
}

function getLightThemeConf(colours) {
  return getThemeConf(colours, false);
}

function setTheme(newThemeConfigPath) {
  const dunstConfigPath = HOME_DIR.concat("/.config/dunst/dunstrc");
  const dunstOldConfig = STD.loadFile(dunstConfigPath);
  const newThemeConfig = STD.loadFile(newThemeConfigPath);
  let filterOut = false;
  let updated = false;
  const updatedConfig = dunstOldConfig.split("\n")
    .filter((line) => {
      if (line.includes("# WallWiz theme")) {
        filterOut = true;
        updated = true;
        return false;
      }
      if (filterOut) {
        if (line.includes("# end")) {
          filterOut = false;
          return false;
        }
        return false;
      }
      return true;
    })
    .join("\n") + "\n" + newThemeConfig;

  if (!updated) dunstOldConfig.concat("\n", newThemeConfig);
  const dunstConfig = STD.open(dunstConfigPath, "w+");

  dunstConfig.puts(updatedConfig);
  dunstConfig.close();

  OS.exec(["pkill", "dunst"]);
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
