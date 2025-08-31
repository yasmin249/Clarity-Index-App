/**
 * Clarity Index App - Frontend Logic
 * Handles user interactions, API calls, and UI updates
 */

class ClarityApp {
    constructor() {
        this.tipIndex = 0;
        this.tipInterval = null;
        this.writingTips = [
            "Short words often say more than long ones.",
            "One idea per sentence.",
            "Avoid passive voice.",
            "Cut filler words.",
            "Use concrete examples.",
            "Start with your main point.",
            "Write like you speak.",
            "Break up long paragraphs.",
            "Choose familiar words.",
            "End with a clear conclusion."
        ];
        
        this.metricInterpretations = {
            clarity_index: "Target range: 20-40 (≈30 ideal)",
            gunning_fog: "Target: <12 for general audiences",
            infogineering_index: "Target range: 15-25",
            flesch_reading_ease: "Higher scores = easier reading (0-100)",
            flesch_kincaid_grade: "Grade level required to understand text"
        };
        
        this.metricNames = {
            clarity_index: "Clarity Index",
            gunning_fog: "Gunning Fog Index",
            infogineering_index: "Infogineering Index",
            flesch_reading_ease: "Flesch Reading Ease",
            flesch_kincaid_grade: "Flesch-Kincaid Grade"
        };
        
        this.init();
    }
    
    init() {
        this.bindEventListeners();
        this.updateCharCount();
    }
    
    bindEventListeners() {
        const textInput = document.getElementById('textInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const newAnalysisBtn = document.getElementById('newAnalysisBtn');
        const retryBtn = document.getElementById('retryBtn');
        
        // Character counter
        textInput.addEventListener('input', () => this.updateCharCount());
        
        // Analyze button
        analyzeBtn.addEventListener('click', () => this.analyzeText());
        
        // New analysis button
        newAnalysisBtn.addEventListener('click', () => this.resetApp());
        
        // Retry button
        retryBtn.addEventListener('click', () => this.analyzeText());
        
        // Enter key in textarea (Ctrl+Enter to analyze)
        textInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.analyzeText();
            }
        });
    }
    
    updateCharCount() {
        const textInput = document.getElementById('textInput');
        const charCount = document.getElementById('charCount');
        const count = textInput.value.length;
        charCount.textContent = count.toLocaleString();
        
        // Enable/disable analyze button based on text length
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = count < 10;
    }
    
    showSection(sectionId) {
        // Hide all sections
        const sections = ['loadingSection', 'resultsSection', 'errorSection'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        targetSection.classList.remove('hidden');
        targetSection.classList.add('fade-in');
    }
    
    startTipRotation() {
        const tipElement = document.getElementById('rotatingTip');
        
        this.tipInterval = setInterval(() => {
            this.tipIndex = (this.tipIndex + 1) % this.writingTips.length;
            
            // Fade out
            tipElement.style.opacity = '0';
            
            setTimeout(() => {
                tipElement.textContent = this.writingTips[this.tipIndex];
                tipElement.style.opacity = '1';
                tipElement.classList.add('tip-fade-in');
                
                setTimeout(() => {
                    tipElement.classList.remove('tip-fade-in');
                }, 800);
            }, 250);
        }, 3000);
    }
    
    stopTipRotation() {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }
    
    async analyzeText() {
        const textInput = document.getElementById('textInput');
        const methodSelect = document.getElementById('methodSelect');
        
        const text = textInput.value.trim();
        const method = methodSelect.value;
        
        if (!text || text.length < 10) {
            this.showError('Please enter at least 10 characters of text to analyze.');
            return;
        }
        
        // Show loading
        this.showSection('loadingSection');
        this.startTipRotation();
        
        try {
            const response = await fetch('http://127.0.0.1:5000/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    method: method
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed');
            }
            
            const data = await response.json();
            this.displayResults(data, method);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(error.message || 'Failed to analyze text. Please try again.');
        } finally {
            this.stopTipRotation();
        }
    }
    
    displayResults(data, selectedMethod) {
        const metrics = data.metrics;
        const aiFeedback = data.ai_feedback;
        
        // Update primary metric card
        document.getElementById('selectedMetricName').textContent = this.metricNames[selectedMethod];
        document.getElementById('selectedMetricScore').textContent = metrics[selectedMethod];
        document.getElementById('selectedMetricInterpretation').textContent = this.metricInterpretations[selectedMethod];
        
        // Update AI feedback
        document.getElementById('aiConclusion').textContent = aiFeedback.conclusion;
        
        const suggestionsList = document.getElementById('aiSuggestions');
        suggestionsList.innerHTML = '';
        aiFeedback.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
        
        // Update example rewrite
        const exampleRewriteSection = document.getElementById('exampleRewrite');
        const rewriteText = document.getElementById('rewriteText');
        if (aiFeedback.example_rewrite && aiFeedback.example_rewrite.trim()) {
            rewriteText.textContent = aiFeedback.example_rewrite;
            exampleRewriteSection.classList.remove('hidden');
        } else {
            exampleRewriteSection.classList.add('hidden');
        }
        
        // Update confidence level
        const confidenceElement = document.getElementById('confidenceLevel');
        const confidenceContainer = confidenceElement.parentElement;
        confidenceElement.textContent = aiFeedback.confidence.charAt(0).toUpperCase() + aiFeedback.confidence.slice(1);
        
        // Update confidence styling
        confidenceContainer.className = `confidence ${aiFeedback.confidence}`;
        
        // Update detailed metrics
        document.getElementById('wordCount').textContent = metrics.words.toLocaleString();
        document.getElementById('sentenceCount').textContent = metrics.sentences.toLocaleString();
        document.getElementById('paragraphCount').textContent = metrics.paragraphs.toLocaleString();
        document.getElementById('aslMetric').textContent = metrics.asl;
        document.getElementById('pcwMetric').textContent = `${metrics.pcw}%`;
        document.getElementById('asppMetric').textContent = metrics.aspp;
        
        // Update all indices
        document.getElementById('clarityIndexValue').textContent = metrics.clarity_index;
        document.getElementById('gunningFogValue').textContent = metrics.gunning_fog;
        document.getElementById('infoengineeringValue').textContent = metrics.infogineering_index;
        document.getElementById('fleschEaseValue').textContent = metrics.flesch_reading_ease;
        document.getElementById('fleschGradeValue').textContent = metrics.flesch_kincaid_grade;
        
        // Show results
        this.showSection('resultsSection');
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showSection('errorSection');
    }
    
    resetApp() {
        // Clear input
        document.getElementById('textInput').value = '';
        this.updateCharCount();
        
        // Reset to input section
        const sections = ['loadingSection', 'resultsSection', 'errorSection'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        
        // Focus on text input
        document.getElementById('textInput').focus();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClarityApp();
    
    // Add some sample text for demo purposes
    const sampleButton = document.createElement('button');
    sampleButton.textContent = '📝 Try Sample Text';
    sampleButton.className = 'sample-btn';
    sampleButton.style.cssText = `
        background: rgba(255,255,255,0.2);
        color: white;
        border: 2px solid rgba(255,255,255,0.3);
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 15px;
        transition: all 0.3s ease;
    `;
    
    sampleButton.addEventListener('mouseenter', () => {
        sampleButton.style.background = 'rgba(255,255,255,0.3)';
    });
    
    sampleButton.addEventListener('mouseleave', () => {
        sampleButton.style.background = 'rgba(255,255,255,0.2)';
    });
    
    sampleButton.addEventListener('click', () => {
        const sampleText = `The quick brown fox jumps over the lazy dog. This is a simple sentence that demonstrates basic readability principles. However, when we begin to construct increasingly sophisticated and multifaceted sentences that incorporate numerous subordinate clauses, extensive vocabulary, and complex grammatical structures, the readability score deteriorates significantly.

Writing should be clear and concise. Short sentences work well. They help readers understand your message quickly and easily.`;
        
        document.getElementById('textInput').value = sampleText;
        document.querySelector('.char-counter').dispatchEvent(new Event('input', { bubbles: true }));
        
        // Trigger character count update
        const event = new Event('input', { bubbles: true });
        document.getElementById('textInput').dispatchEvent(event);
    });
    
    // Add sample button to header
    document.querySelector('.header').appendChild(sampleButton);
});

// Add CSS for sample button hover effects
const style = document.createElement('style');
style.textContent = `
    .sample-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
`;
document.head.appendChild(style);