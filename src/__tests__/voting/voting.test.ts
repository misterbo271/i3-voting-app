import {
  getAvailableTeamsToVote,
  getInitialVotingState,
  getTeamById,
  TEAMS,
} from '@/lib/voting';

describe('Voting Logic', () => {
  describe('getInitialVotingState', () => {
    it('should return initial state with all teams having 0 votes', () => {
      const state = getInitialVotingState();
      
      expect(state.userTeam).toBeNull();
      expect(state.hasVoted).toBe(false);
      expect(state.votedFor).toBeNull();
      expect(state.votes).toEqual({
        'team-a': 0,
        'team-b': 0,
        'team-c': 0,
        'team-d': 0,
      });
    });
  });

  describe('getAvailableTeamsToVote', () => {
    it('should return 3 teams excluding the user team', () => {
      const availableTeams = getAvailableTeamsToVote('team-a');
      
      expect(availableTeams).toHaveLength(3);
      expect(availableTeams.map(t => t.id)).toEqual(['team-b', 'team-c', 'team-d']);
    });

    it('should work for any team', () => {
      const availableForTeamC = getAvailableTeamsToVote('team-c');
      
      expect(availableForTeamC).toHaveLength(3);
      expect(availableForTeamC.map(t => t.id)).toEqual(['team-a', 'team-b', 'team-d']);
    });
  });

  describe('getTeamById', () => {
    it('should return correct team for valid id', () => {
      const team = getTeamById('team-a');
      
      expect(team).toBeDefined();
      expect(team?.id).toBe('team-a');
      expect(team?.name).toBe('Team Alpha');
      expect(team?.color).toBe('bg-blue-500');
      expect(team?.emoji).toBe('🌸');
    });

    it('should return undefined for invalid id', () => {
      const team = getTeamById('invalid-team');
      
      expect(team).toBeUndefined();
    });
  });

  describe('TEAMS constant', () => {
    it('should have exactly 4 teams', () => {
      expect(TEAMS).toHaveLength(4);
    });

    it('should have unique team ids', () => {
      const ids = TEAMS.map(t => t.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(uniqueIds).toHaveLength(4);
    });

    it('should have all required properties for each team', () => {
      TEAMS.forEach(team => {
        expect(team.id).toBeDefined();
        expect(team.name).toBeDefined();
        expect(team.color).toBeDefined();
        expect(team.emoji).toBeDefined();
      });
    });
  });
});
