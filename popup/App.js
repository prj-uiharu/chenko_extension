import React from "react";
import { Snackbar, Alert, FormLabel, Switch, Button, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Dialog, DialogTitle, DialogContent, DialogActions, createTheme, ThemeProvider } from "@mui/material";
import { pink, teal } from "@mui/material/colors";
import Inko from 'inko';
import Statistics from "./Statistics";

// 다국어 리소스를 동적으로 로딩하는 함수
const loadLanguageResource = async (lang) => {
  try {
    const resource = await import(`./langs/${lang}.json`);
    return resource.default;
  } catch (error) {
    console.error('Error loading language resource:', error);
    return {};
  }
};

// 앱 전체 테마 설정
const theme = createTheme({
  palette: {
    primary: pink,
    secondary: teal,
  },
  components: {
    // 버튼 스타일 커스터마이징
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 라운드된 모서리
          margin: "8px", // 여백 추가
          width: "calc(100% - 16px)", // 버튼의 가로 길이 조정
        },
      },
    },
    // 텍스트 필드 스타일 커스터마이징
    MuiTextField: {
      styleOverrides: {
        root: {
          margin: "8px", // 여백 추가
        },
      },
    },
    // 선택 컨트롤 스타일 커스터마이징
    MuiSelect: {
      styleOverrides: {
        select: {
          "&:focus": {
            backgroundColor: "transparent", // 선택 시 배경색 변경 방지
          },
        },
      },
    },
  },
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      language: "en", // 기본값 설정
      textInput: "",
      conversionType: "enko",
      isSettingsOpen: false,
      texts: {}, // 다국어 텍스트를 저장할 상태
      enableDoubleConsonant: false, // 복자음 가능 여부 초기 상태 설정
      copySuccessAlertOpen: false, // 복사 성공 알림의 상태
    };
  }

  async componentDidMount() {
    let language = localStorage.getItem('language') || navigator.language || navigator.userLanguage;
    // 로컬 스토리지에 언어 설정이 없거나 값이 없는 경우, 브라우저 언어 사용
    if (!language || language === "") {
      language = language.startsWith('ko') ? 'ko' : 'en'; // ko로 시작하면 'ko', 아니면 'en'
    }
    this.setState({ language });
    const texts = await loadLanguageResource(language);
    this.setState({ texts });

    // 로컬 스토리지에 복자음 설정이 없는 경우
    const doubleConsonantSetting = localStorage.getItem('DoubleConsonant');
    if (!doubleConsonantSetting) {
      localStorage.setItem('DoubleConsonant', 'no'); // 값이 없으면 'no'로 설정
      this.setState({ enableDoubleConsonant: false });
    } else {
      this.setState({ enableDoubleConsonant: doubleConsonantSetting === "yes" });
    }
  }

  handleLanguageChange = async (event) => {
    const newLanguage = event.target.value;
    this.setState({ language: newLanguage });
    localStorage.setItem('language', newLanguage); // 언어 선택을 로컬 스토리지에 저장
    const texts = await loadLanguageResource(newLanguage);
    this.setState({ texts }); // 다국어 텍스트 상태 업데이트
  };

  handleDoubleConsonantChange = (event) => {
    const newSetting = event.target.checked ? "yes" : "no";
    localStorage.setItem('DoubleConsonant', newSetting); // 로컬 스토리지 업데이트
    this.setState({ enableDoubleConsonant: event.target.checked }); // 상태 업데이트
  };

  handleSaveSettings = () => {
    // 현재 상태의 언어를 로컬 스토리지에 저장하고 설정 창을 닫음
    localStorage.setItem('language', this.state.language);
    this.handleSettingsClose(); // 설정 창을 닫는 메소드 호출
  };

  // 설정 리셋 핸들러
  handleSettingsReset = () => {
    localStorage.clear(); // 모든 로컬 스토리지 항목 삭제
    this.handleSettingsClose(); // 설정 창 닫기
    window.location.reload(); // 페이지 새로고침
  };

  handleTextInputChange = (event) => {
    this.setState({ textInput: event.target.value });
  };

  handleConversionTypeChange = (event) => {
    this.setState({ conversionType: event.target.value });
  };

  handleSettingsOpen = () => {
    this.setState({ isSettingsOpen: true });
  };

  handleSettingsClose = () => {
    this.setState({ isSettingsOpen: false });
  };

  // 변환 로직을 수행하는 메소드
  handleSubmit = (event) => {
    event.preventDefault();
    const { textInput, conversionType, enableDoubleConsonant } = this.state;
  
    const inko = new Inko({ allowDoubleConsonant: enableDoubleConsonant });
  
    let result = "";
    if (conversionType === "enko") {
      result = inko.en2ko(textInput);
      // 영어에서 한글로 변환 시 카운트 증가
      const currentCount = parseInt(localStorage.getItem('enko_count') || '0', 10);
      localStorage.setItem('enko_count', currentCount + 1);
    } else if (conversionType === "koen") {
      result = inko.ko2en(textInput);
      // 한글에서 영어로 변환 시 카운트 증가
      const currentCount = parseInt(localStorage.getItem('koen_count') || '0', 10);
      localStorage.setItem('koen_count', currentCount + 1);
    }
  
    // 입력된 가장 긴 단어의 길이를 로컬 스토리지에 저장
    const words = textInput.split(/\s+/); // 공백으로 단어 분리
    const longestWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);
    const existingLongestWordLength = parseInt(localStorage.getItem('long_word_length') || '0', 10);
    if (longestWordLength > existingLongestWordLength) {
      localStorage.setItem('long_word_length', longestWordLength);
    }
  
    document.getElementById('resultContainer').innerText = result;
  };  

  // 복사 버튼 클릭 핸들러
  handleCopyToClipboard = () => {
    const copyText = document.getElementById("resultContainer").innerText;
    navigator.clipboard.writeText(copyText).then(() => {
      this.setState({ copySuccessAlertOpen: true }); // 복사 성공 시 알림 표시
      setTimeout(() => {
        this.setState({ copySuccessAlertOpen: false }); // 2초 후 알림 숨김
      }, 2000);
    });
  };

  // 알림 닫기 핸들러
  handleCloseSnackbar = () => {
    this.setState({ copySuccessAlertOpen: false });
  };

  render() {
    const { texts } = this.state;
    return (
      <ThemeProvider theme={theme}>
        <div className="App" style={{ padding: "20px", width: "350px", maxHeight: "500px", display: "flex", flexDirection: "column" }}>
          <Button variant="contained" color="primary" onClick={this.handleSettingsOpen} style={{ marginBottom: "10px" }}>{texts.Settings || 'Settings'}</Button>
          {/* 구분선 추가 */}
          <hr style={{ width: "100%", color: "rgba(0, 0, 0, 0.2)", marginBottom: "10px" }} />
          <Dialog open={this.state.isSettingsOpen} onClose={this.handleSettingsClose}>
          <DialogTitle>{texts.Settings || 'Settings'}</DialogTitle>
            <DialogContent>
              <div>
                <FormControl fullWidth margin="dense">
                  <InputLabel>{texts.SelectLanguage || 'Select Language'}</InputLabel>
                  <Select
                    label={texts.SelectLanguage || 'Select Language'}
                    value={this.state.language}
                    onChange={this.handleLanguageChange}
                  >
                    <MenuItem value="en">{texts.LanguageEnglish || 'English'}</MenuItem>
                    <MenuItem value="ko">{texts.LanguageKorean || '한국어'}</MenuItem>
                  </Select>
                  <FormHelperText>{texts.SelectLanguageHelper || 'Select your preferred language.'}</FormHelperText>
                </FormControl>
                {/* 겹자음 가능 여부 Switch */}
                <FormControl fullWidth margin="dense">
                  <FormLabel component="legend">{texts.EnableDoubleConsonant || 'Enable Double Consonant'}</FormLabel>
                    <Switch checked={this.state.enableDoubleConsonant} onChange={this.handleDoubleConsonantChange} />
                    <FormHelperText>{texts.EnableDoubleConsonantHelper1 || 'Enable double consonant in Korean.'}</FormHelperText>
                    <FormHelperText>{texts.EnableDoubleConsonantHelper2 || 'This setting only applies to Alphabet → Hangul conversions.'}</FormHelperText>
                </FormControl>

                <Statistics texts={this.state.texts} />
                <hr style={{ width: "100%", color: "rgba(0, 0, 0, 0.2)", marginTop: "30px", marginBottom: "10px" }} />
              </div>
            </DialogContent>
            <DialogActions>
            <Button onClick={this.handleSaveSettings} color="secondary">{texts.Save || 'Save'}</Button>
              <Button onClick={this.handleSettingsClose}>{texts.Close || 'Close'}</Button>
              <Button onClick={this.handleSettingsReset}>{texts.Reset || 'Reset'}</Button>
            </DialogActions>
            <DialogContent style={{ marginTop: "-35px", overflow: "none"}}><p style={{ fontWeight: "bold"}}>{texts.Version || 'Version'}: 1.2</p></DialogContent>
          </Dialog>
          <FormControl fullWidth margin="dense">
            <InputLabel>{texts.ConversionType || 'Conversion type'}</InputLabel>
            <Select label={texts.ConversionType || 'Conversion type'} value={this.state.conversionType} onChange={this.handleConversionTypeChange}>
              <MenuItem value="enko">{texts.ConvertENKO || 'Alphabet → Hangul'}</MenuItem>
              <MenuItem value="koen">{texts.ConvertKOEN || 'Hangul → Alphabet'}</MenuItem>
            </Select>
          </FormControl>
          <form onSubmit={this.handleSubmit}>
            <TextField label={texts.InputText || 'Input Text'} value={this.state.textInput} onChange={this.handleTextInputChange} fullWidth margin="normal" variant="outlined" />
            <Button variant="contained" color="secondary" type="submit">{texts.Convert || 'Convert'}</Button>
          </form>
          <div style={{ flexGrow: 1, marginTop: "10px"}}>
            <p id="resultContainer"></p>
          <Button variant="contained" color="primary" onClick={this.handleCopyToClipboard}>{texts.CopyClipboard || 'Copy to Clipboard'}</Button>
          <Snackbar open={this.state.copySuccessAlertOpen} autoHideDuration={6000} onClose={this.handleCloseSnackbar}>
            <Alert onClose={this.handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              {texts.CopiedClipboard || 'Copied to Clipboard'}
              <Button color="inherit" size="small" onClick={this.handleCloseSnackbar}>{texts.Close || 'Close'}</Button>
            </Alert>
          </Snackbar>
          </div>
          <hr style={{ width: "100%", color: "rgba(0, 0, 0, 0.2)", marginBottom: "10px" }} />
          <footer style={{ marginTop: "auto" }}>
            <p>Convert library using{" "} <a href="https://github.com/738/inko" target="_blank" rel="noopener noreferrer">Inko</a>{" "}library.</p>
            <p>You can also check out the Hanguly extension on{" "} <a href="https://github.com/prj-uiharu/Hanguly_extension" target="_blank" rel="noopener noreferrer">GitHub!</a></p>
          </footer>
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
