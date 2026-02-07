-- Core Tables for Assessment Engine
CREATE TABLE assessments (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    skills JSON,
    duration INT,
    passing_score INT,
    difficulty VARCHAR(20),
    total_questions INT,
    question_distribution JSON,
    created_at TIMESTAMP,
    created_by VARCHAR(36)
);

CREATE TABLE questions (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36),
    type VARCHAR(20),
    skill VARCHAR(100),
    difficulty VARCHAR(20),
    question_text TEXT,
    options JSON,
    correct_answer VARCHAR(500),
    programming_language VARCHAR(50),
    test_cases JSON,
    rubric JSON,
    model_answer TEXT,
    points INT
);

CREATE TABLE candidate_answers (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36),
    candidate_id VARCHAR(36),
    question_id VARCHAR(36),
    answer TEXT,
    time_spent INT,
    created_at TIMESTAMP
);

CREATE TABLE assessment_results (
    id VARCHAR(36) PRIMARY KEY,
    assessment_id VARCHAR(36),
    candidate_id VARCHAR(36),
    total_score DECIMAL(5,2),
    section_scores JSON,
    skill_scores JSON,
    time_taken INT,
    is_passed BOOLEAN,
    cheating_flags JSON,
    submitted_at TIMESTAMP
);