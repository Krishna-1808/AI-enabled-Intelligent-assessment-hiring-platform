from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class JobDescription(db.Model):
    __tablename__ = 'job_descriptions'
    
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    company_id = db.Column(db.String(36), db.ForeignKey('companies.id'))
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Extracted skills
    required_skills = db.Column(db.JSON)  # {"Python": 0.9, "SQL": 0.8, ...}
    soft_skills = db.Column(db.JSON)
    experience_level = db.Column(db.String(50))
    tools_technologies = db.Column(db.JSON)
    domain_knowledge = db.Column(db.JSON)
    
    # Assessment settings
    assessment_duration = db.Column(db.Integer, default=3600)  # seconds
    cutoff_score = db.Column(db.Float, default=70.0)
    difficulty_level = db.Column(db.String(20), default="intermediate")
    
    # Relationships
    assessments = db.relationship('Assessment', backref='job_description', lazy=True)
    questions = db.relationship('Question', backref='job_description', lazy=True)

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.String(36), primary_key=True)
    job_description_id = db.Column(db.String(36), db.ForeignKey('job_descriptions.id'))
    question_type = db.Column(db.String(50))  # mcq, coding, subjective
    skill_category = db.Column(db.String(100))
    difficulty = db.Column(db.String(20))  # easy, medium, hard
    question_text = db.Column(db.Text, nullable=False)
    
    # For MCQ
    options = db.Column(db.JSON)  # ["opt1", "opt2", ...]
    correct_answer = db.Column(db.String(500))
    explanation = db.Column(db.Text)
    
    # For coding questions
    code_template = db.Column(db.Text)
    test_cases = db.Column(db.JSON)  # [{"input": "", "output": "", "is_hidden": bool}]
    programming_language = db.Column(db.String(50))
    
    # For subjective questions
    rubric = db.Column(db.JSON)  # Scoring criteria
    model_answer = db.Column(db.Text)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    usage_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    
    # Vector embedding for similarity check (to avoid repetition)
    embedding = db.Column(db.LargeBinary)

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = db.Column(db.String(36), primary_key=True)
    job_description_id = db.Column(db.String(36), db.ForeignKey('job_descriptions.id'))
    candidate_id = db.Column(db.String(36), db.ForeignKey('candidates.id'))
    assessment_code = db.Column(db.String(100), unique=True)
    
    # Assessment status
    status = db.Column(db.String(50), default='pending')  # pending, in_progress, completed, evaluated
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    time_taken = db.Column(db.Integer)  # seconds
    
    # Questions in this assessment
    question_set = db.Column(db.JSON)  # List of question IDs
    
    # Results
    total_score = db.Column(db.Float, default=0.0)
    section_scores = db.Column(db.JSON)  # {"mcq": 85, "coding": 70, "subjective": 80}
    skill_scores = db.Column(db.JSON)  # {"Python": 90, "SQL": 75, ...}
    is_passed = db.Column(db.Boolean, default=False)
    
    # Anti-fraud flags
    plagiarism_score = db.Column(db.Float, default=0.0)
    anomaly_detected = db.Column(db.Boolean, default=False)
    similarity_with_others = db.Column(db.Float, default=0.0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    evaluated_at = db.Column(db.DateTime)

class Candidate(db.Model):
    __tablename__ = 'candidates'
    
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    resume_text = db.Column(db.Text)
    claimed_skills = db.Column(db.JSON)
    experience_years = db.Column(db.Float, default=0)
    
    # Resume parsing data
    parsed_resume_data = db.Column(db.JSON)
    
    # Assessment history
    assessments = db.relationship('Assessment', backref='candidate', lazy=True)
    
    # Statistics
    total_assessments = db.Column(db.Integer, default=0)
    avg_score = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    job_descriptions = db.relationship('JobDescription', backref='company', lazy=True)
    recruiters = db.relationship('User', backref='company', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    company_id = db.Column(db.String(36), db.ForeignKey('companies.id'))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(50), default='recruiter')  # recruiter, admin
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Leaderboard(db.Model):
    __tablename__ = 'leaderboards'
    
    id = db.Column(db.String(36), primary_key=True)
    job_description_id = db.Column(db.String(36), db.ForeignKey('job_descriptions.id'))
    assessment_id = db.Column(db.String(36), db.ForeignKey('assessments.id'))
    candidate_id = db.Column(db.String(36), db.ForeignKey('candidates.id'))
    
    rank = db.Column(db.Integer)
    score = db.Column(db.Float)
    percentile = db.Column(db.Float)
    
    # Performance metrics
    time_efficiency = db.Column(db.Float)  # Questions per minute
    accuracy_rate = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)