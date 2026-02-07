// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const assessmentModal = document.getElementById('assessmentModal');
const modalCloseBtns = document.querySelectorAll('.modal-close');
const getStartedBtn = document.getElementById('getStartedBtn');
const createAssessmentBtn = document.getElementById('createAssessmentBtn');

// Page Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        
        // Update active nav link
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');
        
        // Show selected page
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === `${pageId}-page`) {
                page.classList.add('active');
            }
        });
        
        // Close mobile menu if open
        navMenu.classList.remove('active');
    });
});

// Hamburger Menu
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Modal Functions
function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeAllModals() {
    closeModal(loginModal);
    closeModal(signupModal);
    closeModal(assessmentModal);
}

// Modal Event Listeners
loginBtn.addEventListener('click', () => showModal(loginModal));
signupBtn.addEventListener('click', () => showModal(signupModal));
getStartedBtn.addEventListener('click', () => {
    navLinks.forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-link[data-page="create"]').classList.add('active');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById('create-page').classList.add('active');
});

createAssessmentBtn?.addEventListener('click', () => {
    navLinks.forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-link[data-page="create"]').classList.add('active');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById('create-page').classList.add('active');
});

modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        closeAllModals();
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAllModals();
    }
});

// Assessment Creation Stepper
const steps = document.querySelectorAll('.step');
const stepPanels = document.querySelectorAll('.step-panel');
let currentStep = 1;

function goToStep(stepNumber) {
    // Update stepper
    steps.forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) <= stepNumber) {
            step.classList.add('active');
        }
    });
    
    // Update panels
    stepPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.dataset.step == stepNumber) {
            panel.classList.add('active');
        }
    });
    
    currentStep = stepNumber;
}

// Step Navigation
document.getElementById('nextStep1')?.addEventListener('click', () => goToStep(2));
document.getElementById('nextStep2')?.addEventListener('click', () => goToStep(3));
document.getElementById('nextStep3')?.addEventListener('click', () => goToStep(4));
document.getElementById('prevStep2')?.addEventListener('click', () => goToStep(1));
document.getElementById('prevStep3')?.addEventListener('click', () => goToStep(2));
document.getElementById('prevStep4')?.addEventListener('click', () => goToStep(3));

// AI Analysis Simulation
document.getElementById('analyzeJD')?.addEventListener('click', function() {
    const jdText = document.getElementById('jobDescription').value;
    const jobTitle = document.getElementById('jobTitle').value;
    
    if (!jdText.trim() || !jobTitle.trim()) {
        alert('Please enter job title and description first!');
        return;
    }
    
    // Show loading
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    this.disabled = true;
    
    // Simulate AI analysis
    setTimeout(() => {
        // Extract skills (simulated)
        const skills = ['JavaScript', 'React.js', 'Node.js', 'Python', 'SQL', 'MongoDB', 'AWS', 'Docker'];
        
        // Populate skills container
        const skillsContainer = document.getElementById('skillsContainer');
        skillsContainer.innerHTML = '';
        
        skills.forEach(skill => {
            const skillTag = document.createElement('div');
            skillTag.className = 'skill-tag';
            skillTag.innerHTML = `
                ${skill}
                <i class="fas fa-times remove-skill"></i>
            `;
            skillsContainer.appendChild(skillTag);
        });
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-skill').forEach(btn => {
            btn.addEventListener('click', function() {
                this.parentElement.remove();
            });
        });
        
        // Update preview
        updatePreview();
        
        // Reset button
        this.innerHTML = '<i class="fas fa-robot"></i> Analyze with AI';
        this.disabled = false;
        
        // Auto-advance to next step
        goToStep(2);
    }, 2000);
});

// Add Skill Functionality
document.getElementById('addSkillBtn')?.addEventListener('click', function() {
    const skillInput = document.getElementById('customSkill');
    const skill = skillInput.value.trim();
    
    if (skill) {
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            ${skill}
            <i class="fas fa-times remove-skill"></i>
        `;
        document.getElementById('skillsContainer').appendChild(skillTag);
        skillInput.value = '';
        
        // Add remove functionality
        skillTag.querySelector('.remove-skill').addEventListener('click', function() {
            this.parentElement.remove();
            updatePreview();
        });
        
        updatePreview();
    }
});

// Question Distribution Sliders
const mcqSlider = document.getElementById('mcqSlider');
const codingSlider = document.getElementById('codingSlider');
const subjectiveSlider = document.getElementById('subjectiveSlider');

function updateSliders() {
    const total = parseInt(mcqSlider.value) + parseInt(codingSlider.value) + parseInt(subjectiveSlider.value);
    
    if (total !== 100) {
        // Adjust proportions
        const scale = 100 / total;
        mcqSlider.value = Math.round(mcqSlider.value * scale);
        codingSlider.value = Math.round(codingSlider.value * scale);
        subjectiveSlider.value = Math.round(subjectiveSlider.value * scale);
    }
    
    // Update percentages
    document.getElementById('mcqPercent').textContent = mcqSlider.value;
    document.getElementById('codingPercent').textContent = codingSlider.value;
    document.getElementById('subjectivePercent').textContent = subjectiveSlider.value;
    
    updatePreview();
}

mcqSlider?.addEventListener('input', updateSliders);
codingSlider?.addEventListener('input', updateSliders);
subjectiveSlider?.addEventListener('input', updateSliders);

// Update Preview Function
function updatePreview() {
    // Job title
    const jobTitle = document.getElementById('jobTitle').value || 'Full Stack Developer';
    document.getElementById('previewJobTitle').textContent = `${jobTitle} Assessment`;
    
    // Duration
    const duration = document.getElementById('assessmentDuration').value;
    document.getElementById('previewDuration').textContent = Math.round(duration / 60);
    
    // Questions
    document.getElementById('previewQuestions').textContent = 
        document.getElementById('totalQuestions').value;
    
    // Passing score
    document.getElementById('previewPassingScore').textContent = 
        document.getElementById('passingScore').value;
    
    // Skills
    const previewSkills = document.getElementById('previewSkills');
    previewSkills.innerHTML = '';
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach(tag => {
        const skill = tag.textContent.replace('×', '').trim();
        const skillSpan = document.createElement('span');
        skillSpan.className = 'skill-tag';
        skillSpan.textContent = skill;
        previewSkills.appendChild(skillSpan);
    });
}

// Generate Assessment
document.getElementById('generateAssessment')?.addEventListener('click', function() {
    // Validate
    if (!document.getElementById('jobTitle').value) {
        alert('Please enter a job title');
        return;
    }
    
    // Show success modal
    closeAllModals();
    showModal(assessmentModal);
    
    // Reset form
    setTimeout(() => {
        goToStep(1);
        document.getElementById('create-page').querySelector('form').reset();
        document.getElementById('skillsContainer').innerHTML = '';
        updateSliders();
        updatePreview();
    }, 3000);
});

// Candidate Assessment Timer
let timerInterval;
let totalTime = 3600; // 60 minutes in seconds
let timeLeft = totalTime;

function startTimer() {
    const timeDisplay = document.getElementById('timeRemaining');
    const progressBar = document.getElementById('progressBar');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        
        // Update display
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = (timeLeft / totalTime) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Warning colors
        if (timeLeft < 300) { // 5 minutes left
            timeDisplay.style.color = 'var(--danger-color)';
            progressBar.style.background = 'var(--danger-color)';
        } else if (timeLeft < 600) { // 10 minutes left
            timeDisplay.style.color = 'var(--warning-color)';
            progressBar.style.background = 'var(--warning-color)';
        }
        
        // Time's up
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time\'s up! Assessment will be submitted automatically.');
            submitAssessment();
        }
    }, 1000);
}

// Question Navigation for Candidate Assessment
let currentQuestionIndex = 0;
const questions = [
    {
        type: 'mcq',
        skill: 'JavaScript',
        difficulty: 'medium',
        text: 'What is the output of: console.log(typeof null);',
        options: ['"object"', '"null"', '"undefined"', '"string"'],
        correct: 0
    },
    {
        type: 'coding',
        skill: 'Python',
        difficulty: 'hard',
        text: 'Write a function to find the longest palindrome in a given string.',
        language: 'python',
        template: 'def longest_palindrome(s):\n    # Your code here\n    pass'
    },
    {
        type: 'subjective',
        skill: 'System Design',
        difficulty: 'hard',
        text: 'Explain how you would design a URL shortening service like TinyURL. Discuss database schema, API design, scalability, and caching strategies.'
    }
];

function loadQuestion(index) {
    const container = document.getElementById('questionsContainer');
    const question = questions[index];
    
    let questionHTML = `
        <div class="question-card">
            <div class="question-header">
                <div>
                    <span class="question-type ${question.type}">${question.type.toUpperCase()}</span>
                    <span class="question-skill">${question.skill}</span>
                    <span class="question-difficulty">${question.difficulty}</span>
                </div>
                <div class="question-marks">${question.type === 'mcq' ? '2' : '10'} marks</div>
            </div>
            <div class="question-text">
                ${question.text}
            </div>
    `;
    
    if (question.type === 'mcq') {
        questionHTML += '<div class="options-container">';
        question.options.forEach((option, i) => {
            questionHTML += `
                <div class="option" data-index="${i}">
                    <input type="radio" name="question${index}" value="${i}" id="option${index}_${i}">
                    <label for="option${index}_${i}">${option}</label>
                </div>
            `;
        });
        questionHTML += '</div>';
    } else if (question.type === 'coding') {
        questionHTML += `
            <textarea class="code-editor" placeholder="Write your ${question.language} code here...">${question.template}</textarea>
        `;
    } else {
        questionHTML += `
            <textarea class="answer-textarea" placeholder="Type your answer here..." rows="8"></textarea>
        `;
    }
    
    questionHTML += '</div>';
    container.innerHTML = questionHTML;
    
    // Update question counter
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('totalQuestionCount').textContent = questions.length;
    
    // Add event listeners for MCQs
    if (question.type === 'mcq') {
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input').checked = true;
            });
        });
    }
}

// Initialize assessment page
if (document.getElementById('candidate-page')) {
    // Start timer when page loads
    startTimer();
    
    // Load first question
    loadQuestion(currentQuestionIndex);
    
    // Navigation buttons
    document.getElementById('prevQuestion').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion(currentQuestionIndex);
        }
    });
    
    document.getElementById('nextQuestion').addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        }
    });
    
    // Submit assessment
    document.getElementById('submitAssessment').addEventListener('click', submitAssessment);
}

function submitAssessment() {
    clearInterval(timerInterval);
    
    if (confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
        // Show loading
        document.getElementById('submitAssessment').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        document.getElementById('submitAssessment').disabled = true;
        
        // Simulate submission
        setTimeout(() => {
            // Redirect to results page
            navLinks.forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-link[data-page="reports"]').classList.add('active');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById('reports-page').classList.add('active');
            
            // Scroll to top
            window.scrollTo(0, 0);
        }, 2000);
    }
}

// Populate Leaderboard
function populateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;
    
    const candidates = [
        { name: 'Alex Johnson', score: 89.5, time: '45:30', accuracy: '92%', skills: ['React', 'Node'], status: 'Passed' },
        { name: 'Sarah Miller', score: 87.2, time: '50:15', accuracy: '88%', skills: ['Python', 'ML'], status: 'Passed' },
        { name: 'David Chen', score: 85.8, time: '55:45', accuracy: '85%', skills: ['Java', 'Spring'], status: 'Passed' },
        { name: 'Emma Wilson', score: 82.1, time: '58:20', accuracy: '82%', skills: ['AWS', 'DevOps'], status: 'Passed' },
        { name: 'Michael Brown', score: 78.4, time: '59:50', accuracy: '78%', skills: ['SQL', 'DB'], status: 'Passed' },
        { name: 'Lisa Taylor', score: 68.9, time: '60:00', accuracy: '69%', skills: ['JavaScript'], status: 'Failed' }
    ];
    
    leaderboardBody.innerHTML = '';
    candidates.forEach((candidate, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 4}</td>
            <td>${candidate.name}</td>
            <td><strong>${candidate.score}%</strong></td>
            <td>${candidate.time}</td>
            <td>${candidate.accuracy}</td>
            <td>
                ${candidate.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </td>
            <td><span class="status ${candidate.status.toLowerCase()}">${candidate.status}</span></td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Populate Dashboard Data
function populateDashboard() {
    // Recent assessments
    const recentAssessments = document.getElementById('recent-assessments');
    if (recentAssessments) {
        const assessments = [
            { candidate: 'John Doe', role: 'Full Stack Dev', score: 85, status: 'Passed', date: '2023-10-15' },
            { candidate: 'Jane Smith', role: 'Data Analyst', score: 92, status: 'Passed', date: '2023-10-14' },
            { candidate: 'Mike Johnson', role: 'DevOps Eng', score: 78, status: 'Passed', date: '2023-10-14' },
            { candidate: 'Sarah Williams', role: 'Frontend Dev', score: 65, status: 'Failed', date: '2023-10-13' },
            { candidate: 'Alex Chen', role: 'Backend Eng', score: 88, status: 'Passed', date: '2023-10-12' }
        ];
        
        recentAssessments.innerHTML = '';
        assessments.forEach(assessment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assessment.candidate}</td>
                <td>${assessment.role}</td>
                <td><span class="score ${assessment.score >= 70 ? 'passed' : 'failed'}">${assessment.score}%</span></td>
                <td><span class="status ${assessment.status.toLowerCase()}">${assessment.status}</span></td>
                <td>${assessment.date}</td>
                <td><button class="btn-small">View Report</button></td>
            `;
            recentAssessments.appendChild(row);
        });
    }
    
    // Deadlines
    const deadlinesList = document.querySelector('.deadlines-list');
    if (deadlinesList) {
        const deadlines = [
            { title: 'Data Analyst Assessment', date: '2023-10-20', candidates: 45 },
            { title: 'Full Stack Developer', date: '2023-10-25', candidates: 32 },
            { title: 'DevOps Engineer', date: '2023-10-28', candidates: 28 }
        ];
        
        deadlinesList.innerHTML = '';
        deadlines.forEach(deadline => {
            const item = document.createElement('div');
            item.className = 'deadline-item';
            item.innerHTML = `
                <h4>${deadline.title}</h4>
                <p><i class="far fa-calendar"></i> Due: ${deadline.date}</p>
                <p><i class="fas fa-users"></i> ${deadline.candidates} candidates</p>
            `;
            deadlinesList.appendChild(item);
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for status indicators
    const style = document.createElement('style');
    style.textContent = `
        .status.passed { color: var(--success-color); background: rgba(76, 175, 80, 0.1); padding: 0.25rem 0.75rem; border-radius: 50px; }
        .status.failed { color: var(--danger-color); background: rgba(247, 37, 133, 0.1); padding: 0.25rem 0.75rem; border-radius: 50px; }
        .score.passed { color: var(--success-color); font-weight: bold; }
        .score.failed { color: var(--danger-color); font-weight: bold; }
        .deadline-item { padding: 1rem; border-bottom: 1px solid var(--light-gray); }
        .deadline-item:last-child { border-bottom: none; }
    `;
    document.head.appendChild(style);
    
    // Initialize data
    populateLeaderboard();
    populateDashboard();
    
    // Form input listeners for real-time preview
    const previewInputs = ['jobTitle', 'assessmentDuration', 'totalQuestions', 'passingScore'];
    previewInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });
    
    // Experience level change
    const experienceLevel = document.getElementById('experienceLevel');
    if (experienceLevel) {
        experienceLevel.addEventListener('change', function() {
            // Adjust difficulty based on experience
            const difficultyMap = {
                'fresher': 'easy',
                'junior': 'easy',
                'mid': 'medium',
                'senior': 'hard',
                'lead': 'hard'
            };
            document.getElementById('difficultyLevel').value = difficultyMap[this.value];
            updatePreview();
        });
    }
    
    // Show login modal if returning from assessment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
        showModal(loginModal);
    }
});

// Form validation for signup
document.querySelector('#signupModal .btn-primary')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters long!');
        return;
    }
    
    // Simulate successful signup
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    
    setTimeout(() => {
        closeAllModals();
        alert('Account created successfully! You can now login.');
        showModal(loginModal);
    }, 2000);
});

// Watch Demo button
document.getElementById('watchDemoBtn')?.addEventListener('click', function() {
    alert('Demo video would play here. In production, this would open a video player or modal with the demo video.');
});