/*
 For:            kitty panel, https://sw.kovidgoyal.net/kitty/kittens/panel/
 Author:         https://github.com/5hubham5ingh
 Prerequisite:   kitty terminal
*/

export function setWallpaper(path) {
  const command = [
    "kitty",
    "+kitten",
    "panel",
    "--edge=background",
    "sh",
    "-c",
    `printf '\u001B[?25l' && stty raw && kitten icat -n ${path} && printf '\u001B[T' && read`,
  ];

  execAsync(command, {
    newSession: true,
  });
  STD.exit();
}
