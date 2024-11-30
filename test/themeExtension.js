import * as _ from "../src/globalConstants.js";
import * as theme from "../themeExtensionScripts/vsCode@5hubham5ingh.js";

function getColoursArray() {
  const allColours = STD.loadFile(`${HOME_DIR}/.cache/WallWiz/colours.json`);
  if (!allColours) throw Error("No colour's cache exists.");
  return Object.values(allColours);
}

function testGetTheme() {
  const colours = getColoursArray();
  for (const colour of colours) {
    try {
      theme.getDarkThemeConf(colour);
    } catch (e) {
      print(
        "Error in getDarkThemeConf.\n",
        e,
        "\nColours:",
        JSON.stringify(colour),
        "\n\n",
      );
    }

    try {
      theme.getLightThemeConf(colour);
    } catch (e) {
      print(
        "Error in getLightThemeConf.\n",
        e,
        "\nColours:",
        JSON.stringify(colour),
        "\n\n",
      );
    }
  }
}

testGetTheme();
