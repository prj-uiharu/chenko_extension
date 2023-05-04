const translations = {
  en: {
	english: 'English',
	korean: 'Korean',
	settings: 'Settings',
	language: 'Language:',
	popup_close: 'Close',
	save_change: 'Save changes',
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
	popup_close: '닫기',
	save_change: '설정 저장',
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

let userLanguage = localStorage.getItem('language') || (navigator.language.startsWith('ko') ? 'ko' : 'en');

function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');

  for (const element of elements) {
    const key = element.getAttribute('data-i18n');
    element.textContent = translations[userLanguage][key];
  }
}

document.getElementById('settingsButton').addEventListener('click', () => {
  document.body.classList.add('modal-open');
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.body.classList.remove('modal-open');
});

document.getElementById('modalOverlay').addEventListener('click', () => {
  document.body.classList.remove('modal-open');
});

document.getElementById('settingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const language = document.getElementById('language').value;
  localStorage.setItem('language', language);
  changeLanguage(language);

  document.body.classList.remove('modal-open');
});

function changeLanguage(language) {
  userLanguage = language;
  applyTranslations();
}

document.addEventListener('DOMContentLoaded', () => {
  const language = localStorage.getItem('language');
  if (language) {
    document.getElementById('language').value = language;
    changeLanguage(language);
  }
  applyTranslations();
});


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

document.getElementById('inputForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const textInput = document.getElementById('textInput');
  const svcType = document.getElementById('svcType');
  const resultContainer = document.getElementById('resultContainer');

  const isValid = checkInputValidity(textInput.value, svcType.value);
  textInput.setAttribute('aria-invalid', !isValid);

  if (isValid) {
    try {
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
  }
});

document.getElementById('textInput').addEventListener('input', (event) => {
  const textInput = event.target;
  const svcType = document.getElementById('svcType');

  const isValid = checkInputValidity(textInput.value, svcType.value);

  textInput.setAttribute('aria-invalid', !isValid);
});

document.getElementById('svcType').addEventListener('change', (event) => {
  const textInput = document.getElementById('textInput');
  const svcType = event.target;

  const isValid = checkInputValidity(textInput.value, svcType.value);
  textInput.setAttribute('aria-invalid', !isValid);
});
