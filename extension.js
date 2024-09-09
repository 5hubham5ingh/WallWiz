import { curlRequest } from '../justjs/src/curl.js'
import { ProcessSync } from '../justjs/src/process.js'
import { getenv } from 'std'
import { os, std } from './quickJs.js'

class ThemeExtension {
  constructor(themeExtensionScriptsBaseDir) {
    this.tmpDir = '/tmp/WallWiz/ThemeExtension/';
    this.scriptsRepoUrl = `https://api.github.com/repos/5hubham5ingh/WallWiz/contents/themeExtensionScripts`;
    this.themeExtensionScriptsBaseDir = themeExtensionScriptsBaseDir ?? getenv("HOME").concat(
      "/.config/WallWiz/themeExtensionScripts/",
    );
    this.scriptsList;
    this.scriptsMenu;
    this.choosenScripts;
  }

  async start() {
    await this.fetchScriptsList();
    await this.createScriptMenu();
    this.writeScriptsHeadInTempDir();
    this.promptUserToChooseScripts();
    await this.downloadAndSaveThemeExtensions();
  }

  async fetchScriptsList() {

    const handleError = (error) => {
      print("Failed to fetch list of theme extension scripts.", error)
    }
    const handleSuccess = res => res.filter(script => script.type === 'file');

    this.scriptsList = await curlRequest(this.scriptsRepoUrl, {
      parseJson: true
    })
      .then(handleSuccess)
      .catch(handleError)
  }

  async createScriptMenu() {
    const promises = [];

    const fetchScriptHead = async url => {
      return curlRequest(url, {
        headers: {
          'Range': 'bytes=0-499'
        }
      }).catch(e => print('Failed to fetch script head for: ', url, '\n', e))
    }

    for (const script of this.scriptsList) {
      const getScriptPromise = fetchScriptHead(script.download_url)
        .then(head => ({
          name: script.name,
          about: head,
          download_url: script.download_url
        }));

      promises.push(getScriptPromise);
    }

    this.scriptsMenu = await Promise.all(promises)
  }

  writeScriptsHeadInTempDir() {

    for (const script of this.scriptsMenu) {
      const currFile = this.tmpDir.concat(script.name);
      const tmpFile = std.open(currFile, "w+");
      const start = script.about.indexOf('/*') + 2;
      const end = script.about.lastIndexOf('*/') - 2;
      const about = script.about.slice(start, end);
      tmpFile.puts(about);
      tmpFile.close();
      script.tmpFile = currFile;
    }
  }

  promptUserToChooseScripts() {
    const tempScriptsPaths = this.scriptsMenu.map(script => script.tmpFile).join('\n');
    const filter = new ProcessSync('fzf -m --delimiter / --with-nth -1 --preview="cat {}"  --preview-window="down:40%,wrap" --preview-label=" Description " --layout="reverse" --header="Type app name to search for its theme script." --header-first --border=double --border-label=" Theme extension scripts. "', {
      input: tempScriptsPaths,
      useShell: true
    });
    if (!filter.run()) {
      return;
    }
    this.choosenScripts = filter.stdout.split('\n');
    this.removeFilesInTempDir(tempScriptsPaths);
  }

  async downloadAndSaveThemeExtensions() {
    const choosenScripts = this.scriptsMenu
      .filter(script => this.choosenScripts?.includes(script.tmpFile));
    if (!choosenScripts) return;
    print('Downloading scripts: ')

    const promises = [];
    for (const script of choosenScripts) {
      print(script.name);
      promises.push(
        curlRequest(script.download_url, {
          outputFile: this.themeExtensionScriptsBaseDir.concat('/', script.name)
        })
          .catch(e => { print('Failed to download script ', script.name, '\n', e) })
      )
    }
    await Promise.all(promises)
    print('Scripts downloaded.')
  }

  removeFilesInTempDir(tempScriptsPaths) {
    tempScriptsPaths.split('\n')
      .forEach(path => os.remove(path))
  }
}

const extensionManager = new ThemeExtension();
await extensionManager.start();

export default ThemeExtension;
