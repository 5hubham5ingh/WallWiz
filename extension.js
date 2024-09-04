//fzf - m--preview = "head -n 20 {}" --preview - window="right:20%,wrap"
import { curlRequest } from '../justjs/src/curl.js'

async function getThemeExtensionScripts() {
  const owner = "5hubham5ingh";
  const repo = "WallWiz";
  const path = "themeExtensionScripts";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const handleError = (error) => {
    print("Failed to fetch list of theme extension scripts.", error)
  }
  const handleSuccess = res => res.filter(script => script.type === 'file');

  return await curlRequest(url, {
    parseJson: true
  })
    .then(handleSuccess)
    .then(async scripts => {
      const promises = [];
      for (const script of scripts) {
        const getScriptPromise = getScriptHead(script.download_url)
          .then(head => ({
            name: script.name,
            about: head,
            download_url: script.download_url
          }));
        promises.push(getScriptPromise);
      }

      return await Promise.all(promises);
    })
    .catch(handleError)
}

async function getScriptHead(url) {
  return curlRequest(url, {
    headers: {
      'Range': 'bytes=0-499'
    }
  }).catch(e => print('Failed to fetch script head', e))
}


await getThemeExtensionScripts().then(res => print(JSON.stringify(res)));


