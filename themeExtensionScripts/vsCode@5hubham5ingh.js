/*
 For:            Visual studio code
 Author:         https://github.com/5hubham5ingh
 Prerequisite:   Installed and enabled WallWiz-theme in vscode from vscode marketplace.
 */

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHSL(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
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

function hslToRGB(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function calculateContrast(rgb1, rgb2) {
  const luminance = (rgb) => {
    const a = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function adjustColorForReadability(baseColor, textColor, minContrast = 4.5) {
  let rgb1 = hexToRGB(baseColor);
  let rgb2 = hexToRGB(textColor);
  let hsl2 = rgbToHSL(...rgb2);

  const maxIterations = 20;
  let iterations = 0;

  while (
    calculateContrast(rgb1, rgb2) < minContrast && iterations < maxIterations
  ) {
    if (hsl2[2] > 50) {
      hsl2[2] = Math.min(hsl2[2] + 5, 95);
    } else {
      hsl2[2] = Math.max(hsl2[2] - 5, 5);
    }
    rgb2 = hslToRGB(...hsl2);
    iterations++;
  }

  if (calculateContrast(rgb1, rgb2) < minContrast) {
    const bgLuminance = rgbToHSL(...rgb1)[2];
    return bgLuminance > 50 ? "#000000" : "#ffffff";
  }

  return rgbToHex(...rgb2);
}

function invertLightness(hex) {
  let [h, s, l] = rgbToHSL(...hexToRGB(hex));
  l = 100 - l; // Invert lightness
  return rgbToHex(...hslToRGB(h, s, l));
}

function selectDistinctColors(colors, count) {
  const distinctColors = [];
  const step = Math.floor(colors.length / count);

  for (let i = 0; i < count; i++) {
    distinctColors.push(colors[i * step]);
  }

  return distinctColors;
}

function generateTheme(colors, isDark) {
  /* This function now supports VS Code themes by including 24 additional colors
     beyond the standard set used in the Kitty terminal theme.
  */

  // Sort colors by luminance
  const sortedColors = [...colors].sort((a, b) => {
    const [, , lA] = rgbToHSL(...hexToRGB(a));
    const [, , lB] = rgbToHSL(...hexToRGB(b));
    return isDark ? lA - lB : lB - lA;
  });

  // Select background and foreground based on theme brightness
  const backgroundIndex = isDark ? 0 : sortedColors.length - 1;
  const foregroundIndex = isDark ? sortedColors.length - 1 : 0;

  const background = sortedColors[backgroundIndex];
  const foreground = sortedColors[foregroundIndex];

  // Select other primary colors for the theme
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

  // Remove the primary theme colors from the sorted list
  const remainingColors = sortedColors.filter(
    (color) =>
      color !== background &&
      color !== foreground &&
      color !== selection &&
      color !== cursor &&
      color !== black &&
      color !== white,
  );

  // Assign the remaining colors to color1, color2, ..., color24
  const additionalColors = remainingColors.slice(0, 24);
  const additionalColorsMap = additionalColors.reduce((acc, color, index) => {
    acc[`color${index + 1}`] = color;
    return acc;
  }, {});

  // Return the theme object
  return {
    background,
    foreground,
    selection,
    cursor,
    black,
    white,
    ...additionalColorsMap,
  };
}

function generateThemeConfig(theme, isDark) {
  /* theme has total 30 colors */

  const invertIfLight = (color) => isDark ? color : invertLightness(color);

  /* example kitty terminal emulator config */
  const config = `
cursor ${invertIfLight(theme.cursor)}
cursor_text_color ${theme.background}

url_color ${invertIfLight(theme.color1)}

visual_bell_color ${invertIfLight(theme.color2)}
bell_border_color ${invertIfLight(theme.color2)}

active_border_color ${invertIfLight(theme.color3)}
inactive_border_color ${isDark ? theme.black : theme.white}

foreground ${theme.foreground}
background ${theme.background}
selection_foreground ${invertIfLight(theme.cursor)}
selection_background ${invertIfLight(theme.selection)}

active_tab_foreground ${isDark ? theme.white : theme.black}
active_tab_background ${invertIfLight(theme.cursor)}
inactive_tab_foreground ${isDark ? theme.white : theme.black}
inactive_tab_background ${isDark ? theme.black : theme.white}

# black
color0 ${isDark ? theme.black : theme.white}
color8 ${
    adjustColorForReadability(
      theme.background,
      isDark ? theme.black : theme.white,
    )
  }

# color1
color1 ${invertIfLight(theme.color1)}
color9 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.color1))
  }

# color2
color2 ${invertIfLight(theme.color2)}
color10 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.color2))
  }

# color3
color3 ${invertIfLight(theme.color3)}
color11 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.color3))
  }

# color4
color4 ${invertIfLight(theme.color4)}
color12 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.color4))
  }

# color5
color5 ${invertIfLight(theme.color5)}
color13 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.color5))
  }

# color6
color6 ${invertIfLight(theme.color6)}
color14 ${
    adjustColorForReadability(theme.background, invertIfLight(theme.color6))
  }

# white
color7 ${isDark ? theme.white : theme.black}
color15 ${
    adjustColorForReadability(
      theme.background,
      isDark ? theme.white : theme.black,
    )
  }
`.trim();

  /* modify theme object to include colors from the theme */
  const vscodeTheme = {
    "$schema": "vscode://schemas/color-theme",
    "name": "WallWiz",
    "author": "Shubham Singh",
    "maintainers": ["Shubham Singh <ss.dev.me@gmail.com>"],
    "semanticClass": "theme.wallwiz",
    "semanticHighlighting": true,
    "wallwiz": {
      "base": [
        "#282A36",
        "#F8F8F2",
        "#44475A",
        "#6272A4",
        "#8BE9FD",
        "#50FA7B",
        "#FFB86C",
        "#FF79C6",
        "#BD93F9",
        "#FF5555",
        "#F1FA8C",
      ],
      "ansi": [
        "#21222C",
        "#FF5555",
        "#50FA7B",
        "#F1FA8C",
        "#BD93F9",
        "#FF79C6",
        "#8BE9FD",
        "#F8F8F2",
        "#6272A4",
        "#FF6E6E",
        "#69FF94",
        "#FFFFA5",
        "#D6ACFF",
        "#FF92DF",
        "#A4FFFF",
        "#FFFFFF",
      ],
      "brightOther": ["#E9F284", "#8BE9FE"],
      "other": [
        "#44475A75",
        "#FFFFFF1A",
        "#FFFFFF",
        "#44475A70",
        "#424450",
        "#343746",
        "#21222C",
        "#191A21",
      ],
    },
    "colors": {
      "terminal.background": "#282A36",
      "terminal.foreground": "#F8F8F2",
      "terminal.ansiBrightBlack": "#6272A4",
      "terminal.ansiBrightRed": "#FF6E6E",
      "terminal.ansiBrightGreen": "#69FF94",
      "terminal.ansiBrightYellow": "#FFFFA5",
      "terminal.ansiBrightBlue": "#D6ACFF",
      "terminal.ansiBrightMagenta": "#FF92DF",
      "terminal.ansiBrightCyan": "#A4FFFF",
      "terminal.ansiBrightWhite": "#FFFFFF",
      "terminal.ansiBlack": "#21222C",
      "terminal.ansiRed": "#FF5555",
      "terminal.ansiGreen": "#50FA7B",
      "terminal.ansiYellow": "#F1FA8C",
      "terminal.ansiBlue": "#BD93F9",
      "terminal.ansiMagenta": "#FF79C6",
      "terminal.ansiCyan": "#8BE9FD",
      "terminal.ansiWhite": "#F8F8F2",
      "focusBorder": "#6272A4",
      "foreground": "#F8F8F2",
      "selection.background": "#BD93F9",
      "errorForeground": "#FF5555",
      "button.background": "#44475A",
      "button.foreground": "#F8F8F2",
      "button.secondaryBackground": "#282A36",
      "button.secondaryForeground": "#F8F8F2",
      "button.secondaryHoverBackground": "#343746",
      "dropdown.background": "#343746",
      "dropdown.border": "#191A21",
      "dropdown.foreground": "#F8F8F2",
      "input.background": "#282A36",
      "input.foreground": "#F8F8F2",
      "input.border": "#191A21",
      "input.placeholderForeground": "#6272A4",
      "inputOption.activeBorder": "#BD93F9",
      "inputValidation.infoBorder": "#FF79C6",
      "inputValidation.warningBorder": "#FFB86C",
      "inputValidation.errorBorder": "#FF5555",
      "badge.foreground": "#F8F8F2",
      "badge.background": "#44475A",
      "progressBar.background": "#FF79C6",
      "list.activeSelectionBackground": "#44475A",
      "list.activeSelectionForeground": "#F8F8F2",
      "list.dropBackground": "#44475A",
      "list.focusBackground": "#44475A75",
      "list.highlightForeground": "#8BE9FD",
      "list.hoverBackground": "#44475A75",
      "list.inactiveSelectionBackground": "#44475A75",
      "list.warningForeground": "#FFB86C",
      "list.errorForeground": "#FF5555",
      "activityBar.background": "#343746",
      "activityBar.inactiveForeground": "#6272A4",
      "activityBar.foreground": "#F8F8F2",
      "activityBar.activeBorder": "#FF79C680",
      "activityBar.activeBackground": "#BD93F910",
      "activityBarBadge.background": "#FF79C6",
      "activityBarBadge.foreground": "#F8F8F2",
      "sideBar.background": "#21222C",
      "sideBarTitle.foreground": "#F8F8F2",
      "sideBarSectionHeader.background": "#282A36",
      "sideBarSectionHeader.border": "#191A21",
      "editorGroup.border": "#BD93F9",
      "editorGroup.dropBackground": "#44475A70",
      "editorGroupHeader.tabsBackground": "#191A21",
      "tab.activeBackground": "#282A36",
      "tab.activeForeground": "#F8F8F2",
      "tab.border": "#191A21",
      "tab.activeBorderTop": "#FF79C680",
      "tab.inactiveBackground": "#21222C",
      "tab.inactiveForeground": "#6272A4",
      "editor.foreground": "#F8F8F2",
      "editor.background": "#282A36",
      "editorLineNumber.foreground": "#6272A4",
      "editor.selectionBackground": "#44475A",
      "editor.selectionHighlightBackground": "#424450a1",
      "editor.foldBackground": "#21222C80",
      "editor.wordHighlightBackground": "#8BE9FD50",
      "editor.wordHighlightStrongBackground": "#50FA7B50",
      "editor.findMatchBackground": "#FFB86C80",
      "editor.findMatchHighlightBackground": "#FFFFFF40",
      "editor.findRangeHighlightBackground": "#44475A75",
      "editor.hoverHighlightBackground": "#8BE9FD50",
      "editor.lineHighlightBorder": "#44475A",
      "editorLink.activeForeground": "#8BE9FD",
      "editor.rangeHighlightBackground": "#BD93F915",
      "editor.snippetTabstopHighlightBackground": "#282A36",
      "editor.snippetTabstopHighlightBorder": "#6272A4",
      "editor.snippetFinalTabstopHighlightBackground": "#282A36",
      "editor.snippetFinalTabstopHighlightBorder": "#50FA7B",
      "editorWhitespace.foreground": "#FFFFFF1A",
      "editorIndentGuide.background1": "#FFFFFF1A",
      "editorIndentGuide.activeBackground1": "#FFFFFF45",
      "editorRuler.foreground": "#FFFFFF1A",
      "editorCodeLens.foreground": "#6272A4",
      "editorBracketHighlight.foreground1": "#F8F8F2",
      "editorBracketHighlight.foreground2": "#FF79C6",
      "editorBracketHighlight.foreground3": "#8BE9FD",
      "editorBracketHighlight.foreground4": "#50FA7B",
      "editorBracketHighlight.foreground5": "#BD93F9",
      "editorBracketHighlight.foreground6": "#FFB86C",
      "editorBracketHighlight.unexpectedBracket.foreground": "#FF5555",
      "editorOverviewRuler.border": "#191A21",
      "editorOverviewRuler.selectionHighlightForeground": "#ffb86cb0",
      "editorOverviewRuler.wordHighlightForeground": "#8be8fdab",
      "editorOverviewRuler.wordHighlightStrongForeground": "#50fa7aaf",
      "editorOverviewRuler.modifiedForeground": "#8BE9FD80",
      "editorOverviewRuler.addedForeground": "#50FA7B80",
      "editorOverviewRuler.deletedForeground": "#FF555580",
      "editorOverviewRuler.errorForeground": "#FF555580",
      "editorOverviewRuler.warningForeground": "#FFB86C80",
      "editorOverviewRuler.infoForeground": "#8BE9FD80",
      "editorError.foreground": "#FF5555",
      "editorWarning.foreground": "#8BE9FD",
      "editorGutter.modifiedBackground": "#8BE9FD80",
      "editorGutter.addedBackground": "#50FA7B80",
      "editorGutter.deletedBackground": "#FF555580",
      "gitDecoration.modifiedResourceForeground": "#8BE9FD",
      "gitDecoration.deletedResourceForeground": "#FF5555",
      "gitDecoration.untrackedResourceForeground": "#50FA7B",
      "gitDecoration.ignoredResourceForeground": "#6272A4",
      "gitDecoration.conflictingResourceForeground": "#FFB86C",
      "diffEditor.insertedTextBackground": "#50FA7B20",
      "diffEditor.removedTextBackground": "#FF555550",
      "editorWidget.background": "#21222C",
      "editorSuggestWidget.background": "#21222C",
      "editorSuggestWidget.foreground": "#F8F8F2",
      "editorSuggestWidget.selectedBackground": "#44475A",
      "editorHoverWidget.background": "#282A36",
      "editorHoverWidget.border": "#6272A4",
      "editorMarkerNavigation.background": "#21222C",
      "peekView.border": "#44475A",
      "peekViewEditor.background": "#282A36",
      "peekViewEditor.matchHighlightBackground": "#F1FA8C80",
      "peekViewResult.background": "#21222C",
      "peekViewResult.fileForeground": "#F8F8F2",
      "peekViewResult.lineForeground": "#F8F8F2",
      "peekViewResult.matchHighlightBackground": "#F1FA8C80",
      "peekViewResult.selectionBackground": "#44475A",
      "peekViewResult.selectionForeground": "#F8F8F2",
      "peekViewTitle.background": "#191A21",
      "peekViewTitleDescription.foreground": "#6272A4",
      "peekViewTitleLabel.foreground": "#F8F8F2",
      "merge.currentHeaderBackground": "#50FA7B90",
      "merge.incomingHeaderBackground": "#BD93F990",
      "editorOverviewRuler.currentContentForeground": "#50FA7B",
      "editorOverviewRuler.incomingContentForeground": "#BD93F9",
      "panel.background": "#282A36",
      "panel.border": "#BD93F9",
      "panelTitle.activeBorder": "#FF79C6",
      "panelTitle.activeForeground": "#F8F8F2",
      "panelTitle.inactiveForeground": "#6272A4",
      "statusBar.background": "#191A21",
      "statusBar.foreground": "#F8F8F2",
      "statusBar.debuggingBackground": "#FF5555",
      "statusBar.debuggingForeground": "#191A21",
      "statusBar.noFolderBackground": "#191A21",
      "statusBar.noFolderForeground": "#F8F8F2",
      "statusBarItem.prominentBackground": "#FF5555",
      "statusBarItem.prominentHoverBackground": "#FFB86C",
      "statusBarItem.remoteForeground": "#282A36",
      "statusBarItem.remoteBackground": "#BD93F9",
      "titleBar.activeBackground": "#21222C",
      "titleBar.activeForeground": "#F8F8F2",
      "titleBar.inactiveBackground": "#191A21",
      "titleBar.inactiveForeground": "#6272A4",
      "extensionButton.prominentForeground": "#F8F8F2",
      "extensionButton.prominentBackground": "#50FA7B90",
      "extensionButton.prominentHoverBackground": "#50FA7B60",
      "pickerGroup.border": "#BD93F9",
      "pickerGroup.foreground": "#8BE9FD",
      "debugToolBar.background": "#21222C",
      "walkThrough.embeddedEditorBackground": "#21222C",
      "settings.headerForeground": "#F8F8F2",
      "settings.modifiedItemIndicator": "#FFB86C",
      "settings.dropdownBackground": "#21222C",
      "settings.dropdownForeground": "#F8F8F2",
      "settings.dropdownBorder": "#191A21",
      "settings.checkboxBackground": "#21222C",
      "settings.checkboxForeground": "#F8F8F2",
      "settings.checkboxBorder": "#191A21",
      "settings.textInputBackground": "#21222C",
      "settings.textInputForeground": "#F8F8F2",
      "settings.textInputBorder": "#191A21",
      "settings.numberInputBackground": "#21222C",
      "settings.numberInputForeground": "#F8F8F2",
      "settings.numberInputBorder": "#191A21",
      "breadcrumb.foreground": "#6272A4",
      "breadcrumb.background": "#282A36",
      "breadcrumb.focusForeground": "#F8F8F2",
      "breadcrumb.activeSelectionForeground": "#F8F8F2",
      "breadcrumbPicker.background": "#191A21",
      "listFilterWidget.background": "#343746",
      "listFilterWidget.outline": "#424450",
      "listFilterWidget.noMatchesOutline": "#FF5555",
    },
    "tokenColors": [
      {
        "scope": ["emphasis"],
        "settings": {
          "fontStyle": "italic",
        },
      },
      {
        "scope": ["strong"],
        "settings": {
          "fontStyle": "bold",
        },
      },
      {
        "scope": ["header"],
        "settings": {
          "foreground": "#BD93F9",
        },
      },
      {
        "scope": ["meta.diff", "meta.diff.header"],
        "settings": {
          "foreground": "#6272A4",
        },
      },
      {
        "scope": ["markup.inserted"],
        "settings": {
          "foreground": "#50FA7B",
        },
      },
      {
        "scope": ["markup.deleted"],
        "settings": {
          "foreground": "#FF5555",
        },
      },
      {
        "scope": ["markup.changed"],
        "settings": {
          "foreground": "#FFB86C",
        },
      },
      {
        "scope": ["invalid"],
        "settings": {
          "foreground": "#FF5555",
          "fontStyle": "underline italic",
        },
      },
      {
        "scope": ["invalid.deprecated"],
        "settings": {
          "foreground": "#F8F8F2",
          "fontStyle": "underline italic",
        },
      },
      {
        "scope": ["entity.name.filename"],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "scope": ["markup.error"],
        "settings": {
          "foreground": "#FF5555",
        },
      },
      {
        "name": "Underlined markup",
        "scope": ["markup.underline"],
        "settings": {
          "fontStyle": "underline",
        },
      },
      {
        "name": "Bold markup",
        "scope": ["markup.bold"],
        "settings": {
          "fontStyle": "bold",
          "foreground": "#FFB86C",
        },
      },
      {
        "name": "Markup headings",
        "scope": ["markup.heading"],
        "settings": {
          "fontStyle": "bold",
          "foreground": "#BD93F9",
        },
      },
      {
        "name": "Markup italic",
        "scope": ["markup.italic"],
        "settings": {
          "foreground": "#F1FA8C",
          "fontStyle": "italic",
        },
      },
      {
        "name": "Bullets, lists (prose)",
        "scope": [
          "beginning.punctuation.definition.list.markdown",
          "beginning.punctuation.definition.quote.markdown",
          "punctuation.definition.link.restructuredtext",
        ],
        "settings": {
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Inline code (prose)",
        "scope": ["markup.inline.raw", "markup.raw.restructuredtext"],
        "settings": {
          "foreground": "#50FA7B",
        },
      },
      {
        "name": "Links (prose)",
        "scope": ["markup.underline.link", "markup.underline.link.image"],
        "settings": {
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Link text, image alt text (prose)",
        "scope": [
          "meta.link.reference.def.restructuredtext",
          "punctuation.definition.directive.restructuredtext",
          "string.other.link.description",
          "string.other.link.title",
        ],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "Blockquotes (prose)",
        "scope": ["entity.name.directive.restructuredtext", "markup.quote"],
        "settings": {
          "foreground": "#F1FA8C",
          "fontStyle": "italic",
        },
      },
      {
        "name": "Horizontal rule (prose)",
        "scope": ["meta.separator.markdown"],
        "settings": {
          "foreground": "#6272A4",
        },
      },
      {
        "name": "Code blocks",
        "scope": [
          "fenced_code.block.language",
          "markup.raw.inner.restructuredtext",
          "markup.fenced_code.block.markdown punctuation.definition.markdown",
        ],
        "settings": {
          "foreground": "#50FA7B",
        },
      },
      {
        "name": "Prose constants",
        "scope": ["punctuation.definition.constant.restructuredtext"],
        "settings": {
          "foreground": "#BD93F9",
        },
      },
      {
        "name": "Braces in markdown headings",
        "scope": [
          "markup.heading.markdown punctuation.definition.string.begin",
          "markup.heading.markdown punctuation.definition.string.end",
        ],
        "settings": {
          "foreground": "#BD93F9",
        },
      },
      {
        "name": "Braces in markdown paragraphs",
        "scope": [
          "meta.paragraph.markdown punctuation.definition.string.begin",
          "meta.paragraph.markdown punctuation.definition.string.end",
        ],
        "settings": {
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": "Braces in markdown blockquotes",
        "scope": [
          "markup.quote.markdown meta.paragraph.markdown punctuation.definition.string.begin",
          "markup.quote.markdown meta.paragraph.markdown punctuation.definition.string.end",
        ],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "name": "User-defined class names",
        "scope": ["entity.name.type.class", "entity.name.class"],
        "settings": {
          "foreground": "#8BE9FD",
          "fontStyle": "italic",
        },
      },
      {
        "name": "this, super, self, etc.",
        "scope": [
          "keyword.expressions-and-types.swift",
          "keyword.other.this",
          "variable.language",
          "variable.language punctuation.definition.variable.php",
          "variable.other.readwrite.instance.ruby",
          "variable.parameter.function.language.special",
        ],
        "settings": {
          "foreground": "#BD93F9",
          "fontStyle": "italic",
        },
      },
      {
        "name": "Inherited classes",
        "scope": ["entity.other.inherited-class"],
        "settings": {
          "fontStyle": "italic",
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Comments",
        "scope": [
          "comment",
          "punctuation.definition.comment",
          "unused.comment",
          "wildcard.comment",
        ],
        "settings": {
          "foreground": "#6272A4",
        },
      },
      {
        "name": "JSDoc-style keywords",
        "scope": [
          "comment keyword.codetag.notation",
          "comment.block.documentation keyword",
          "comment.block.documentation storage.type.class",
        ],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "JSDoc-style types",
        "scope": ["comment.block.documentation entity.name.type"],
        "settings": {
          "foreground": "#8BE9FD",
          "fontStyle": "italic",
        },
      },
      {
        "name": "JSDoc-style type brackets",
        "scope": [
          "comment.block.documentation entity.name.type punctuation.definition.bracket",
        ],
        "settings": {
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "JSDoc-style comment parameters",
        "scope": ["comment.block.documentation variable"],
        "settings": {
          "foreground": "#FFB86C",
          "fontStyle": "italic",
        },
      },
      {
        "name": "Constants",
        "scope": ["constant", "variable.other.constant"],
        "settings": {
          "foreground": "#BD93F9",
        },
      },
      {
        "name": "Constant escape sequences",
        "scope": [
          "constant.character.escape",
          "constant.character.string.escape",
          "constant.regexp",
        ],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "HTML tags",
        "scope": ["entity.name.tag"],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "CSS attribute parent selectors ('&')",
        "scope": ["entity.other.attribute-name.parent-selector"],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "HTML/CSS attribute names",
        "scope": ["entity.other.attribute-name"],
        "settings": {
          "foreground": "#50FA7B",
          "fontStyle": "italic",
        },
      },
      {
        "name": "Function names",
        "scope": [
          "entity.name.function",
          "meta.function-call.object",
          "meta.function-call.php",
          "meta.function-call.static",
          "meta.method-call.java meta.method",
          "meta.method.groovy",
          "support.function.any-method.lua",
          "keyword.operator.function.infix",
        ],
        "settings": {
          "foreground": "#50FA7B",
        },
      },
      {
        "name": "Function parameters",
        "scope": [
          "entity.name.variable.parameter",
          "meta.at-rule.function variable",
          "meta.at-rule.mixin variable",
          "meta.function.arguments variable.other.php",
          "meta.selectionset.graphql meta.arguments.graphql variable.arguments.graphql",
          "variable.parameter",
        ],
        "settings": {
          "fontStyle": "italic",
          "foreground": "#FFB86C",
        },
      },
      {
        "name": "Decorators",
        "scope": [
          "meta.decorator variable.other.readwrite",
          "meta.decorator variable.other.property",
        ],
        "settings": {
          "foreground": "#50FA7B",
          "fontStyle": "italic",
        },
      },
      {
        "name": "Decorator Objects",
        "scope": ["meta.decorator variable.other.object"],
        "settings": {
          "foreground": "#50FA7B",
        },
      },
      {
        "name": "Keywords",
        "scope": ["keyword", "punctuation.definition.keyword"],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": 'Keyword "new"',
        "scope": ["keyword.control.new", "keyword.operator.new"],
        "settings": {
          "fontStyle": "bold",
        },
      },
      {
        "name": "Generic selectors (CSS/SCSS/Less/Stylus)",
        "scope": ["meta.selector"],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "Language Built-ins",
        "scope": ["support"],
        "settings": {
          "fontStyle": "italic",
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Built-in magic functions and constants",
        "scope": [
          "support.function.magic",
          "support.variable",
          "variable.other.predefined",
        ],
        "settings": {
          "fontStyle": "bold",
          "foreground": "#BD93F9",
        },
      },
      {
        "name": "Built-in functions / properties",
        "scope": ["support.function", "support.type.property-name"],
        "settings": {
          "fontStyle": "italic",
        },
      },
      {
        "name":
          "Separators (key/value, namespace, inheritance, pointer, hash, slice, etc)",
        "scope": [
          "constant.other.symbol.hashkey punctuation.definition.constant.ruby",
          "entity.other.attribute-name.placeholder punctuation",
          "entity.other.attribute-name.pseudo-class punctuation",
          "entity.other.attribute-name.pseudo-element punctuation",
          "meta.group.double.toml",
          "meta.group.toml",
          "meta.object-binding-pattern-variable punctuation.destructuring",
          "punctuation.colon.graphql",
          "punctuation.definition.block.scalar.folded.yaml",
          "punctuation.definition.block.scalar.literal.yaml",
          "punctuation.definition.block.sequence.item.yaml",
          "punctuation.definition.entity.other.inherited-class",
          "punctuation.function.swift",
          "punctuation.separator.dictionary.key-value",
          "punctuation.separator.hash",
          "punctuation.separator.inheritance",
          "punctuation.separator.key-value",
          "punctuation.separator.key-value.mapping.yaml",
          "punctuation.separator.namespace",
          "punctuation.separator.pointer-access",
          "punctuation.separator.slice",
          "string.unquoted.heredoc punctuation.definition.string",
          "support.other.chomping-indicator.yaml",
          "punctuation.separator.annotation",
        ],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "Brackets, braces, parens, etc.",
        "scope": [
          "keyword.operator.other.powershell",
          "keyword.other.statement-separator.powershell",
          "meta.brace.round",
          "meta.function-call punctuation",
          "punctuation.definition.arguments.begin",
          "punctuation.definition.arguments.end",
          "punctuation.definition.entity.begin",
          "punctuation.definition.entity.end",
          "punctuation.definition.tag.cs",
          "punctuation.definition.type.begin",
          "punctuation.definition.type.end",
          "punctuation.section.scope.begin",
          "punctuation.section.scope.end",
          "punctuation.terminator.expression.php",
          "storage.type.generic.java",
          "string.template meta.brace",
          "string.template punctuation.accessor",
        ],
        "settings": {
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": "Variable interpolation operators",
        "scope": [
          "meta.string-contents.quoted.double punctuation.definition.variable",
          "punctuation.definition.interpolation.begin",
          "punctuation.definition.interpolation.end",
          "punctuation.definition.template-expression.begin",
          "punctuation.definition.template-expression.end",
          "punctuation.section.embedded.begin",
          "punctuation.section.embedded.coffee",
          "punctuation.section.embedded.end",
          "punctuation.section.embedded.end source.php",
          "punctuation.section.embedded.end source.ruby",
          "punctuation.definition.variable.makefile",
        ],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "Keys (serializable languages)",
        "scope": [
          "entity.name.function.target.makefile",
          "entity.name.section.toml",
          "entity.name.tag.yaml",
          "variable.other.key.toml",
        ],
        "settings": {
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Dates / timestamps (serializable languages)",
        "scope": ["constant.other.date", "constant.other.timestamp"],
        "settings": {
          "foreground": "#FFB86C",
        },
      },
      {
        "name": "YAML aliases",
        "scope": ["variable.other.alias.yaml"],
        "settings": {
          "fontStyle": "italic underline",
          "foreground": "#50FA7B",
        },
      },
      {
        "name": "Storage",
        "scope": [
          "storage",
          "meta.implementation storage.type.objc",
          "meta.interface-or-protocol storage.type.objc",
          "source.groovy storage.type.def",
        ],
        "settings": {
          "fontStyle": "bold",
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "Types",
        "scope": [
          "entity.name.type",
          "keyword.primitive-datatypes.swift",
          "keyword.type.cs",
          "meta.protocol-list.objc",
          "meta.return-type.objc",
          "source.go storage.type",
          "source.groovy storage.type",
          "source.java storage.type",
          "source.powershell entity.other.attribute-name",
          "storage.class.std.rust",
          "storage.type.attribute.swift",
          "storage.type.c",
          "storage.type.core.rust",
          "storage.type.cs",
          "storage.type.groovy",
          "storage.type.objc",
          "storage.type.php",
          "storage.type.haskell",
          "storage.type.ocaml",
        ],
        "settings": {
          "fontStyle": "italic",
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Generics, templates, and mapped type declarations",
        "scope": [
          "entity.name.type.type-parameter",
          "meta.indexer.mappedtype.declaration entity.name.type",
          "meta.type.parameters entity.name.type",
        ],
        "settings": {
          "foreground": "#FFB86C",
        },
      },
      {
        "name": "Modifiers",
        "scope": ["storage.modifier"],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "RegExp string",
        "scope": [
          "string.regexp",
          "constant.other.character-class.set.regexp",
          "constant.character.escape.backslash.regexp",
        ],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "name": "Non-capture operators",
        "scope": ["punctuation.definition.group.capture.regexp"],
        "settings": {
          "foreground": "#FF79C6",
        },
      },
      {
        "name": "RegExp start and end characters",
        "scope": [
          "string.regexp punctuation.definition.string.begin",
          "string.regexp punctuation.definition.string.end",
        ],
        "settings": {
          "foreground": "#FF5555",
        },
      },
      {
        "name": "Character group",
        "scope": ["punctuation.definition.character-class.regexp"],
        "settings": {
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Capture groups",
        "scope": ["punctuation.definition.group.regexp"],
        "settings": {
          "foreground": "#FFB86C",
        },
      },
      {
        "name": "Assertion operators",
        "scope": [
          "punctuation.definition.group.assertion.regexp",
          "keyword.operator.negation.regexp",
        ],
        "settings": {
          "foreground": "#FF5555",
        },
      },
      {
        "name": "Positive lookaheads",
        "scope": ["meta.assertion.look-ahead.regexp"],
        "settings": {
          "foreground": "#50FA7B",
        },
      },
      {
        "name": "Strings",
        "scope": ["string"],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "name": "String quotes (temporary vscode fix)",
        "scope": [
          "punctuation.definition.string.begin",
          "punctuation.definition.string.end",
        ],
        "settings": {
          "foreground": "#E9F284",
        },
      },
      {
        "name": "Property quotes (temporary vscode fix)",
        "scope": [
          "punctuation.support.type.property-name.begin",
          "punctuation.support.type.property-name.end",
        ],
        "settings": {
          "foreground": "#8BE9FE",
        },
      },
      {
        "name": "Docstrings",
        "scope": [
          "string.quoted.docstring.multi",
          "string.quoted.docstring.multi.python punctuation.definition.string.begin",
          "string.quoted.docstring.multi.python punctuation.definition.string.end",
          "string.quoted.docstring.multi.python constant.character.escape",
        ],
        "settings": {
          "foreground": "#6272A4",
        },
      },
      {
        "name": "Variables and object properties",
        "scope": [
          "variable",
          "constant.other.key.perl",
          "support.variable.property",
          "variable.other.constant.js",
          "variable.other.constant.ts",
          "variable.other.constant.tsx",
        ],
        "settings": {
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": "Destructuring / aliasing reference name (LHS)",
        "scope": [
          "meta.import variable.other.readwrite",
          "meta.variable.assignment.destructured.object.coffee variable",
        ],
        "settings": {
          "fontStyle": "italic",
          "foreground": "#FFB86C",
        },
      },
      {
        "name": "Destructuring / aliasing variable name (RHS)",
        "scope": [
          "meta.import variable.other.readwrite.alias",
          "meta.export variable.other.readwrite.alias",
          "meta.variable.assignment.destructured.object.coffee variable variable",
        ],
        "settings": {
          "fontStyle": "bold",
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": "GraphQL keys",
        "scope": ["meta.selectionset.graphql variable"],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "name": "GraphQL function arguments",
        "scope": ["meta.selectionset.graphql meta.arguments variable"],
        "settings": {
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": "GraphQL fragment name (definition)",
        "scope": ["entity.name.fragment.graphql", "variable.fragment.graphql"],
        "settings": {
          "foreground": "#8BE9FD",
        },
      },
      {
        "name": "Edge cases (foreground color resets)",
        "scope": [
          "constant.other.symbol.hashkey.ruby",
          "keyword.operator.dereference.java",
          "keyword.operator.navigation.groovy",
          "meta.scope.for-loop.shell punctuation.definition.string.begin",
          "meta.scope.for-loop.shell punctuation.definition.string.end",
          "meta.scope.for-loop.shell string",
          "storage.modifier.import",
          "punctuation.section.embedded.begin.tsx",
          "punctuation.section.embedded.end.tsx",
          "punctuation.section.embedded.begin.jsx",
          "punctuation.section.embedded.end.jsx",
          "punctuation.separator.list.comma.css",
          "constant.language.empty-list.haskell",
        ],
        "settings": {
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": 'Shell variables prefixed with "$" (edge case)',
        "scope": ["source.shell variable.other"],
        "settings": {
          "foreground": "#BD93F9",
        },
      },
      {
        "name":
          "Powershell constants mistakenly scoped to `support`, rather than `constant` (edge)",
        "scope": ["support.constant"],
        "settings": {
          "fontStyle": "bold",
          "foreground": "#BD93F9",
        },
      },
      {
        "name": "Makefile prerequisite names",
        "scope": ["meta.scope.prerequisites.makefile"],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "name": "SCSS attibute selector strings",
        "scope": ["meta.attribute-selector.scss"],
        "settings": {
          "foreground": "#F1FA8C",
        },
      },
      {
        "name": "SCSS attribute selector brackets",
        "scope": [
          "punctuation.definition.attribute-selector.end.bracket.square.scss",
          "punctuation.definition.attribute-selector.begin.bracket.square.scss",
        ],
        "settings": {
          "foreground": "#F8F8F2",
        },
      },
      {
        "name": "Haskell Pragmas",
        "scope": ["meta.preprocessor.haskell"],
        "settings": {
          "foreground": "#6272A4",
        },
      },
      {
        "name": "Log file error",
        "scope": ["log.error"],
        "settings": {
          "foreground": "#FF5555",
          "fontStyle": "bold",
        },
      },
      {
        "name": "Log file warning",
        "scope": ["log.warning"],
        "settings": {
          "foreground": "#F1FA8C",
          "fontStyle": "bold",
        },
      },
    ],
  };

  return JSON.stringify(vscodeTheme);
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
  const config = STD.loadFile(themeConfPath);
  const vscodeThemeFile = OS.open(
    HOME_DIR.concat(".vscode/extensions/wallwiz-theme.json"),
    "w",
  );
  if (!vscodeThemeFile) return;
  vscodeThemeFile.puts(config);
  vscodeThemeFile.close();
}

export { getDarkThemeConf, getLightThemeConf, setTheme };
