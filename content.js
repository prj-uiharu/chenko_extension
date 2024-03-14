// content.js

// Inko 라이브러리를 초기화합니다.
const inko = new Inko();

let langData = {};

// 언어 파일을 로드하는 비동기 함수
async function loadLanguageFile(language) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "loadLanguageFile", language: language }, (response) => {
      if (response.status === "success") {
        langData = response.data; // 로드된 언어 파일을 langData에 할당
        resolve();
      } else {
        console.error("Failed to load language file: ", response.error);
        reject(response.error);
      }
    });
  });
}

// 로컬 스토리지에서 설정된 언어를 가져오는 함수를 Promise로 감싸기
function getLanguageSetting() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["language"], function (result) {
      if (result.language) {
        resolve(result.language);
      } else {
        // 브라우저의 기본 언어 설정을 사용
        const browserLanguage = navigator.language || navigator.userLanguage;
        // 언어 코드가 'ko' 또는 'en'에 해당하는지 확인
        const language = browserLanguage.startsWith("ko") ? "ko" : "en";
        resolve(language);
      }
    });
  });
}

// 설정된 언어에 따라 언어 파일을 로드하는 로직 추가
async function initializeLanguage() {
  try {
    const language = await getLanguageSetting();
    await loadLanguageFile(language);
  } catch (error) {
    console.error("Failed to load language file: ", error);
  }
}

// 애플리케이션 초기화 시 언어 설정 로드
initializeLanguage();

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.action === "enko") {
    // 텍스트를 영어로 변환
    if (typeof msg.selectedText !== "string") {
      showModal(
        langData["error"] || "Error",
        langData["NotText"] || "The selected content is not text."
      );
    } else {
      const encodedText = enko(msg.selectedText);
      showModal(langData["Result"] || "Result", encodedText);
    }
  } else if (msg.action === "koen") {
    // 텍스트를 한글로 변환
    if (typeof msg.selectedText !== "string") {
      showModal(
        langData["error"] || "Error",
        langData["NotText"] || "The selected content is not text."
      );
    } else {
      const decodedText = koen(msg.selectedText);
      showModal(langData["Result"] || "Result", decodedText);
    }
  }
});

function enko(str) {
  return inko.en2ko(str);
}

function koen(str) {
  return inko.ko2en(str);
}

function showModal(title, text) {
  const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const modal = document.createElement("div");
  modal.className = "custom-modal";
  modal.style.backgroundColor = isDarkMode ? "#333" : "#f8f9fa";
  modal.style.color = isDarkMode ? "#fff" : "#212529";
  modal.style.padding = "20px";
  modal.style.borderRadius = "15px";
  modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  modal.style.minWidth = "300px";
  modal.style.maxWidth = "500px";
  modal.style.transition = "all 0.3s ease-in-out";

  const titleElement = document.createElement("h2");
  titleElement.textContent = title;
  titleElement.style.marginBottom = "10px";
  modal.appendChild(titleElement);

  // 여기서는 textElement 내용이 다소 변경될 수 있습니다.
  const textContainer = document.createElement("div");
  textContainer.style.maxHeight = "300px";
  textContainer.style.overflow = "auto";
  textContainer.style.marginBottom = "20px";

  const textElement = document.createElement("p");
  // HTML로 직접 줄 바꿈을 추가하지 않고 CSS와 DOM 조작으로 안전하게 처리
  textElement.textContent = text; // XSS 공격 방지를 위해 textContent 사용
  textElement.style.whiteSpace = "pre-wrap"; // 줄바꿈과 공백을 유지
  textContainer.appendChild(textElement);
  modal.appendChild(textContainer);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.textAlign = "center";
  buttonContainer.style.marginTop = "20px";

  const closeButton = document.createElement("button");
  closeButton.textContent = langData["Close"] || "Close";
  applyButtonStyle(closeButton, isDarkMode);
  closeButton.onclick = function () {
    document.body.removeChild(modalBackground);
  };
  buttonContainer.appendChild(closeButton);

  modal.appendChild(buttonContainer);

  const modalBackground = document.createElement("div");
  modalBackground.className = "custom-modal-background";
  modalBackground.style.position = "fixed";
  modalBackground.style.top = 0;
  modalBackground.style.left = 0;
  modalBackground.style.width = "100%";
  modalBackground.style.height = "100%";
  modalBackground.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
  modalBackground.style.display = "flex";
  modalBackground.style.justifyContent = "center";
  modalBackground.style.alignItems = "center";
  modalBackground.style.zIndex = 10000;
  modalBackground.style.transition = "opacity 0.3s ease-in-out";

  modalBackground.appendChild(modal);
  document.body.appendChild(modalBackground);

  modalBackground.addEventListener("click", function (event) {
    if (event.target === modalBackground) {
      document.body.removeChild(modalBackground);
    }
  });

  modal.addEventListener("click", function (event) {
    event.stopPropagation();
  });
}

function applyButtonStyle(button, isDarkMode) {
  button.style.padding = "10px 20px";
  button.style.backgroundColor = isDarkMode ? "#6c757d" : "#007bff";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.style.transition = "background-color 0.3s ease-in-out";
  button.onmouseover = function () {
    this.style.backgroundColor = isDarkMode ? "#5a6268" : "#0056b3";
  };
  button.onmouseout = function () {
    this.style.backgroundColor = isDarkMode ? "#6c757d" : "#007bff";
  };
}

function showNotification(message, isDarkMode) {
  const notification = document.createElement("div");
  notification.style.backgroundColor = isDarkMode ? "#333" : "#323232";
  notification.style.color = isDarkMode ? "#fff" : "white";

  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.left = "50%";
  notification.style.transform = "translateX(-50%)";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "5px";
  notification.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";
  notification.style.transition = "opacity 0.3s ease-in-out";
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
