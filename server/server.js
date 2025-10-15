const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');

// Simple UUID v4 generator function
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage
let votes = [];
let userVotes = new Set(); // Track users who have voted

// Team mapping
const TEAM_NAMES = {
  'team-a': 'Team 01',
  'team-b': 'Team 02',
  'team-c': 'Team 03',
  'team-d': 'Team 04',
};

// Helper function to calculate vote results
const calculateResults = () => {
  const results = {
    'team-a': 0,
    'team-b': 0,
    'team-c': 0,
    'team-d': 0,
  };

  votes.forEach(vote => {
    if (results.hasOwnProperty(vote.votedFor)) {
      results[vote.votedFor]++;
    }
  });

  return results;
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get current vote results
app.get('/api/results', (req, res) => {
  const results = calculateResults();
  const totalVotes = votes.length;
  
  const formattedResults = Object.entries(results).map(([teamId, count]) => ({
    teamId,
    teamName: TEAM_NAMES[teamId],
    votes: count,
    percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
  }));

  res.json({
    results: formattedResults,
    totalVotes,
    timestamp: new Date().toISOString(),
  });
});

// Check if user has voted
app.get('/api/vote-status/:identifier', (req, res) => {
  const { identifier } = req.params;
  const hasVoted = userVotes.has(identifier);
  
  res.json({
    hasVoted,
    identifier,
  });
});

// Submit a vote
app.post('/api/vote', (req, res) => {
  try {
    const { userTeam, votedFor, userIdentifier } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Validation
    if (!userTeam || !votedFor || !userIdentifier) {
      return res.status(400).json({
        error: 'Missing required fields: userTeam, votedFor, userIdentifier',
      });
    }

    // Check if valid teams
    const validTeams = ['team-a', 'team-b', 'team-c', 'team-d'];
    if (!validTeams.includes(userTeam) || !validTeams.includes(votedFor)) {
      return res.status(400).json({
        error: 'Invalid team IDs',
      });
    }

    // Check if user is voting for their own team
    if (userTeam === votedFor) {
      return res.status(400).json({
        error: 'Cannot vote for your own team',
      });
    }

    // Check if user has already voted
    if (userVotes.has(userIdentifier)) {
      return res.status(409).json({
        error: 'User has already voted',
        hasVoted: true,
      });
    }

    // Create vote record
    const vote = {
      id: uuidv4(),
      userTeam,
      votedFor,
      timestamp: new Date(),
      ipAddress: clientIP,
    };

    // Store vote
    votes.push(vote);
    userVotes.add(userIdentifier);

    console.log(`✅ New vote: ${TEAM_NAMES[userTeam]} voted for ${TEAM_NAMES[votedFor]}`);

    // Return updated results
    const results = calculateResults();
    const totalVotes = votes.length;

    res.status(201).json({
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        userTeam: TEAM_NAMES[userTeam],
        votedFor: TEAM_NAMES[votedFor],
        timestamp: vote.timestamp,
      },
      results,
      totalVotes,
    });

  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get all votes (admin endpoint)
app.get('/api/admin/votes', (req, res) => {
  const formattedVotes = votes.map(vote => ({
    id: vote.id,
    userTeam: TEAM_NAMES[vote.userTeam],
    votedFor: TEAM_NAMES[vote.votedFor],
    timestamp: vote.timestamp,
  }));

  res.json({
    votes: formattedVotes,
    totalVotes: votes.length,
    uniqueVoters: userVotes.size,
  });
});

// Reset votes (admin endpoint)
app.post('/api/admin/reset', (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'RESET_ALL_VOTES') {
    return res.status(400).json({
      error: 'Must provide confirmation: { "confirm": "RESET_ALL_VOTES" }',
    });
  }

  votes = [];
  userVotes.clear();

  console.log('🔄 All votes have been reset');

  res.json({
    success: true,
    message: 'All votes have been reset',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Voting server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/results - Get vote results`);
  console.log(`   POST /api/vote - Submit a vote`);
  console.log(`   GET  /api/vote-status/:id - Check if user voted`);
  console.log(`   GET  /api/admin/votes - Get all votes (admin)`);
  console.log(`   POST /api/admin/reset - Reset all votes (admin)`);
});

module.exports = app;
