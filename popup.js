// version
document.getElementById("version").textContent = 1.1;

// languages
const translations = {
  en: {
    english: 'English',
    korean: 'Korean',
    settings: 'Settings',
    language: 'Language:',
    static_title: 'Extension Statistics',
    enko_count: '• EN → KO count:',
    koen_count: '• KO → EN count:',
    long_word_length: '• Longest word length:',
    version: 'Current extension version: ',
    popup_close: 'Close',
    save_change: 'Save',
    reset: 'Reset',
    inputText: 'Text input:',
    conversionType: 'Conversion type:',
    enko: 'Alphabet → Hangul',
    koen: 'Hangul → Alphabet',
    convert: 'Convert!',
    result_title: 'Conversion results',
    rateLimitExceeded: 'API call limit exceeded. Please try again later.',
    errorOccurred: 'An error occurred. Please try again later.',
  },
  ko: {
    english: '영어',
    korean: '한국어',
    settings: '설정',
    language: '언어:',
    static_title: '확장 프로그램 통계',
    enko_count: '• 영어 → 한글 변환 횟수:',
    koen_count: '• 한글 → 영어 변환 횟수:',
    long_word_length: '• 가장 긴 단어 길이:',
    version: '현재 확장 프로그램 버전: ',
    popup_close: '닫기',
    save_change: '저장',
    reset: '초기화',
    inputText: '텍스트 입력:',
    conversionType: '변환 유형:',
    enko: '영어 → 한글',
    koen: '한글 → 영어',
    convert: '변환',
    result_title: '변환 결과',
    rateLimitExceeded: 'API 호출 제한이 초과되었습니다. 잠시 후 다시 시도해주세요.',
    errorOccurred: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
};

// localStorage keys
const storageKeys = {
  language: 'language',
  enko_count: 'enko_count',
  koen_count: 'koen_count',
  long_word_length: 'long_word_length',
};

// Get the stored language or set it based on the user's browser language
let userLanguage = localStorage.getItem(storageKeys.language) || (navigator.language.startsWith('ko') ? 'ko' : 'en');
if (!localStorage.getItem(storageKeys.language)) {
  localStorage.setItem(storageKeys.language, userLanguage);
}

// Apply translations to the elements with 'data-i18n' attribute
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');

  for (const element of elements) {
    const key = element.getAttribute('data-i18n');
    element.textContent = translations[userLanguage][key];
  }
}

// Event listeners
document.getElementById('settingsButton').addEventListener('click', openSettingsModal);
document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
document.getElementById('modalOverlay').addEventListener('click', closeSettingsModal);
document.getElementById('resetButton').addEventListener('click', resetData);
document.getElementById('settingsForm').addEventListener('submit', saveSettings);
document.getElementById('inputForm').addEventListener('submit', processInput);
document.getElementById('textInput').addEventListener('input', validateInput);
document.getElementById('svcType').addEventListener('change', validateInput);

// Open the settings modal
function openSettingsModal() {
  setStatisticsValues();
  document.body.classList.add('modal-open');
}

// Close the settings modal
function closeSettingsModal() {
  document.body.classList.remove('modal-open');
}

// Reset the data in localStorage and reload the page
function resetData() {
  Object.values(storageKeys).forEach(key => localStorage.removeItem(key));
  location.reload();
}

// Save settings and change the language
function saveSettings(event) {
  event.preventDefault();

  const language = document.getElementById('language').value;
  localStorage.setItem(storageKeys.language, language);
  changeLanguage(language);

  closeSettingsModal();
}

// Change the language and apply translations
function changeLanguage(language) {
  userLanguage = language;
  applyTranslations();
}

// Set the statistics values
function setStatisticsValues() {
  const defaultValues = {
    enko_count: 0,
    koen_count: 0,
    long_word_length: 0,
  };

  Object.entries(defaultValues).forEach(([key, defaultValue]) => {
    if (localStorage.getItem(storageKeys[key]) === null) {
      localStorage.setItem(storageKeys[key], defaultValue);
    }
    const element = document.getElementById(key);
    if (element) {
      element.textContent = localStorage.getItem(storageKeys[key]);
    } else {
      console.warn(`Element with id "${key}" not found.`);
    }
  });
}


// Validate the input based on the selected conversion type
function validateInput() {
  const textInput = document.getElementById('textInput');
  const svcType = document.getElementById('svcType');
  const isValid = checkInputValidity(textInput.value, svcType.value);

  textInput.setAttribute('aria-invalid', !isValid);
}

// Check if the input is valid for the given conversion type
function checkInputValidity(input, svcType) {
  const korean = /^[가-힣0-9\s]+$/;
  const english = /^[A-Za-z0-9\s]+$/;

  if (input === '') {
    return false;
  }

  if (svcType === 'enko' && korean.test(input)) {
    return false;
  }

  if (svcType === 'koen' && english.test(input)) {
    return false;
  }

  return true;
}

// Process the input and display the results
async function processInput(event) {
  event.preventDefault();

  const textInput = document.getElementById('textInput');
  const svcType = document.getElementById('svcType');
  const resultContainer = document.getElementById('resultContainer');

  const isValid = checkInputValidity(textInput.value, svcType.value);
  textInput.setAttribute('aria-invalid', !isValid);

  if (isValid) {
    try {
      updateStatistics(svcType.value, textInput.value.length);
      setStatisticsValues();

      const response = await fetch(`https://apis.uiharu.dev/chenko/chenko.php?svctype=${svcType.value}&value=${encodeURIComponent(textInput.value)}`);
      const jsonResponse = await response.json();

      const resultText = document.createElement('p');
      resultText.id = 'resultText';

      if (jsonResponse.error) {
        resultText.textContent = translations[userLanguage].rateLimitExceeded;
      } else {
        resultText.textContent = jsonResponse.modified_value;
      }

      const oldResultText = document.getElementById('resultText');
      if (oldResultText) {
        resultContainer.replaceChild(resultText, oldResultText);
      } else {
        resultContainer.appendChild(resultText);
      }
    } catch (error) {
      displayError();
    }
  }

  // Remove the temporary <br> tag used for spacing(When <br> tag exists)
  const imsi = document.getElementById('imsi');
  if (imsi) {
    imsi.remove();
  }
}

// Update the statistics
function updateStatistics(svcType, inputLength) {
  const enko_countElement = document.getElementById('enko_count');
  const koen_countElement = document.getElementById('koen_count');
  const longWordLengthElement = document.getElementById('long_word_length');

  if (svcType === 'enko') {
    const enko_count = parseInt(localStorage.getItem(storageKeys.enko_count) || '0') + 1;
    localStorage.setItem(storageKeys.enko_count, enko_count);
  } else if (svcType === 'koen') {
    const koen_count = parseInt(localStorage.getItem(storageKeys.koen_count) || '0') + 1;
    localStorage.setItem(storageKeys.koen_count, koen_count);
  }

  const currentlong_word_length = parseInt(localStorage.getItem(storageKeys.long_word_length) || '0');
  if (inputLength > currentlong_word_length) {
    localStorage.setItem(storageKeys.long_word_length, inputLength);
  }
}

// Display the error message
function displayError() {
  const resultContainer = document.getElementById('resultContainer');
  const resultText = document.createElement('p');
  resultText.id = 'resultText';
  resultText.textContent = translations[userLanguage].errorOccurred;

  const oldResultText = document.getElementById('resultText');
  if (oldResultText) {
    resultContainer.replaceChild(resultText, oldResultText);
  } else {
    resultContainer.appendChild(resultText);
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  const language = localStorage.getItem(storageKeys.language);
  if (language) {
    document.getElementById('language').value = language;
    changeLanguage(language);
  }
  applyTranslations();
  setStatisticsValues();
});
