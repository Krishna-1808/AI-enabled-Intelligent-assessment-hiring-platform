import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../services/api';

const QuestionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
}));

const TimerBox = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  zIndex: 1000,
}));

function CandidateAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleSubmit();
    }
  }, [timeLeft]);

  const loadAssessment = async () => {
    try {
      const response = await api.get(`/assessments/${assessmentId}/start`);
      setAssessment(response.data);
      setQuestions(response.data.questions);
      setTimeLeft(response.data.duration);
    } catch (err) {
      setError('Failed to load assessment');
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      question_id: questionId,
      answer: answer,
      question_type: questions.find(q => q.id === questionId)?.question_type
    }));

    try {
      await api.post(`/assessments/${assessmentId}/submit`, {
        answers: formattedAnswers,
        time_taken: assessment.duration - timeLeft
      });
      
      navigate(`/results/${assessmentId}`);
    } catch (err) {
      setError('Failed to submit assessment');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!assessment) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <TimerBox>
        <Typography variant="h6" color="primary">
          Time Remaining: {formatTime(timeLeft)}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={(timeLeft / assessment.duration) * 100}
          sx={{ mt: 1 }}
        />
      </TimerBox>

      <Paper sx={{ p: 3, mt: 8 }}>
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {currentQ && (
          <QuestionCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentQ.question_text}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {currentQ.question_type.toUpperCase()} | 
                Skill: {currentQ.skill_category} | 
                Difficulty: {currentQ.difficulty}
              </Typography>

              {currentQ.question_type === 'mcq' && currentQ.options && (
                <RadioGroup
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                >
                  {currentQ.options.map((option, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              )}

              {currentQ.question_type === 'subjective' && (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Type your answer here..."
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              )}

              {currentQ.question_type === 'coding' && (
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder={`Write your ${currentQ.programming_language} code here...`}
                  variant="outlined"
                  sx={{ mt: 2 }}
                  InputProps={{
                    style: {
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }
                  }}
                />
              )}
            </CardContent>
          </QuestionCard>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <Box>
            {currentQuestion < questions.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default CandidateAssessment;
 
  