import { setWallpaper } from "./extensions/wallpaperHandler.js";
import {
  getDarkThemeConf,
  getLightThemeConf,
  setTheme,
} from "./extensions/themeHandler.js";

// Constants
const cwd = OS.getcwd()[0];
const DARK_THEME_FILE = cwd.concat("./results/darkTheme.conf");
const LIGHT_THEME_FILE = cwd.concat("./results/lightTheme.conf");
const WALLPAPER_PATH = cwd.concat("./asset/wallrizz.png");

// Test theme generation
async function testGenerateThemes() {
  const mockColorsArray = [
    "#0C101A",
    "#131A2A",
    "#1A2336",
    "#1F2E4A",
    "#282430",
    "#2A3550",
    "#374666",
    "#3F5181",
    "#513235",
    "#545573",
    "#64678A",
    "#966477",
    "#9A6F8A",
    "#D37885",
    "#D77170",
    "#E99072",
  ];
  try {
    const darkTheme = await getDarkThemeConf(mockColorsArray);
    if (!darkTheme) {
      throw Error("No theme config returned from 'getDarkThemeConf'");
    }
    const fd1 = STD.open(DARK_THEME_FILE, "+w");
    fd1.puts(darkTheme);
    fd1.close();
    print("Dark theme configuration generated and saved");

    const lightTheme = await getLightThemeConf(mockColorsArray);
    if (!lightTheme) {
      throw Error("No theme config returned from 'getLightThemeConf'");
    }

    const fd2 = STD.open(LIGHT_THEME_FILE, "+w");
    fd2.puts(lightTheme);
    fd2.close();
    print("Light theme configuration generated and saved");
  } catch (error) {
    print("Failed to generate themes:", error);
  }
}

// Test applying the theme
async function testApplyTheme() {
  try {
    print("Applying dark theme");
    await setTheme(DARK_THEME_FILE);
    print("Dark theme applied successfully");
    OS.sleep(5000);
    print("Applying light theme");
    await setTheme(LIGHT_THEME_FILE);
    print("Light theme applied successfully");
  } catch (error) {
    print("Failed to apply theme:", error);
  }
}

// Test setting the wallpaper
async function testSetWallpaper() {
  try {
    print("Applying wallpaper");
    await setWallpaper(WALLPAPER_PATH);
    print("Wallpaper applied");
  } catch (error) {
    print("Failed to set wallpaper:", error);
  }
}

// Main function to run all tests
await testGenerateThemes();
await testApplyTheme();
await testSetWallpaper();
