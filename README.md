# Clarity Index App

## Overview

Clarity Index App is a web-based tool that helps writers, editors, and communicators assess the readability and clarity of their text. Users can paste any text, select a readability or clarity metric, and instantly receive detailed feedback, including a summary, actionable writing tips, and a confidence score powered by AI.

## Features

- **Text Analysis:** Paste any text and choose from multiple clarity/readability metrics.
- **Metrics Computed:**
  - **Clarity Index**
  - **Gunning Fog Index**
  - **Infogineering Index**
  - **Flesch Reading Ease**
  - **Flesch–Kincaid Grade**
  - Plus: Average Sentence Length (ASL), Percentage of Complex Words (PCW), Average Sentences per Paragraph (ASPP), and counts for words, sentences, syllables, complex words, long words, and paragraphs.
- **AI Integration:** The backend sends computed metrics to an AI prompt, which returns a JSON response with a conclusion, three writing tips, and a confidence score.
- **User Experience:** The frontend features a clean interface for text input, metric selection, a progress loader with rotating writing tips, and a results panel with conclusions and suggestions.

## How It Works

1. **Paste Text:** Users paste their text into the app.
2. **Select Metric:** Choose which clarity/readability index to compute.
3. **Analyze:** The backend (Python, Flask or FastAPI) processes the text, computes all metrics using robust tokenization and counting rules, and sends them to the AI for feedback.
4. **Results:** The frontend displays the computed metrics, a summary conclusion, three actionable tips, and a confidence score.

## Metrics & Formulas

- **Sentence Count:** Tokenized by `.`, `?`, `!` using a robust algorithm.
- **Word Count:** Whitespace-delimited, punctuation stripped.
- **Syllable Count:** Estimated per word using a dictionary or algorithm.
- **Complex Words:** Words with ≥3 syllables, excluding proper nouns and common suffixes (`-ed`, `-es`, `-ing`).
- **Long Words:** Words with >8 characters.
- **Paragraphs:** Split on double line breaks.

**Formulas:**
- **Clarity Index:** `(words / sentences) + (100 × complex_words / words)` (Target: 20–40, ideal ≈30)
- **Gunning Fog:** `0.4 × [(words / sentences) + (100 × complex_words / words)]` (Target: <12)
- **Infogineering Index:** `[(words / sentences) + (100 × long_words / words) + (5 × sentences / paragraphs)] / 2` (Target: 15–25)
- **Flesch Reading Ease:** `206.835 – 1.015 × (words / sentences) – 84.6 × (syllables / words)` (Higher = easier)
- **Flesch–Kincaid Grade:** `0.39 × (words / sentences) + 11.8 × (syllables / words) – 15.59`

## Example API Response

```json
{
  "metrics": {
    "clarity_index": 28.5,
    "gunning_fog": 11.4,
    "infogineering_index": 19.2,
    "flesch_reading_ease": 62.3,
    "flesch_kincaid_grade": 8.7,
    "asl": 15.2,
    "pcw": 12.5,
    "aspp": 3.1,
    "words": 320,
    "sentences": 21,
    "syllables": 480,
    "complex_words": 40,
    "long_words": 55,
    "paragraphs": 7
  }
}
```

## Getting Started

1. **Install Python dependencies:**
   ```
   pip install -r requirements.txt
   ```
2. **Run the backend:**
   ```
   python app.py
   ```
3. **Open `index.html` in your browser.**

## License

MIT

---
Clarity Index App helps you write with impact and precision. Paste your text, analyze, and improve!