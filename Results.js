import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import api from '../services/api';

const ScoreCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const SkillProgress = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

function Results() {
  const { assessmentId } = useParams();
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadResults();
  }, [assessmentId]);

  const loadResults = async () => {
    try {
      const [resultsRes, leaderboardRes] = await Promise.all([
        api.get(`/assessments/${assessmentId}/results`),
        api.get(`/leaderboard/${assessmentId.split('-')[0]}`) // Simplified
      ]);
      
      setResults(resultsRes.data);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load results:', err);
    }
  };

  if (!results) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading results...</Typography>
      </Container>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Assessment Results
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <ScoreCard>
              <Typography variant="h3" color={getScoreColor(results.total_score)}>
                {results.total_score.toFixed(1)}%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Overall Score
              </Typography>
              <Box sx={{ mt: 2 }}>
                {results.is_passed ? (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="PASSED" 
                    color="success" 
                    variant="outlined"
                  />
                ) : (
                  <Chip 
                    icon={<CancelIcon />} 
                    label="FAILED" 
                    color="error" 
                    variant="outlined"
                  />
                )}
              </Box>
            </ScoreCard>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Section-wise Performance
                </Typography>
                {results.section_scores && Object.entries(results.section_scores).map(([section, score]) => (
                  <SkillProgress key={section}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {section.toUpperCase()}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={score} 
                        color={getScoreColor(score)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.primary">
                      {score.toFixed(1)}%
                    </Typography>
                  </SkillProgress>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Skill Analysis
                </Typography>
                {results.skill_scores && Object.entries(results.skill_scores).map(([skill, score]) => (
                  <Box key={skill} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{skill}</Typography>
                      <Typography variant="body2">{score.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={score} 
                      color={getScoreColor(score)}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Strengths & Weaknesses
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <TrendingUpIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Strengths
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['Problem Solving', 'Python', 'Algorithms'].map((skill) => (
                      <Chip key={skill} label={skill} color="success" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <TrendingDownIcon color="error" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Weaknesses
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['System Design', 'Database Optimization'].map((skill) => (
                      <Chip key={skill} label={skill} color="error" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {results.rank && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Rank: #{results.rank} (Top {results.percentile?.toFixed(1)}%)
            </Typography>
          </Box>
        )}

        {leaderboard.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Leaderboard
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Percentile</TableCell>
                    <TableCell align="right">Time Efficiency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow 
                      key={entry.rank}
                      sx={entry.rank === results.rank ? { bgcolor: 'action.selected' } : {}}
                    >
                      <TableCell>
                        <Typography variant="h6">#{entry.rank}</Typography>
                      </TableCell>
                      <TableCell>{entry.candidate_name}</TableCell>
                      <TableCell align="right">{entry.score.toFixed(1)}%</TableCell>
                      <TableCell align="right">{entry.percentile.toFixed(1)}%</TableCell>
                      <TableCell align="right">
                        {entry.time_efficiency?.toFixed(1) || 'N/A'} q/min
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="primary">
            Download Detailed Report
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Results;