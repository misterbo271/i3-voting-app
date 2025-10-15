export interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface VotingState {
  userTeam: string | null;
  hasVoted: boolean;
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

export const getInitialVotingState = (userIdentifier: string): VotingState => ({
  userTeam: null,
  hasVoted: false,
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

export const getTeamById = (id: string): Team | undefined => {
  return TEAMS.find(team => team.id === id);
};
