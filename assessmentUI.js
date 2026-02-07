class AssessmentUI {
    constructor(engine) {
        this.engine = engine;
        this.currentQuestionIndex = 0;
        this.init();
    }
    
    init() {
        // Load assessment when page loads
        const urlParams = new URLSearchParams(window.location.search);
        const assessmentId = urlParams.get('id') || 'demo-assessment';
        
        // Load questions from engine
        this.questions = this.engine.loadAssessment(assessmentId);
        
        // Render first question
        this.renderQuestion(0);
        
        // Setup navigation
        this.setupNavigation();
        
        // Start timer
        this.startTimer();
    }
    
    renderQuestion(index) {
        const question = this.questions[index];
        const container = document.getElementById('questionsContainer');
        
        let html = `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <div>
                        <span class="question-type ${question.type}">${question.type.toUpperCase()}</span>
                        <span class="question-skill">${question.skill}</span>
                        <span class="question-difficulty">${question.difficulty}</span>
                        <span class="question-points">${question.points} points</span>
                    </div>
                </div>
                <div class="question-text">
                    ${question.text}
                </div>
        `;
        
        // Render based on question type
        switch(question.type) {
            case 'mcq':
                html += this.renderMCQ(question);
                break;
            case 'coding':
                html += this.renderCoding(question);
                break;
            case 'subjective':
                html += this.renderSubjective(question);
                break;
        }
        
        html += `</div>`;
        container.innerHTML = html;
        
        // Restore previous answer if exists
        this.restoreAnswer(question.id);
        
        // Update navigation dots
        this.updateNavigationDots();
    }
    
    renderMCQ(question) {
        let html = '<div class="options-container">';
        
        question.options.forEach((option, index) => {
            html += `
                <div class="option" data-option="${index}">
                    <input type="radio" name="question-${question.id}" 
                           id="option-${question.id}-${index}" value="${index}">
                    <label for="option-${question.id}-${index}">
                        <span class="option-letter">${String.fromCharCode(65 + index)}.</span>
                        <span class="option-text">${option}</span>
                    </label>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderCoding(question) {
        return `
            <div class="coding-editor-container">
                <div class="editor-header">
                    <span>Language: ${question.language}</span>
                    <button class="btn-small run-code">
                        <i class="fas fa-play"></i> Run Code
                    </button>
                </div>
                <textarea class="code-editor" id="editor-${question.id}" 
                          placeholder="Write your ${question.language} code here...">${question.template}</textarea>
                <div class="test-cases">
                    <h4>Test Cases:</h4>
                    ${question.testCases.map((tc, i) => `
                        <div class="test-case ${tc.isHidden ? 'hidden' : ''}">
                            <div class="test-case-header">
                                <span>Test Case ${i + 1}</span>
                                <span class="test-status pending">Pending</span>
                            </div>
                            ${!tc.isHidden ? `
                                <div class="test-case-details">
                                    <p><strong>Input:</strong> ${tc.input}</p>
                                    <p><strong>Expected:</strong> ${tc.expected}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderSubjective(question) {
        return `
            <div class="subjective-answer-container">
                <textarea class="subjective-editor" 
                          placeholder="Type your answer here (minimum 50 words)..."
                          rows="8"></textarea>
                <div class="word-count">
                    <span>Word Count: <span class="count">0</span></span>
                </div>
                ${question.rubric ? `
                    <div class="scoring-rubric">
                        <h4>Scoring Rubric:</h4>
                        <ul>
                            ${Object.entries(question.rubric).map(([key, value]) => 
                                `<li><strong>${key}:</strong> ${value} points</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
}