import openai
import json
import re
from typing import Dict, List, Any
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import textstat
from IITG.project_route.config import Config

# Download NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

class AIService:
    def __init__(self):
        self.openai_api_key = Config.OPENAI_API_KEY
        openai.api_key = self.openai_api_key
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2',device='cpu')
        
    def parse_job_description(self, jd_text: str) -> Dict:
        """Extract skills and requirements from job description"""
        
        prompt = f"""
        Analyze this job description and extract the following information in JSON format:
        
        Job Description: {jd_text}
        
        Extract:
        1. Required technical skills with proficiency level (0-1 scale)
        2. Required soft skills
        3. Experience level (fresher, junior, mid, senior, lead)
        4. Tools and technologies mentioned
        5. Domain knowledge areas
        6. Key responsibilities
        7. Difficulty level for assessment (easy, medium, hard)
        
        Format the response as JSON with these keys:
        technical_skills, soft_skills, experience_level, tools_technologies, 
        domain_knowledge, responsibilities, difficulty_level
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Fallback to rule-based extraction
            return self._fallback_jd_parsing(jd_text)
    
    def _fallback_jd_parsing(self, jd_text: str) -> Dict:
        """Rule-based fallback for JD parsing"""
        skills_list = [
            'python', 'java', 'javascript', 'react', 'angular', 'node', 'sql',
            'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning',
            'data analysis', 'devops', 'agile', 'scrum'
        ]
        
        found_skills = {}
        text_lower = jd_text.lower()
        
        for skill in skills_list:
            if skill in text_lower:
                found_skills[skill] = 0.8  # Default proficiency
        
        return {
            "technical_skills": found_skills,
            "soft_skills": ["communication", "teamwork"],
            "experience_level": "mid",
            "tools_technologies": list(found_skills.keys()),
            "domain_knowledge": [],
            "responsibilities": [],
            "difficulty_level": "medium"
        }
    
    def generate_questions(self, jd_data: Dict, num_questions: int = 10) -> List[Dict]:
        """Generate questions based on job requirements"""
        
        skills = list(jd_data.get('technical_skills', {}).keys())
        if not skills:
            skills = ["general programming", "problem solving"]
        
        prompt = f"""
        Generate {num_questions} assessment questions for a {jd_data.get('experience_level', 'mid')} 
        level position with these skills: {', '.join(skills[:5])}
        
        Create a mix of:
        1. Multiple Choice Questions (MCQs) - 40%
        2. Coding/Programming Questions - 30%
        3. Subjective/Scenario-based Questions - 30%
        
        Difficulty level: {jd_data.get('difficulty_level', 'medium')}
        
        For each question provide:
        - question_type: "mcq", "coding", or "subjective"
        - skill_category: which skill this tests
        - difficulty: "easy", "medium", "hard"
        - question_text: the actual question
        - For MCQs: options array and correct_answer
        - For coding: code_template, test_cases, programming_language
        - For subjective: model_answer and rubric
        
        Return as JSON array.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            questions = json.loads(response.choices[0].message.content)
            return questions
            
        except Exception as e:
            return self._generate_fallback_questions(skills, num_questions)
    
    def _generate_fallback_questions(self, skills: List[str], num_questions: int) -> List[Dict]:
        """Generate fallback questions"""
        questions = []
        
        # Template questions
        mcq_templates = [
            {
                "question": f"What is the time complexity of binary search?",
                "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
                "answer": "O(log n)",
                "skill": "algorithms"
            }
        ]
        
        coding_templates = [
            {
                "question": "Write a function to reverse a string",
                "language": "python",
                "test_cases": [{"input": "'hello'", "output": "'olleh'"}]
            }
        ]
        
        for i in range(min(num_questions, 5)):
            if i < 3:  # MCQs
                questions.append({
                    "question_type": "mcq",
                    "skill_category": skills[0] if skills else "programming",
                    "difficulty": "easy",
                    "question_text": f"Which of these is a characteristic of {skills[0] if skills else 'OOP'}?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option B"
                })
            elif i < 5:  # Coding
                questions.append({
                    "question_type": "coding",
                    "skill_category": skills[0] if skills else "programming",
                    "difficulty": "medium",
                    "question_text": f"Write a function to implement {skills[0] if skills else 'a sorting algorithm'}",
                    "programming_language": "python",
                    "code_template": "def solution(input):\n    # Your code here\n    return result",
                    "test_cases": [{"input": "test", "output": "expected"}]
                })
        
        return questions
    
    def evaluate_subjective_answer(self, question: Dict, answer: str) -> Dict:
        """AI-based evaluation of subjective answers"""
        
        prompt = f"""
        Evaluate this answer for the question:
        
        Question: {question.get('question_text')}
        
        Model Answer/Rubric: {question.get('model_answer', question.get('rubric', ''))}
        
        Candidate's Answer: {answer}
        
        Provide evaluation in JSON format with:
        - score: (0-100)
        - feedback: detailed feedback
        - strengths: list of strengths in the answer
        - weaknesses: list of weaknesses
        - plagiarism_flag: boolean if answer seems copied
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            evaluation = json.loads(response.choices[0].message.content)
            return evaluation
            
        except Exception as e:
            return {
                "score": 50,
                "feedback": "Automated evaluation unavailable",
                "strengths": [],
                "weaknesses": ["Could not evaluate"],
                "plagiarism_flag": False
            }
    
    def detect_plagiarism(self, answers: List[str]) -> float:
        """Detect similarity between answers"""
        if len(answers) < 2:
            return 0.0
        
        embeddings = self.embedding_model.encode(answers)
        similarities = cosine_similarity(embeddings)
        
        # Get max similarity excluding self-comparison
        np.fill_diagonal(similarities, 0)
        max_similarity = np.max(similarities)
        
        return float(max_similarity)
    
    def analyze_skill_gaps(self, candidate_skills: Dict, required_skills: Dict) -> Dict:
        """Analyze gaps between candidate and required skills"""
        skill_gaps = {}
        
        for skill, required_proficiency in required_skills.items():
            candidate_proficiency = candidate_skills.get(skill, 0)
            gap = max(0, required_proficiency - candidate_proficiency)
            
            if gap > 0.2:  # Significant gap
                skill_gaps[skill] = {
                    "required": required_proficiency,
                    "current": candidate_proficiency,
                    "gap": gap,
                    "priority": "high" if gap > 0.5 else "medium"
                }
        
        return skill_gaps

class QuestionBankManager:
    """Manage question bank to avoid repetition"""
    
    def __init__(self):
        self.used_questions = set()
    
    def get_unique_questions(self, all_questions: List[Dict], num_needed: int) -> List[Dict]:
        """Select unique questions that haven't been used recently"""
        
        # Filter out recently used questions
        available = [q for q in all_questions if q.get('id') not in self.used_questions]
        
        if len(available) < num_needed:
            # Reset if we're running out of questions
            self.used_questions.clear()
            available = all_questions
        
        # Select random subset
        import random
        selected = random.sample(available, min(num_needed, len(available)))
        
        # Mark as used
        for q in selected:
            self.used_questions.add(q.get('id'))
        
        return selected