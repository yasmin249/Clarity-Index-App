from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import re
import math
import json
import requests
import os

app = Flask(__name__)
CORS(app)

class TextAnalyzer:
    """
    Text analyzer that computes various readability metrics.
    """
    
    def __init__(self):
        # Common suffixes that don't add to complexity
        self.common_suffixes = {'ed', 'es', 'ing', 's', 'ly', 'er', 'est', 'ion', 'tion', 'ness'}
    
    def count_syllables(self, word):
        """
        Estimate syllable count using vowel groups.
        Minimum 1 syllable per word.
        """
        word = word.lower().strip()
        if len(word) <= 3:
            return 1
        
        # Count vowel groups
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = is_vowel
        
        # Adjust for silent 'e'
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def is_complex_word(self, word):
        """
        A word is complex if it has 3+ syllables, excluding proper nouns
        and common suffix variations.
        """
        # Skip proper nouns (capitalized words not at sentence start)
        if word[0].isupper() and len(word) > 1:
            return False
        
        # Clean word of punctuation
        clean_word = re.sub(r'[^\w]', '', word.lower())
        if len(clean_word) < 3:
            return False
        
        syllables = self.count_syllables(clean_word)
        
        # Check if word ends with common suffixes that don't add complexity
        for suffix in self.common_suffixes:
            if clean_word.endswith(suffix) and len(clean_word) > len(suffix):
                base_word = clean_word[:-len(suffix)]
                base_syllables = self.count_syllables(base_word)
                # If removing suffix reduces to < 3 syllables, not complex
                if base_syllables < 3:
                    return False
        
        return syllables >= 3
    
    def analyze_text(self, text):
        """
        Analyze text and return comprehensive metrics.
        """
        if not text or not text.strip():
            return None
        
        # Clean text
        text = text.strip()
        
        # Count paragraphs (split on double line breaks)
        paragraphs = len([p for p in re.split(r'\n\s*\n', text) if p.strip()])
        paragraphs = max(1, paragraphs)
        
        # Count sentences (split on .!?)
        sentence_pattern = r'[.!?]+(?:\s|$)'
        sentences = [s.strip() for s in re.split(sentence_pattern, text) if s.strip()]
        sentence_count = len(sentences)
        
        if sentence_count == 0:
            return None
        
        # Count words (whitespace-delimited, strip punctuation)
        words = []
        word_pattern = r'\b\w+\b'
        for match in re.finditer(word_pattern, text):
            words.append(match.group())
        
        word_count = len(words)
        if word_count == 0:
            return None
        
        # Count syllables and complex words
        total_syllables = 0
        complex_words = 0
        long_words = 0
        
        for word in words:
            syllables = self.count_syllables(word)
            total_syllables += syllables
            
            if self.is_complex_word(word):
                complex_words += 1
            
            # Long words: >8 characters
            if len(word) > 8:
                long_words += 1
        
        # Calculate derived metrics
        asl = word_count / sentence_count  # Average Sentence Length
        pcw = (complex_words / word_count) * 100  # Percent Complex Words
        aspp = sentence_count / paragraphs  # Average Sentences Per Paragraph
        
        # Calculate readability indices
        metrics = {
            'words': word_count,
            'sentences': sentence_count,
            'syllables': total_syllables,
            'complex_words': complex_words,
            'long_words': long_words,
            'paragraphs': paragraphs,
            'asl': round(asl, 2),
            'pcw': round(pcw, 2),
            'aspp': round(aspp, 2)
        }
        
        # 1. Clarity Index = ASL + (100 × complex_words / words)
        metrics['clarity_index'] = round(asl + (100 * complex_words / word_count), 2)
        
        # 2. Gunning Fog = 0.4 × [ASL + (100 × complex_words / words)]
        metrics['gunning_fog'] = round(0.4 * (asl + (100 * complex_words / word_count)), 2)
        
        # 3. Infogineering Index = [ASL + (100 × long_words / words) + (5 × sentences / paragraphs)] / 2
        metrics['infogineering_index'] = round((asl + (100 * long_words / word_count) + (5 * sentence_count / paragraphs)) / 2, 2)
        
        # 4. Flesch Reading Ease = 206.835 - 1.015 × ASL - 84.6 × (syllables / words)
        metrics['flesch_reading_ease'] = round(206.835 - 1.015 * asl - 84.6 * (total_syllables / word_count), 2)
        
        # 5. Flesch-Kincaid Grade = 0.39 × ASL + 11.8 × (syllables / words) - 15.59
        metrics['flesch_kincaid_grade'] = round(0.39 * asl + 11.8 * (total_syllables / word_count) - 15.59, 2)
        
        return metrics

def get_ai_feedback(text, metrics):
    """
    Generate AI feedback using the metrics.
    For demo purposes, this creates structured feedback based on the metrics.
    In production, you would integrate with an AI service like OpenAI or Anthropic.
    """
    
    # Determine confidence based on text length
    word_count = metrics['words']
    sentence_count = metrics['sentences']
    
    if word_count < 50 or sentence_count < 3:
        confidence = "low"
    elif word_count <= 200:
        confidence = "medium"
    else:
        confidence = "high"
    
    # Generate conclusion based on metrics
    clarity_score = metrics['clarity_index']
    if clarity_score <= 30:
        conclusion = "Your text shows good clarity with manageable sentence complexity."
    elif clarity_score <= 45:
        conclusion = "Moderate clarity — some sentences may benefit from simplification."
    else:
        conclusion = "High complexity detected — consider breaking down complex ideas."
    
    # Generate suggestions based on specific metrics
    suggestions = []
    
    if metrics['asl'] > 20:
        suggestions.append(f"Shorten sentences — ASL={metrics['asl']}")
    
    if metrics['pcw'] > 15:
        suggestions.append(f"Reduce complex words — PCW={metrics['pcw']}%")
    
    if metrics['aspp'] > 6:
        suggestions.append(f"Break up paragraphs — ASPP={metrics['aspp']}")
    
    # Fill with general tips if needed
    general_tips = [
        "Use active voice for clarity",
        "Choose simple words over complex ones",
        "Start sentences with the main idea"
    ]
    
    while len(suggestions) < 3:
        suggestions.append(general_tips[len(suggestions) % len(general_tips)])
    
    # Example rewrite (simplified for demo)
    example_rewrite = ""
    if metrics['asl'] > 25:
        example_rewrite = "Consider splitting your longest sentence into two shorter ones."
    
    return {
        "conclusion": conclusion,
        "suggestions": suggestions[:3],
        "example_rewrite": example_rewrite,
        "confidence": confidence
    }

@app.route('/')
def index():
    """Serve the main application page."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """
    Analyze text and return metrics with AI feedback.
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text'].strip()
        method = data.get('method', 'clarity_index')
        
        if not text:
            return jsonify({'error': 'Empty text provided'}), 400
        
        # Analyze text
        analyzer = TextAnalyzer()
        metrics = analyzer.analyze_text(text)
        
        if not metrics:
            return jsonify({'error': 'Unable to analyze text'}), 400
        
        # Get AI feedback
        ai_feedback = get_ai_feedback(text, metrics)
        
        # Combine results
        result = {
            'metrics': metrics,
            'ai_feedback': ai_feedback,
            'selected_method': method
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

