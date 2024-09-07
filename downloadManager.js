
import { curlRequest } from '../justjs/src/curl.js'
import { open } from 'std'
import { remove } from 'os'

export default class Download {
  constructor(sourceRepoUrl, destinationDir) {
    this.destinationDir = destinationDir;
    this.sourceRepoUrl = sourceRepoUrl;
    this.tempDir = '/tmp/WallWiz/'
    this.downloadItemMenu;
    this.downloadItemList;
  }

  // #absract method
  async prepareMenu() { throw new Error('Abstract function called without implimentation.') }

  async fetchItemListFromRepoAndPrepareMenu() {

    const response = await curlRequest(this.sourceRepoUrl, {
      parseJson: true
    })
      .catch((error) => {
        print("Failed to fetch list of theme extension scripts.", error)
      }
      )

    await this.prepareMenu(response)
  }

  writeTempItemInTempDir() {
    for (const item of this.downloadItemMenu) {
      const currFile = this.tempDir.concat(item.name);
      const tmpFile = open(currFile, "w+");
      const start = item.about.indexOf('/*') + 2;
      const end = item.about.lastIndexOf('*/') - 2;
      const about = item.about.slice(start, end);
      tmpFile.puts(about);
      tmpFile.close();
      item.tmpFile = currFile;
    }
  }

  async downloadItemInDestinationDir() {

    const itemsToDownload = this.downloadItemMenu
      .filter(script => this.downloadItemList.includes(script.tmpFile));
    if (!choosenScripts) return;
    print('Downloading...')

    const promises = [];
    for (const item of itemsToDownload) {
      print(item.name);
      promises.push(
        curlRequest(item.download_url, {
          outputFile: this.destinationDir.concat('/', item.name)
        })
          .catch(e => { print('Failed to download script ', item.name, '\n', e) })
      )
    };
    this.#cleanUp();
    await Promise.all(promises)
    print('Scripts downloaded.')
  }

  #cleanUp() {
    const tempItemPaths = this.downloadItemMenu.map(script => script.tmpFile).join('\n');
    tempItemPaths.split('\n')
      .forEach(path => remove(path))
  }
}
