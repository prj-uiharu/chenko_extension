// 현재 선택된 텍스트를 반환하는 함수
function getSelectedText() {
  return window.getSelection().toString();
}

// 언어 파일을 로드하는 비동기 함수
async function loadLanguageFile(language) {
  const response = await fetch(`./langs/${language}.json`);
  if (!response.ok) {
    throw new Error('Language file loading failed');
  }
  return response.json();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "loadLanguageFile") {
    const url = chrome.runtime.getURL(`./langs/${request.language}.json`);
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Language file loading failed");
        }
        return response.json();
      })
      .then(data => sendResponse({status: 'success', data: data}))
      .catch(error => sendResponse({status: 'error', error: error.message}));
    return true;  // 유지를 위해 true 반환
  }
});

// 로컬 스토리지에서 설정된 언어를 가져오는 함수를 Promise로 감싸기
function getLanguageSetting() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['language'], function(result) {
      if (result.language) {
        resolve(result.language);
      } else {
        // 브라우저의 기본 언어 설정을 사용
        const browserLanguage = navigator.language || navigator.userLanguage;
        // 언어 코드가 'ko' 또는 'en'에 해당하는지 확인
        const language = browserLanguage.startsWith('ko') ? 'ko' : 'en';
        resolve(language);
      }
    });
  });
}

// 단축키 지정
chrome.commands.onCommand.addListener(function(command) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) return; // 활성 탭이 없는 경우는 무시
    const tab = tabs[0];

    if (command === "koen" || command === "enko") {
      // 현재 페이지에서 선택된 텍스트를 가져오는 스크립트 실행
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: getSelectedText
      }, (injectionResults) => {
        for (const frameResult of injectionResults) {
          const selectedText = frameResult.result;
          if (selectedText) { // 선택된 텍스트가 있는 경우에만 메시지 보내기
            chrome.tabs.sendMessage(tab.id, {action: command, selectedText: selectedText});
          }
        }
      });
    }
  });
});

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const language = await getLanguageSetting();
    const langData = await loadLanguageFile(language);

    chrome.contextMenus.create({
      id: "koen",
      title: langData['koen_title'] || "Convert Hangul → Alphabet misspellings", // 기본값
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "enko",
      title: langData['enko_title'] || "Convert Alphabet → Hangul misspellings", // 기본값
      contexts: ["selection"]
    });
  } catch (error) {
    console.error('Error loading language or creating context menus:', error);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "koen" || info.menuItemId === "enko") {
    chrome.tabs.sendMessage(tab.id, {
      action: info.menuItemId,
      selectedText: info.selectionText
    });
  }
});
