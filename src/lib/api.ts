// API service for communicating with the backend voting server

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.20.52:3002';
console.log('API_BASE_URL', API_BASE_URL);

export interface VoteRequest {
  userTeam: string;
  votedFor: string;
  userIdentifier: string;
  voteType: 'own-team' | 'other-team';
}

export interface DualVoteRequest {
  team1: string;
  team2: string;
  userIdentifier: string;
}

export interface SimpleVoteRequest {
  teamId: string;
  userIdentifier: string;
}

export interface SimpleVoteResponse {
  success: boolean;
  message: string;
  vote: {
    id: string;
    votedFor: string;
    timestamp: string;
  };
  results: {
    'team-a': number;
    'team-b': number;
    'team-c': number;
    'team-d': number;
  };
  totalVotes: number;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  vote: {
    id: string;
    userTeam: string;
    votedFor: string;
    timestamp: string;
    voteType: 'own-team' | 'other-team';
  };
  results: {
    'team-a': number;
    'team-b': number;
    'team-c': number;
    'team-d': number;
  };
  totalVotes: number;
  userVoteStatus: {
    ownTeamVote: boolean;
    otherTeamVote: boolean;
  };
}

export interface DualVoteResponse {
  success: boolean;
  message: string;
  votes: {
    team1: {
      id: string;
      votedFor: string;
      timestamp: string;
    };
    team2: {
      id: string;
      votedFor: string;
      timestamp: string;
    };
  };
  results: {
    'team-a': number;
    'team-b': number;
    'team-c': number;
    'team-d': number;
  };
  totalVotes: number;
  userVoteStatus: {
    ownTeamVote: boolean;
    otherTeamVote: boolean;
  };
}

export interface VoteResults {
  results: Array<{
    teamId: string;
    teamName: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  timestamp: string;
}

export interface VoteStatus {
  hasVoted: boolean;
  ownTeamVote?: boolean;
  otherTeamVote?: boolean;
  identifier: string;
  lastDeviceResetTimestamp?: string | null;
}

// Generate a unique identifier for the user (stored in localStorage)
export const getUserIdentifier = (): string => {
  if (typeof window === 'undefined') return 'server-side';
  
  let identifier = localStorage.getItem('voting-user-id');
  if (!identifier) {
    // Use crypto.randomUUID if available, fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      identifier = `user-${crypto.randomUUID()}`;
    } else {
      identifier = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    localStorage.setItem('voting-user-id', identifier);
    console.log('🆔 Generated NEW user identifier:', identifier);
  } else {
    console.log('🆔 Using EXISTING user identifier:', identifier);
  }
  return identifier;
};

// API functions
export const api = {
  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  },

  // Get current vote results
  async getResults(): Promise<VoteResults> {
    const response = await fetch(`${API_BASE_URL}/api/results`);
    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.statusText}`);
    }
    return response.json();
  },

  // Check if user has voted
  async getVoteStatus(identifier: string): Promise<VoteStatus> {
    const response = await fetch(`${API_BASE_URL}/api/vote-status/${identifier}`);
    if (!response.ok) {
      throw new Error(`Failed to check vote status: ${response.statusText}`);
    }
    return response.json();
  },

  // Submit a vote
  async submitVote(voteData: VoteRequest): Promise<VoteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Vote submission failed: ${response.statusText}`);
    }

    return data;
  },

  // Submit dual vote (both own team and selected team in one request)
  async submitDualVote(voteData: DualVoteRequest): Promise<DualVoteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/vote-dual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Dual vote submission failed: ${response.statusText}`);
    }

    return data;
  },

  // Submit simple single vote
  async submitSimpleVote(voteData: SimpleVoteRequest): Promise<SimpleVoteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/vote-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Vote submission failed: ${response.statusText}`);
    }

    return data;
  },

  // Admin: Get all votes
  async getAllVotes(): Promise<{
    votes: Array<{
      id: string;
      userTeam: string;
      votedFor: string;
      timestamp: string;
    }>;
    totalVotes: number;
    uniqueVoters: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/votes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all votes: ${response.statusText}`);
    }
    return response.json();
  },

  // Admin: Reset all votes
  async resetVotes(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm: 'RESET_ALL_VOTES' }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Reset failed: ${response.statusText}`);
    }

    return data;
  },
};

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Test connection to backend
export const testConnection = async (): Promise<boolean> => {
  try {
    await api.health();
    console.log('✅ Backend connection successful');
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};
