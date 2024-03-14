// src/Statistics.js

import React, { useState, useEffect } from "react";
import { Typography, Paper } from "@mui/material";

// props로 texts를 추가합니다.
function Statistics({ texts }) {
  const [koenCount, setKoenCount] = useState(0);
  const [enkoCount, setEnkoCount] = useState(0);
  const [longWordLength, setLongWordLength] = useState(0);

  useEffect(() => {
    const koen = localStorage.getItem("koen_count");
    const enko = localStorage.getItem("enko_count");
    const longWord = localStorage.getItem("long_word_length");

    if (koen) setKoenCount(parseInt(koen, 10)); // 숫자로 변환
    if (enko) setEnkoCount(parseInt(enko, 10)); // 숫자로 변환
    if (longWord) setLongWordLength(parseInt(longWord, 10)); // 숫자로 변환
  }, []);

  return (
    <Paper style={{ padding: "20px", marginTop: "20px" }}>
      <Typography variant="h6">{texts.Statistics || 'Statistics'}</Typography>
      <Typography variant="body1">• {texts.EnglishToKoreanCount || 'Alphabet → Hangul conversions'}: {koenCount}</Typography>
      <Typography variant="body1">• {texts.KoreanToEnglishCount || 'Hangul → Alphabet conversions'}: {enkoCount}</Typography>
      <Typography variant="body1">• {texts.LongestWordLength || 'Longest word length'}: {longWordLength}</Typography>
    </Paper>
  );
}

export default Statistics;

