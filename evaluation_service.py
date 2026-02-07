import json
from typing import Dict, List, Any
import ast
import subprocess
import tempfile
import os
from models import Question, Assessment

class EvaluationService:
    def __init__(self):
        pass
    
    def evaluate_assessment(self, assessment: Assessment, answers: List[Dict]) -> Dict:
        """Evaluate complete assessment"""
        
        total_score = 0
        section_scores = {"mcq": 0, "coding": 0, "subjective": 0}
        skill_scores = {}
        section_counts = {"mcq": 0, "coding": 0, "subjective": 0}
        
        for answer in answers:
            question_id = answer.get('question_id')
            question = Question.query.get(question_id)
            
            if not question:
                continue
            
            # Evaluate based on question type
            if question.question_type == 'mcq':
                score = self.evaluate_mcq(question, answer.get('answer', ''))
                section = 'mcq'
            elif question.question_type == 'coding':
                score = self.evaluate_coding(question, answer.get('code', ''))
                section = 'coding'
            else:  # subjective
                score = self.evaluate_subjective(question, answer.get('answer', ''))
                section = 'subjective'
            
            # Update scores
            total_score += score
            section_scores[section] += score
            section_counts[section] += 1
            
            # Track skill scores
            skill = question.skill_category
            if skill not in skill_scores:
                skill_scores[skill] = []
            skill_scores[skill].append(score)
        
        # Calculate averages
        for section in section_scores:
            if section_counts[section] > 0:
                section_scores[section] = section_scores[section] / section_counts[section]
        
        avg_skill_scores = {}
        for skill, scores in skill_scores.items():
            avg_skill_scores[skill] = sum(scores) / len(scores)
        
        # Calculate total percentage
        total_percentage = (total_score / (len(answers) * 100)) * 100 if answers else 0
        
        return {
            "total_score": total_percentage,
            "section_scores": section_scores,
            "skill_scores": avg_skill_scores,
            "plagiarism_score": self.check_plagiarism(answers)
        }
    
    def evaluate_mcq(self, question: Question, answer: str) -> float:
        """Evaluate multiple choice question"""
        return 100.0 if answer == question.correct_answer else 0.0
    
    def evaluate_coding(self, question: Question, code: str) -> float:
        """Evaluate coding question"""
        
        test_cases = question.test_cases or []
        if not test_cases:
            return 50.0  # Default score if no test cases
        
        passed = 0
        total = len(test_cases)
        
        for test_case in test_cases:
            try:
                # Create temp file with code
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                    # Add code to execute function
                    f.write(code + '\n\n')
                    
                    # Add test execution
                    if question.programming_language == 'python':
                        input_val = test_case.get('input', '')
                        expected = test_case.get('output', '')
                        
                        # Simple execution for demonstration
                        # In production, use secure sandbox
                        f.write(f'result = solution({input_val})\n')
                        f.write(f'print(str(result) == str({expected}))')
                    
                    temp_file = f.name
                
                # Execute code
                result = subprocess.run(
                    ['python', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.stdout.strip() == 'True':
                    passed += 1
                
                # Clean up
                os.unlink(temp_file)
                
            except Exception as e:
                print(f"Error evaluating code: {e}")
                continue
        
        return (passed / total) * 100 if total > 0 else 0
    
    def evaluate_subjective(self, question: Question, answer: str) -> float:
        """Evaluate subjective answer"""
        # Simple evaluation based on length and keywords
        # In production, use AI evaluation from ai_service
        
        if not answer:
            return 0.0
        
        model_answer = question.model_answer or ""
        
        # Calculate similarity (simple version)
        words_answer = set(answer.lower().split())
        words_model = set(model_answer.lower().split())
        
        if not words_model:
            return 50.0  # Default if no model answer
        
        common_words = words_answer.intersection(words_model)
        similarity = len(common_words) / len(words_model)
        
        # Scale to 0-100
        score = min(similarity * 100, 100)
        
        return score
    
    def check_plagiarism(self, answers: List[Dict]) -> float:
        """Simple plagiarism check"""
        # In production, use more sophisticated checking
        text_answers = [a.get('answer', '') for a in answers if a.get('answer')]
        
        if len(text_answers) < 2:
            return 0.0
        
        # Simple length-based similarity
        avg_length = sum(len(a) for a in text_answers) / len(text_answers)
        deviations = [abs(len(a) - avg_length) for a in text_answers]
        
        # High deviation might indicate copied answers
        max_deviation = max(deviations) if deviations else 0
        similarity_score = min(max_deviation / 100, 1.0)  # Normalize
        
        return similarity_score