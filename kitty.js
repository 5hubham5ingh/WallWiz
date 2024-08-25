import { exec, stat, readdir } from 'os'
import { exec as execAsync } from "../justjs/src/process.js";
import { exit, getenv } from "std";
import config from './config.js';
print('kitty.js')
class Kitty {
  constructor() {
    //ensure kitty in installed and available
    this.cacheDir = config.getAppCacheDir(app)
  }

  // setCacheDir(cacheDir) {
  //   exec(['clear'])
  //   print(cacheDir)
  //   exit(2)
  //   this.cacheDir = cacheDir;
  // }

  getThemeName(fileName, type) {
    return type !== undefined
      ? `${fileName}-${type ? "light" : "dark"}.conf`
      : [
        `${fileName}-light.conf`,
        `${fileName}-dark.conf`,
      ];
  }

  // change the active colour theme
  async setTheme(
    wallpaperDir,
    wallpaperName,
    enableLightTheme
  ) {

    const themeName = this.getThemeName(wallpaperName, enableLightTheme);
    exec(['clear']);
    print('kitty:', this.cacheDir)
    exit(2)
    const currentThemePath = this.cacheDir.concat(themeName);
    const doesCacheExists = stat(currentThemePath)[1] === 0;

    const setKittyThemeColours = (currentThemePath) => {
      exec(["kitty", "@", "set-colors", "-a", "-c", currentThemePath]);
    }

    if (doesCacheExists) setKittyThemeColours(currentThemePath);
    else
      await this.createTheme(wallpaperDir, wallpaperName).then(
        setKittyThemeColours
      ).catch(e => {
        throw new Error('Failed to create kittytheme', e)
      });
  };

  // create the theme config, TODO: will receive the colours as input
  async createThemes(picDir, pics) {
    const makeThemePromises = [];
    const cachedThemes = readdir(this.cacheDir)[0].filter(
      (name) => name !== "." && name !== ".."
    );

    for (let i = 0; i < pics.length; i++) {
      const currPicName = pics[i];
      const currPicPath = picDir.concat(currPicName);
      const doesKittyThemeExists = this.getThemeName(currPicName).every(
        (cachedTheme) => cachedThemes.includes(cachedTheme)
      );
      !doesKittyThemeExists &&
        makeThemePromises.push(this.createTheme(currPicPath, currPicName));
    }

    await Promise.all(makeThemePromises);
  };

  async createTheme(picPath, picName) {
    const getHexCode = (result) =>
      result
        .split("\n")
        .map((line) =>
          line
            .split(" ") // split lines
            .filter((word) => word[0] === "#")
            .join()
        )
        .filter((color) => color)

    const createThemesConf = async (colours) => {
      const kittyLightTheme = this.getThemeConf(colours); // generate light theme for kitty
      const createKittyThemes = [];
      createKittyThemes.push(
        execAsync(
          [
            "echo",
            `"${kittyLightTheme}"`,
            ">",
            this.cacheDir.concat(this.getThemeName(picName, true)),
          ],
          { useShell: true }
        )
      );
      const kittyDarkTheme = this.getThemeConf(colours.reverse()); // generate dark theme for kitty
      createKittyThemes.push(
        execAsync(
          [
            "echo",
            `"${kittyDarkTheme}"`,
            ">",
            this.cacheDir.concat(this.getThemeName(picName, false)),
          ],
          { useShell: true }
        )
      );

      await Promise.all(createKittyThemes);
    }

    return execAsync(
      `magick ${picPath} -format %c -depth 8 -colors 30 histogram:info:`
    )
      .then(getHexCode)
      .then(createThemesConf)
      .catch(e => {
        exec(['clear']); print(e); exit(2)
      });
  };

  getThemeConf(colors) {
    if (colors.length < 8) {
      throw new Error("At least 8 colors are required");
    }

    function hexToHSL(hex) {
      let r = parseInt(hex.slice(1, 3), 16) / 255;
      let g = parseInt(hex.slice(3, 5), 16) / 255;
      let b = parseInt(hex.slice(5, 7), 16) / 255;

      let max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h,
        s,
        l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        let d = max - min;
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

    // Sort colors by lightness
    const sortedColors = [...colors].sort((a, b) => {
      const [, , lA] = hexToHSL(a);
      const [, , lB] = hexToHSL(b);
      return lA - lB;
    }); //.slice(10);

    // Find colors for specific purposes
    const darkestColor = sortedColors[0];
    const lightestColor = sortedColors[sortedColors.length - 1];
    const midColor = sortedColors[Math.floor(sortedColors.length / 2)];

    // Find vibrant colors for different hues
    const vibrantColors = colors.filter((color) => {
      const [, s, l] = hexToHSL(color);
      return s > 50 && l > 30 && l < 70;
    });

    // If we don't have enough vibrant colors, use all colors
    const colorPool = vibrantColors.length >= 6 ? vibrantColors : colors;

    function findColorByHue(startHue, endHue, fallback) {
      return (
        colorPool.find((color) => {
          const [h, ,] = hexToHSL(color);
          return startHue <= endHue
            ? h >= startHue && h < endHue
            : h >= startHue || h < endHue;
        }) || fallback
      );
    }

    const redColor = findColorByHue(330, 30, colorPool[0]);
    const greenColor = findColorByHue(90, 150, colorPool[1]);
    const blueColor = findColorByHue(210, 270, colorPool[2]);
    const yellowColor = findColorByHue(30, 90, colorPool[3]);
    const magentaColor = findColorByHue(270, 330, colorPool[4]);
    const cyanColor = findColorByHue(150, 210, colorPool[5]);

    const theme = `
# Basic colors
foreground                      ${lightestColor}
selection_foreground            ${darkestColor}
selection_background            ${midColor}

# Cursor colors
cursor                          ${midColor}
cursor_text_color               ${darkestColor}

# URL underline color when hovering with mouse
url_color                       ${blueColor}

# Window border colors
active_border_color             ${greenColor}
inactive_border_color           ${midColor}

# Tab bar colors
active_tab_foreground           ${darkestColor}
active_tab_background           ${midColor}
inactive_tab_foreground         ${midColor}
inactive_tab_background         ${darkestColor}

# The basic 16 colors
# black
color0 #000000
color8 ${sortedColors[5]}

# red
color1 ${redColor}
color9 ${findColorByHue(330, 30, redColor)}

# green
color2  ${greenColor}
color10 ${findColorByHue(90, 150, greenColor)}

# yellow
color3  ${yellowColor}
color11 ${findColorByHue(30, 90, yellowColor)}

# blue
color4  ${blueColor}
color12 ${findColorByHue(210, 270, blueColor)}

# magenta
color5  ${magentaColor}
color13 ${findColorByHue(270, 330, magentaColor)}

# cyan
color6  ${cyanColor}
color14 ${findColorByHue(150, 210, cyanColor)}

# white
color7  ${sortedColors[sortedColors.length - 2]}
color15 ${lightestColor}
`;

    return theme.trim();

  }
}

export default Kitty;
