import { loadfile, setenv } from "std";

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
  const highlight = sortedColors[midIndex];
  const accent = isDark
    ? sortedColors[Math.floor(midIndex / 2)]
    : sortedColors[Math.floor(midIndex * 1.5)];

  return {
    background,
    foreground,
    highlight,
    accent,
  };
}

async function getThemeConf(colors, isDark = true) {
  const theme = generateTheme(colors, isDark);

  const config =
    `--color=fg:${theme.foreground},bg:${theme.background},hl:${theme.highlight},fg+:${theme.accent},bg+:${theme.background},hl+:${theme.highlight},info:${theme.accent},prompt:${theme.highlight},pointer:${theme.accent},marker:${theme.accent},spinner:${theme.highlight},header:${theme.highlight},border:${theme.highlight},gutter:${theme.background}`;

  return config;
}

function setTheme(themeConfig) {
  const fzfConfig = loadfile(themeConfig);
  setenv("FZF_DEFAULT_OPTS", fzfConfig);
}

export { getThemeConf, setTheme };
