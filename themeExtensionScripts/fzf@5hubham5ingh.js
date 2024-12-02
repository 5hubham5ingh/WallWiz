/*
 For:            fzf, https://junegunn.github.io/fzf
 Author:         https://github.com/5hubham5ingh
 Version:        0.0.1
 Prerequisite:   Shell configuration file. (default: .bashrc)

 Note: The new theme only takes effect in a new shell, or requires
       sourcing the shell configuration file in already running shell.
*/

const SHELL_CONFIG_FILE = "/.bashrc";

function getDarkThemeConf(colours) {
  return getThemeConf(colours, true);
}

function getLightThemeConf(colours) {
  return getThemeConf(colours, false);
}

function setTheme(themeConfig) {
  const fzfConfig = STD.loadFile(themeConfig);
  updateOrAddEnvVar(
    STD.getenv("HOME") + SHELL_CONFIG_FILE,
    "FZF_DEFAULT_OPTS",
    fzfConfig,
  );
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
  const highlight = sortedColors[midIndex];
  const accent = isDark
    ? sortedColors[Math.floor(midIndex / 2)]
    : sortedColors[Math.floor(midIndex * 1.5)];

  const secondary = sortedColors[Math.floor(midIndex * 0.75)];
  const tertiary = sortedColors[Math.floor(midIndex * 1.25)];

  return {
    background,
    foreground,
    highlight,
    accent,
    secondary,
    tertiary,
  };
}

function getThemeConf(colors, isDark = true) {
  const theme = generateTheme(colors, isDark);

  const config = `
    fg:${theme.foreground},
    bg:${theme.background},
    hl:${theme.highlight},
    fg+:${theme.accent},
    bg+:${theme.secondary},
    hl+:${theme.highlight},
    info:${theme.tertiary},
    prompt:${theme.highlight},
    pointer:${theme.accent},
    marker:${theme.accent},
    spinner:${theme.secondary},
    header:${theme.highlight},
    border:${theme.tertiary},
    gutter:${theme.background},
    preview-fg:${theme.foreground},
    preview-bg:${theme.background}
  `.replace(/\n+|\s/g, "").trim();

  return `--color ${config}`;
}

function updateOrAddEnvVar(filePath, variable, value) {
  let fileContent = "";

  const file = STD.open(filePath, "r+");
  fileContent = file.readAsString();

  const regex = new RegExp(`^\\s*export\\s+${variable}="[^"]*"`, "m");
  const newEnvLine = `export ${variable}="${value}"`;

  if (regex.test(fileContent)) {
    fileContent = fileContent.replace(regex, newEnvLine);
  } else {
    fileContent += `\n${newEnvLine}\n`;
  }

  file.puts(fileContent);
  file.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
