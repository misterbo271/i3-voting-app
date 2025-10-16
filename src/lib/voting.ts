export interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface VotingState {
  userTeam: string | null;
  hasVoted: boolean;
  ownTeamVote: boolean;
  otherTeamVote: boolean;
  votedFor: string | null;
  votes: Record<string, number>;
  userIdentifier: string;
}

export const TEAMS: Team[] = [
  { id: 'team-a', name: 'Team 01', color: 'bg-blue-500', emoji: '🌸' },
  { id: 'team-b', name: 'Team 02', color: 'bg-green-500', emoji: '🌺' },
  { id: 'team-c', name: 'Team 03', color: 'bg-purple-500', emoji: '🌻' },
  { id: 'team-d', name: 'Team 04', color: 'bg-orange-500', emoji: '🌷' },
];

const STORAGE_KEY = 'vase-voting-state';
const RESET_TIMESTAMP_KEY = 'vase-last-reset-timestamp';

export const getInitialVotingState = (userIdentifier: string): VotingState => ({
  userTeam: null,
  hasVoted: false,
  ownTeamVote: false,
  otherTeamVote: false,
  votedFor: null,
  votes: {
    'team-a': 0,
    'team-b': 0,
    'team-c': 0,
    'team-d': 0,
  },
  userIdentifier,
});

export const loadVotingState = (userIdentifier: string): VotingState => {
  if (typeof window === 'undefined') return getInitialVotingState(userIdentifier);
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getInitialVotingState(userIdentifier), ...parsed, userIdentifier };
    }
  } catch (error) {
    console.error('Error loading voting state:', error);
  }
  
  return getInitialVotingState(userIdentifier);
};

export const saveVotingState = (state: VotingState): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving voting state:', error);
  }
};

export const getAvailableTeamsToVote = (userTeam: string): Team[] => {
  return TEAMS.filter(team => team.id !== userTeam);
};

export const getAllTeamsToVote = (): Team[] => {
  return TEAMS;
};

export const getTeamById = (id: string): Team | undefined => {
  return TEAMS.find(team => team.id === id);
};

export const checkAndHandleDeviceReset = (resetTimestamp: string | null): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const lastKnownReset = localStorage.getItem(RESET_TIMESTAMP_KEY);
    
    // If we have a reset timestamp from server and it's different from what we know
    if (resetTimestamp && resetTimestamp !== lastKnownReset) {
      console.log('🔄 Device reset detected, clearing voting state but preserving user ID...');
      
      // Clear voting state but PRESERVE user identifier
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(RESET_TIMESTAMP_KEY, resetTimestamp);
      
      // Clear other voting keys but NOT the user identifier
      Object.keys(localStorage).forEach(key => {
        if ((key.includes('vase') || key.includes('voting') || key.includes('team')) && 
            key !== 'voting-user-id') { // PRESERVE user identifier
          localStorage.removeItem(key);
        }
      });
      
      return true; // Indicates a reset occurred
    }
    
    // If no reset timestamp from server, but we have one stored locally, 
    // it means this might be the first load after a reset
    if (!resetTimestamp && lastKnownReset) {
      console.log('🔄 No reset timestamp from server, clearing stored reset timestamp...');
      localStorage.removeItem(RESET_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.error('Error checking device reset:', error);
  }

  return false;
};

// Debug function to manually clear all voting data (for testing)
export const clearAllVotingData = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Manually clearing all voting data...');
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RESET_TIMESTAMP_KEY);
  
  // Clear any other voting-related keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('vase') || key.includes('voting') || key.includes('team')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ All voting data cleared');
};
