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
  const sortedColors = [...colors].sort((a, b) => {
    const [, , lA] = rgbToHSL(...hexToRGB(a));
    const [, , lB] = rgbToHSL(...hexToRGB(b));
    return isDark ? lA - lB : lB - lA;
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

function generateThemeConfig(theme, isDark) {
  const invertIfLight = (color) => isDark ? color : invertLightness(color);

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

  const vscodeTheme = {
    name: "WallWiz-theme",
    colors: {
      "editor.background": "#263238",
      "editor.foreground": "#eeffff",
      "activityBarBadge.background": "#007acc",
      "sideBarTitle.foreground": "#bbbbbb",
    },
    tokenColors: [
      {
        name: "Comment",
        scope: ["comment", "punctuation.definition.comment"],
        settings: {
          fontStyle: "italic",
          foreground: "#546E7A",
        },
      },
      {
        name: "Variables",
        scope: ["variable", "string constant.other.placeholder"],
        settings: {
          foreground: "#EEFFFF",
        },
      },
      {
        name: "Colors",
        scope: ["constant.other.color"],
        settings: {
          foreground: "#ffffff",
        },
      },
      {
        name: "Invalid",
        scope: ["invalid", "invalid.illegal"],
        settings: {
          foreground: "#FF5370",
        },
      },
      {
        name: "Keyword, Storage",
        scope: ["keyword", "storage.type", "storage.modifier"],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "Operator, Misc",
        scope: [
          "keyword.control",
          "constant.other.color",
          "punctuation",
          "meta.tag",
          "punctuation.definition.tag",
          "punctuation.separator.inheritance.php",
          "punctuation.definition.tag.html",
          "punctuation.definition.tag.begin.html",
          "punctuation.definition.tag.end.html",
          "punctuation.section.embedded",
          "keyword.other.template",
          "keyword.other.substitution",
        ],
        settings: {
          foreground: "#89DDFF",
        },
      },
      {
        name: "Tag",
        scope: [
          "entity.name.tag",
          "meta.tag.sgml",
          "markup.deleted.git_gutter",
        ],
        settings: {
          foreground: "#f07178",
        },
      },
      {
        name: "Function, Special Method",
        scope: [
          "entity.name.function",
          "meta.function-call",
          "variable.function",
          "support.function",
          "keyword.other.special-method",
        ],
        settings: {
          foreground: "#82AAFF",
        },
      },
      {
        name: "Block Level Variables",
        scope: ["meta.block variable.other"],
        settings: {
          foreground: "#f07178",
        },
      },
      {
        name: "Other Variable, String Link",
        scope: ["support.other.variable", "string.other.link"],
        settings: {
          foreground: "#f07178",
        },
      },
      {
        name: "Number, Constant, Function Argument, Tag Attribute, Embedded",
        scope: [
          "constant.numeric",
          "constant.language",
          "support.constant",
          "constant.character",
          "constant.escape",
          "variable.parameter",
          "keyword.other.unit",
          "keyword.other",
        ],
        settings: {
          foreground: "#F78C6C",
        },
      },
      {
        name: "String, Symbols, Inherited Class, Markup Heading",
        scope: [
          "string",
          "constant.other.symbol",
          "constant.other.key",
          "entity.other.inherited-class",
          "markup.heading",
          "markup.inserted.git_gutter",
          "meta.group.braces.curly constant.other.object.key.js string.unquoted.label.js",
        ],
        settings: {
          foreground: "#C3E88D",
        },
      },
      {
        name: "Class, Support",
        scope: [
          "entity.name",
          "support.type",
          "support.class",
          "support.other.namespace.use.php",
          "meta.use.php",
          "support.other.namespace.php",
          "markup.changed.git_gutter",
          "support.type.sys-types",
        ],
        settings: {
          foreground: "#FFCB6B",
        },
      },
      {
        name: "Entity Types",
        scope: ["support.type"],
        settings: {
          foreground: "#B2CCD6",
        },
      },
      {
        name: "CSS Class and Support",
        scope: [
          "source.css support.type.property-name",
          "source.sass support.type.property-name",
          "source.scss support.type.property-name",
          "source.less support.type.property-name",
          "source.stylus support.type.property-name",
          "source.postcss support.type.property-name",
        ],
        settings: {
          foreground: "#B2CCD6",
        },
      },
      {
        name: "Sub-methods",
        scope: [
          "entity.name.module.js",
          "variable.import.parameter.js",
          "variable.other.class.js",
        ],
        settings: {
          foreground: "#FF5370",
        },
      },
      {
        name: "Language methods",
        scope: ["variable.language"],
        settings: {
          fontStyle: "italic",
          foreground: "#FF5370",
        },
      },
      {
        name: "entity.name.method.js",
        scope: ["entity.name.method.js"],
        settings: {
          fontStyle: "italic",
          foreground: "#82AAFF",
        },
      },
      {
        name: "meta.method.js",
        scope: [
          "meta.class-method.js entity.name.function.js",
          "variable.function.constructor",
        ],
        settings: {
          foreground: "#82AAFF",
        },
      },
      {
        name: "Attributes",
        scope: ["entity.other.attribute-name"],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "HTML Attributes",
        scope: [
          "text.html.basic entity.other.attribute-name.html",
          "text.html.basic entity.other.attribute-name",
        ],
        settings: {
          fontStyle: "italic",
          foreground: "#FFCB6B",
        },
      },
      {
        name: "CSS Classes",
        scope: ["entity.other.attribute-name.class"],
        settings: {
          foreground: "#FFCB6B",
        },
      },
      {
        name: "CSS ID's",
        scope: ["source.sass keyword.control"],
        settings: {
          foreground: "#82AAFF",
        },
      },
      {
        name: "Inserted",
        scope: ["markup.inserted"],
        settings: {
          foreground: "#C3E88D",
        },
      },
      {
        name: "Deleted",
        scope: ["markup.deleted"],
        settings: {
          foreground: "#FF5370",
        },
      },
      {
        name: "Changed",
        scope: ["markup.changed"],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "Regular Expressions",
        scope: ["string.regexp"],
        settings: {
          foreground: "#89DDFF",
        },
      },
      {
        name: "Escape Characters",
        scope: ["constant.character.escape"],
        settings: {
          foreground: "#89DDFF",
        },
      },
      {
        name: "URL",
        scope: ["*url*", "*link*", "*uri*"],
        settings: {
          fontStyle: "underline",
        },
      },
      {
        name: "Decorators",
        scope: [
          "tag.decorator.js entity.name.tag.js",
          "tag.decorator.js punctuation.definition.tag.js",
        ],
        settings: {
          fontStyle: "italic",
          foreground: "#82AAFF",
        },
      },
      {
        name: "ES7 Bind Operator",
        scope: [
          "source.js constant.other.object.key.js string.unquoted.label.js",
        ],
        settings: {
          fontStyle: "italic",
          foreground: "#FF5370",
        },
      },
      {
        name: "JSON Key - Level 0",
        scope: [
          "source.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "JSON Key - Level 1",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#FFCB6B",
        },
      },
      {
        name: "JSON Key - Level 2",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#F78C6C",
        },
      },
      {
        name: "JSON Key - Level 3",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#FF5370",
        },
      },
      {
        name: "JSON Key - Level 4",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#C17E70",
        },
      },
      {
        name: "JSON Key - Level 5",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#B14F63",
        },
      },
      {
        name: "JSON Key - Level 6",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#f07178",
        },
      },
      {
        name: "JSON Key - Level 7",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "JSON Key - Level 8",
        scope: [
          "source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json",
        ],
        settings: {
          foreground: "#C3E88D",
        },
      },
      {
        name: "Markdown - Plain",
        scope: [
          "text.html.markdown",
          "punctuation.definition.list_item.markdown",
        ],
        settings: {
          foreground: "#EEFFFF",
        },
      },
      {
        name: "Markdown - Markup Raw Inline",
        scope: [
          "text.html.markdown markup.inline.raw.markdown",
        ],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "Markdown - Markup Raw Inline Punctuation",
        scope: [
          "text.html.markdown markup.inline.raw.markdown punctuation.definition.raw.markdown",
        ],
        settings: {
          foreground: "#65737E",
        },
      },
      {
        name: "Markdown - Heading",
        scope: [
          "markdown.heading",
          "markup.heading | markup.heading entity.name",
          "markup.heading.markdown punctuation.definition.heading.markdown",
        ],
        settings: {
          foreground: "#C3E88D",
        },
      },
      {
        name: "Markup - Italic",
        scope: [
          "markup.italic",
        ],
        settings: {
          fontStyle: "italic",
          foreground: "#f07178",
        },
      },
      {
        name: "Markup - Bold",
        scope: [
          "markup.bold",
          "markup.bold string",
        ],
        settings: {
          fontStyle: "bold",
          foreground: "#f07178",
        },
      },
      {
        name: "Markup - Bold-Italic",
        scope: [
          "markup.bold markup.italic",
          "markup.italic markup.bold",
          "markup.quote markup.bold",
          "markup.bold markup.italic string",
          "markup.italic markup.bold string",
          "markup.quote markup.bold string",
        ],
        settings: {
          fontStyle: "bold",
          foreground: "#f07178",
        },
      },
      {
        name: "Markup - Underline",
        scope: [
          "markup.underline",
        ],
        settings: {
          fontStyle: "underline",
          foreground: "#F78C6C",
        },
      },
      {
        name: "Markdown - Blockquote",
        scope: [
          "markup.quote punctuation.definition.blockquote.markdown",
        ],
        settings: {
          foreground: "#65737E",
        },
      },
      {
        name: "Markup - Quote",
        scope: [
          "markup.quote",
        ],
        settings: {
          fontStyle: "italic",
        },
      },
      {
        name: "Markdown - Link",
        scope: [
          "string.other.link.title.markdown",
        ],
        settings: {
          foreground: "#82AAFF",
        },
      },
      {
        name: "Markdown - Link Description",
        scope: [
          "string.other.link.description.title.markdown",
        ],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "Markdown - Link Anchor",
        scope: [
          "constant.other.reference.link.markdown",
        ],
        settings: {
          foreground: "#FFCB6B",
        },
      },
      {
        name: "Markup - Raw Block",
        scope: [
          "markup.raw.block",
        ],
        settings: {
          foreground: "#C792EA",
        },
      },
      {
        name: "Markdown - Raw Block Fenced",
        scope: [
          "markup.raw.block.fenced.markdown",
        ],
        settings: {
          foreground: "#00000050",
        },
      },
      {
        name: "Markdown - Fenced Bode Block",
        scope: [
          "punctuation.definition.fenced.markdown",
        ],
        settings: {
          foreground: "#00000050",
        },
      },
      {
        name: "Markdown - Fenced Bode Block Variable",
        scope: [
          "markup.raw.block.fenced.markdown",
          "variable.language.fenced.markdown",
          "punctuation.section.class.end",
        ],
        settings: {
          foreground: "#EEFFFF",
        },
      },
      {
        name: "Markdown - Fenced Language",
        scope: [
          "variable.language.fenced.markdown",
        ],
        settings: {
          foreground: "#65737E",
        },
      },
      {
        name: "Markdown - Separator",
        scope: [
          "meta.separator",
        ],
        settings: {
          fontStyle: "bold",
          foreground: "#65737E",
        },
      },
      {
        name: "Markup - Table",
        scope: [
          "markup.table",
        ],
        settings: {
          foreground: "#EEFFFF",
        },
      },
    ],
  };
  return config;
}

function getDarkThemeConf(colors) {
  return generateThemeConfig(colors, true);
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
