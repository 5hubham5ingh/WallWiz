class Hyprland {
  constructor(os, std) {
    this.os = os;
    this.std = std;
  }

  async setTheme(themeConfPath, execAsync) {
    return execAsync(
      ["cat", themeConfPath, ">", "~/.config/hypr/myColors.conf"],
      { useShell: true }
    );
  }

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
    });

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

    const hyprlandConf = `
general {
    col.active_border = rgba(${greenColor.slice(1)}ee) rgba(${blueColor.slice(
      1
    )}ee) 45deg
    col.inactive_border = rgba(${midColor.slice(1)}aa)

}

decoration {
    col.shadow = rgba(${darkestColor.slice(1)}ee)
    col.shadow_inactive = rgba(${darkestColor.slice(1)}aa)
}

misc {
    background_color = rgb(${darkestColor.slice(1)})
}

# Example window rules
windowrulev2 = bordercolor rgba(${redColor.slice(1)}ee), fullscreen:1
windowrulev2 = bordercolor rgba(${blueColor.slice(1)}ee), floating:1
`;

    return hyprlandConf.trim();
  }
}

export default Hyprland;
