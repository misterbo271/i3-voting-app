const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

import type { Request, Response, NextFunction } from 'express';

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

// In-memory storage (in production, use a database)
interface Vote {
  id: string;
  userTeam: string;
  votedFor: string;
  timestamp: Date;
  ipAddress?: string;
}

interface VoteResults {
  'team-a': number;
  'team-b': number;
  'team-c': number;
  'team-d': number;
}

let votes: Vote[] = [];
let userVotes: Set<string> = new Set(); // Track users who have voted (by IP or session)

// Team mapping
const TEAM_NAMES = {
  'team-a': 'Team 01',
  'team-b': 'Team 02',
  'team-c': 'Team 03',
  'team-d': 'Team 04',
};

// Helper function to calculate vote results
const calculateResults = (): VoteResults => {
  const results: VoteResults = {
    'team-a': 0,
    'team-b': 0,
    'team-c': 0,
    'team-d': 0,
  };

  votes.forEach(vote => {
    if (results.hasOwnProperty(vote.votedFor)) {
      results[vote.votedFor as keyof VoteResults]++;
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
    teamName: TEAM_NAMES[teamId as keyof typeof TEAM_NAMES],
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
    const vote: Vote = {
      id: uuidv4(),
      userTeam,
      votedFor,
      timestamp: new Date(),
      ipAddress: clientIP,
    };

    // Store vote
    votes.push(vote);
    userVotes.add(userIdentifier);

    console.log(`✅ New vote: ${TEAM_NAMES[userTeam as keyof typeof TEAM_NAMES]} voted for ${TEAM_NAMES[votedFor as keyof typeof TEAM_NAMES]}`);

    // Return updated results
    const results = calculateResults();
    const totalVotes = votes.length;

    res.status(201).json({
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        userTeam: TEAM_NAMES[userTeam as keyof typeof TEAM_NAMES],
        votedFor: TEAM_NAMES[votedFor as keyof typeof TEAM_NAMES],
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
    userTeam: TEAM_NAMES[vote.userTeam as keyof typeof TEAM_NAMES],
    votedFor: TEAM_NAMES[vote.votedFor as keyof typeof TEAM_NAMES],
    timestamp: vote.timestamp,
  }));

  res.json({
    votes: formattedVotes,
    totalVotes: votes.length,
    uniqueVoters: userVotes.size,
  });
});

// Reset votes (admin endpoint - use with caution)
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

// Reset all device IP IDs (admin endpoint - allows all users to vote again)
app.post('/api/admin/reset-devices', (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'RESET_ALL_DEVICES') {
    return res.status(400).json({
      error: 'Must provide confirmation: { "confirm": "RESET_ALL_DEVICES" }',
    });
  }

  const previousVoterCount = userVotes.size;
  userVotes.clear();

  console.log(`🔄 All device IDs have been reset. ${previousVoterCount} users can now vote again.`);

  res.json({
    success: true,
    message: `All device IDs have been reset. ${previousVoterCount} users can now vote again.`,
    previousVoterCount,
    timestamp: new Date().toISOString(),
  });
});

// Get device/voter statistics (admin endpoint)
app.get('/api/admin/devices', (req, res) => {
  res.json({
    totalUniqueDevices: userVotes.size,
    totalVotes: votes.length,
    devicesWithVotes: Array.from(userVotes),
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
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
  console.log(`   POST /api/admin/reset-devices - Reset all device IDs (admin)`);
  console.log(`   GET  /api/admin/devices - Get device statistics (admin)`);
});

module.exports = app;
