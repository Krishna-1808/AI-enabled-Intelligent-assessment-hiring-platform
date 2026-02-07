from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import uuid
from datetime import datetime, timedelta
import json
import os

from IITG.project_route.config import Config
from IITG.models.models import db, JobDescription, Question, Assessment, Candidate, User, Company, Leaderboard
from services.ai_service import AIService, QuestionBankManager
from services.evaluation_service import EvaluationService

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
jwt = JWTManager(app)

# Initialize database
db.init_app(app)

# Initialize services
ai_service = AIService()
question_manager = QuestionBankManager()
evaluation_service = EvaluationService()

# Create tables
with app.app_context():
    db.create_all()

# ============ Authentication Routes ============

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if company exists or create new
    company = Company.query.filter_by(email=data.get('company_email')).first()
    if not company:
        company = Company(
            id=str(uuid.uuid4()),
            name=data.get('company_name'),
            email=data.get('company_email')
        )
        db.session.add(company)
        db.session.commit()
    
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        company_id=company.id,
        email=data.get('email'),
        password_hash=data.get('password'),  # In production, hash this
        role='recruiter'
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        "message": "Registration successful",
        "user_id": user.id,
        "company_id": company.id
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    
    if user and user.password_hash == data.get('password'):  # Simple check
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "user_id": user.id,
            "company_id": user.company_id,
            "role": user.role
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# ============ Job Description Routes ============

@app.route('/api/job-descriptions', methods=['POST'])
@jwt_required()
def create_job_description():
    user_id = get_jwt_identity()
    data = request.json
    
    # Parse JD using AI
    jd_text = data.get('description', '')
    parsed_data = ai_service.parse_job_description(jd_text)
    
    # Create JobDescription
    jd = JobDescription(
        id=str(uuid.uuid4()),
        title=data.get('title'),
        description=jd_text,
        company_id=data.get('company_id'),
        created_by=user_id,
        required_skills=parsed_data.get('technical_skills', {}),
        soft_skills=parsed_data.get('soft_skills', []),
        experience_level=parsed_data.get('experience_level', 'mid'),
        tools_technologies=parsed_data.get('tools_technologies', []),
        domain_knowledge=parsed_data.get('domain_knowledge', []),
        assessment_duration=data.get('duration', 3600),
        cutoff_score=data.get('cutoff', 70.0),
        difficulty_level=parsed_data.get('difficulty_level', 'medium')
    )
    
    db.session.add(jd)
    
    # Generate questions
    questions_data = ai_service.generate_questions(parsed_data, num_questions=20)
    
    for q_data in questions_data:
        question = Question(
            id=str(uuid.uuid4()),
            job_description_id=jd.id,
            question_type=q_data.get('question_type', 'mcq'),
            skill_category=q_data.get('skill_category', 'general'),
            difficulty=q_data.get('difficulty', 'medium'),
            question_text=q_data.get('question_text', ''),
            options=q_data.get('options', []),
            correct_answer=q_data.get('correct_answer', ''),
            programming_language=q_data.get('programming_language'),
            code_template=q_data.get('code_template', ''),
            test_cases=q_data.get('test_cases', []),
            model_answer=q_data.get('model_answer', ''),
            rubric=q_data.get('rubric', {})
        )
        db.session.add(question)
    
    db.session.commit()
    
    return jsonify({
        "message": "Job description created with questions",
        "job_id": jd.id,
        "parsed_data": parsed_data
    }), 201

# ============ Candidate Assessment Routes ============

@app.route('/api/assessments/start', methods=['POST'])
def start_assessment():
    data = request.json
    candidate_email = data.get('email')
    
    # Find or create candidate
    candidate = Candidate.query.filter_by(email=candidate_email).first()
    if not candidate:
        candidate = Candidate(
            id=str(uuid.uuid4()),
            email=candidate_email,
            name=data.get('name', ''),
            resume_text=data.get('resume_text', '')
        )
        db.session.add(candidate)
    
    jd = JobDescription.query.get(data.get('job_id'))
    if not jd:
        return jsonify({"error": "Job description not found"}), 404
    
    # Get unique questions
    all_questions = Question.query.filter_by(job_description_id=jd.id, is_active=True).all()
    questions_data = [{
        'id': q.id,
        'question_type': q.question_type,
        'skill_category': q.skill_category,
        'difficulty': q.difficulty,
        'question_text': q.question_text,
        'options': q.options
    } for q in all_questions]
    
    # Select unique questions
    selected_questions = question_manager.get_unique_questions(questions_data, 10)
    
    # Create assessment
    assessment = Assessment(
        id=str(uuid.uuid4()),
        job_description_id=jd.id,
        candidate_id=candidate.id,
        assessment_code=f"ASS-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}",
        status='in_progress',
        start_time=datetime.utcnow(),
        question_set=[q['id'] for q in selected_questions]
    )
    
    db.session.add(assessment)
    db.session.commit()
    
    return jsonify({
        "assessment_id": assessment.id,
        "questions": selected_questions,
        "duration": jd.assessment_duration,
        "start_time": assessment.start_time.isoformat()
    }), 200

@app.route('/api/assessments/<assessment_id>/submit', methods=['POST'])
def submit_assessment(assessment_id):
    data = request.json
    answers = data.get('answers', [])
    
    assessment = Assessment.query.get(assessment_id)
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404
    
    # Evaluate answers
    evaluation_result = evaluation_service.evaluate_assessment(assessment, answers)
    
    # Update assessment
    assessment.status = 'completed'
    assessment.completed_at = datetime.utcnow()
    assessment.total_score = evaluation_result['total_score']
    assessment.section_scores = evaluation_result['section_scores']
    assessment.skill_scores = evaluation_result['skill_scores']
    assessment.is_passed = evaluation_result['total_score'] >= assessment.job_description.cutoff_score
    assessment.plagiarism_score = evaluation_result.get('plagiarism_score', 0)
    
    # Update candidate stats
    candidate = Candidate.query.get(assessment.candidate_id)
    candidate.total_assessments += 1
    candidate.avg_score = (candidate.avg_score * (candidate.total_assessments - 1) + 
                          evaluation_result['total_score']) / candidate.total_assessments
    
    # Update leaderboard
    update_leaderboard(assessment)
    
    db.session.commit()
    
    return jsonify({
        "assessment_result": evaluation_result,
        "is_passed": assessment.is_passed,
        "cutoff_score": assessment.job_description.cutoff_score
    }), 200

# ============ Evaluation & Results Routes ============

@app.route('/api/assessments/<assessment_id>/results', methods=['GET'])
def get_assessment_results(assessment_id):
    assessment = Assessment.query.get(assessment_id)
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404
    
    # Get detailed results
    results = {
        "assessment_id": assessment.id,
        "candidate_name": assessment.candidate.name,
        "total_score": assessment.total_score,
        "section_scores": assessment.section_scores,
        "skill_scores": assessment.skill_scores,
        "is_passed": assessment.is_passed,
        "time_taken": assessment.time_taken,
        "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None,
        "plagiarism_score": assessment.plagiarism_score,
        "anomaly_detected": assessment.anomaly_detected
    }
    
    # Get rank
    leaderboard_entry = Leaderboard.query.filter_by(
        assessment_id=assessment_id
    ).first()
    
    if leaderboard_entry:
        results['rank'] = leaderboard_entry.rank
        results['percentile'] = leaderboard_entry.percentile
    
    return jsonify(results), 200

@app.route('/api/jobs/<job_id>/leaderboard', methods=['GET'])
def get_leaderboard(job_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    leaderboard = Leaderboard.query.filter_by(
        job_description_id=job_id
    ).order_by(
        Leaderboard.score.desc()
    ).paginate(page=page, per_page=per_page)
    
    result = []
    for entry in leaderboard.items:
        result.append({
            "rank": entry.rank,
            "candidate_name": entry.candidate.name,
            "score": entry.score,
            "percentile": entry.percentile,
            "time_efficiency": entry.time_efficiency,
            "accuracy_rate": entry.accuracy_rate
        })
    
    return jsonify({
        "leaderboard": result,
        "total": leaderboard.total,
        "pages": leaderboard.pages,
        "current_page": page
    }), 200

@app.route('/api/candidates/<candidate_id>/report', methods=['GET'])
def get_candidate_report(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    
    assessments = Assessment.query.filter_by(candidate_id=candidate_id).all()
    
    # Analyze performance
    skill_performance = {}
    for assessment in assessments:
        if assessment.skill_scores:
            for skill, score in assessment.skill_scores.items():
                if skill not in skill_performance:
                    skill_performance[skill] = []
                skill_performance[skill].append(score)
    
    # Calculate averages
    avg_skill_scores = {}
    for skill, scores in skill_performance.items():
        avg_skill_scores[skill] = sum(scores) / len(scores)
    
    # Identify strengths and weaknesses
    sorted_skills = sorted(avg_skill_scores.items(), key=lambda x: x[1], reverse=True)
    strengths = [skill for skill, score in sorted_skills[:3] if score >= 70]
    weaknesses = [skill for skill, score in sorted_skills[-3:] if score < 70]
    
    report = {
        "candidate_id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "total_assessments": candidate.total_assessments,
        "average_score": candidate.avg_score,
        "skill_performance": avg_skill_scores,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "assessment_history": [
            {
                "job_title": assessment.job_description.title,
                "score": assessment.total_score,
                "status": "Passed" if assessment.is_passed else "Failed",
                "date": assessment.completed_at.isoformat() if assessment.completed_at else None
            }
            for assessment in assessments
        ]
    }
    
    return jsonify(report), 200

# ============ Utility Functions ============

def update_leaderboard(assessment: Assessment):
    """Update leaderboard for a job role"""
    
    # Get all assessments for this job
    all_assessments = Assessment.query.filter_by(
        job_description_id=assessment.job_description_id,
        status='completed'
    ).order_by(Assessment.total_score.desc()).all()
    
    # Calculate ranks
    for idx, assmt in enumerate(all_assessments, 1):
        percentile = (len(all_assessments) - idx) / len(all_assessments) * 100
        
        leaderboard = Leaderboard.query.filter_by(
            job_description_id=assmt.job_description_id,
            assessment_id=assmt.id
        ).first()
        
        if not leaderboard:
            leaderboard = Leaderboard(
                id=str(uuid.uuid4()),
                job_description_id=assmt.job_description_id,
                assessment_id=assmt.id,
                candidate_id=assmt.candidate_id
            )
            db.session.add(leaderboard)
        
        leaderboard.rank = idx
        leaderboard.score = assmt.total_score
        leaderboard.percentile = percentile
        
        # Calculate time efficiency if time_taken is available
        if assmt.time_taken and len(assmt.question_set) > 0:
            leaderboard.time_efficiency = len(assmt.question_set) / (assmt.time_taken / 60)
    
    db.session.commit()

# ============ Admin Routes ============

@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    # Get statistics
    total_candidates = Candidate.query.count()
    total_assessments = Assessment.query.count()
    total_jobs = JobDescription.query.count()
    
    # Recent activity
    recent_assessments = Assessment.query.order_by(
        Assessment.created_at.desc()
    ).limit(10).all()
    
    recent_activity = []
    for assessment in recent_assessments:
        recent_activity.append({
            "candidate": assessment.candidate.name,
            "job_title": assessment.job_description.title,
            "score": assessment.total_score,
            "status": assessment.status,
            "time": assessment.created_at.isoformat()
        })
    
    return jsonify({
        "total_candidates": total_candidates,
        "total_assessments": total_assessments,
        "total_jobs": total_jobs,
        "recent_activity": recent_activity
    }), 200

# ============ Error Handlers ============

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)