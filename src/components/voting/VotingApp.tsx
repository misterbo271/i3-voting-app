'use client';

import React, { useEffect, useState } from 'react';

import { api, getUserIdentifier, handleApiError } from '@/lib/api';
import {
  loadVotingState,
  saveVotingState,
  VotingState,
  checkAndHandleDeviceReset,
  getInitialVotingState,
} from '@/lib/voting';
import { useClientOnly } from '@/lib/useClientOnly';

import TeamSelector from './TeamSelector';
import VotingResults from './VotingResults';

export default function VotingApp() {
  // Use client-only hook to prevent hydration mismatches
  const isClient = useClientOnly();
  
  // Initialize with null to prevent premature rendering
  const [votingState, setVotingState] = useState<VotingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watch for voting state changes to ensure proper component rendering
  useEffect(() => {
    if (votingState?.hasVoted) {
      console.log('🔄 Voting state changed - user has voted, should show results');
    }
  }, [votingState?.hasVoted]);

  useEffect(() => {
    if (!isClient) return; // Only run on client side
    
    const initializeApp = async () => {
      try {
        // Get user identifier
        const userIdentifier = getUserIdentifier();
        console.log('🔍 Initializing app with user identifier:', userIdentifier);
        
        // Load local state but DON'T set it yet - wait for backend check first
        const localState = loadVotingState(userIdentifier);
        console.log('📱 Loaded local state:', localState);
        
        // Check backend for vote status and results FIRST
        const [voteStatus, results] = await Promise.all([
          api.getVoteStatus(userIdentifier),
          api.getResults()
        ]);
        
        console.log('🌐 Backend vote status:', voteStatus);
        console.log('🌐 Backend results:', results);
        
        // Check if device reset occurred and clear local storage if needed
        const wasReset = checkAndHandleDeviceReset(voteStatus?.lastDeviceResetTimestamp || null);
        console.log('🔄 Was reset detected?', wasReset);
        
        // If reset occurred, start with completely fresh state
        let baseState;
        if (wasReset) {
          console.log('🔄 Reset detected - starting with fresh state, no team selected');
          baseState = getInitialVotingState(userIdentifier);
        } else {
          baseState = localState;
        }
        
        // Update state with backend data
        const updatedState: VotingState = {
          ...baseState,
          hasVoted: wasReset ? false : voteStatus.hasVoted, // If reset, user hasn't voted
          ownTeamVote: wasReset ? false : (voteStatus.ownTeamVote || false),
          otherTeamVote: wasReset ? false : (voteStatus.otherTeamVote || false),
          votes: results.results.reduce((acc, result) => {
            acc[result.teamId] = result.votes;
            return acc;
          }, {} as Record<string, number>),
        };
        
        console.log('🔄 Final state after initialization:', { 
          hasVoted: updatedState.hasVoted,
          ownTeamVote: updatedState.ownTeamVote,
          otherTeamVote: updatedState.otherTeamVote,
          wasReset: wasReset 
        });
        
        setVotingState(updatedState);
        saveVotingState(updatedState);
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError(handleApiError(error));
        
        // Fallback to local state only
        const userIdentifier = getUserIdentifier();
        const localState = loadVotingState(userIdentifier);
        setVotingState(localState);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isClient]);

  const handleSubmitVotes = async (team1: string, team2: string) => {
    if (!votingState || votingState.hasVoted || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('📤 Submitting dual votes to backend...');
      
      // Submit dual votes to backend
      const response = await api.submitDualVote({
        team1: team1,
        team2: team2,
        userIdentifier: votingState.userIdentifier,
      });
      
      console.log('✅ Dual votes successfully submitted to backend');
      
      // Update local state with backend response
      const newState: VotingState = {
        ...votingState,
        userTeam: team1, // First selected team
        hasVoted: true,
        ownTeamVote: true,
        otherTeamVote: true,
        votedFor: team2, // Second selected team
        votes: response.results,
      };
      
      console.log('🔄 Updating state after successful vote:', { 
        hasVoted: newState.hasVoted,
        userTeam: newState.userTeam,
        votedFor: newState.votedFor 
      });
      
      setVotingState(newState);
      saveVotingState(newState);
      
    } catch (error) {
      console.error('❌ Error submitting dual votes:', error);
      setError(handleApiError(error));
      
      // If it's a "already voted" error, update local state
      if (error instanceof Error && error.message.includes('already voted')) {
        const newState = {
          ...votingState,
          hasVoted: true,
          ownTeamVote: true,
          otherTeamVote: true,
        };
        setVotingState(newState);
        saveVotingState(newState);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state or wait for client hydration or backend check
  if (isLoading || !isClient || !votingState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏺</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Đang kiểm tra...</div>
          <div className="text-sm text-gray-500">Kiểm tra trạng thái vote của bạn</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center text-red-600 max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold mb-2">Vote rùi tính vote thêm chi zậy</div>
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
            Coi chừng à
          </div>
        </div>
      </div>
    );
  }

  // Show results if user has completed voting
  if (votingState.hasVoted) {
    console.log('🎉 User has voted - showing VotingResults', { 
      hasVoted: votingState.hasVoted,
      ownTeamVote: votingState.ownTeamVote,
      otherTeamVote: votingState.otherTeamVote 
    });
    return <VotingResults votingState={votingState} />;
  }

  // Show team selector for voting (only after backend check confirms user hasn't voted)
  console.log('🗳️ User has not voted - showing TeamSelector', { 
    hasVoted: votingState.hasVoted,
    ownTeamVote: votingState.ownTeamVote,
    otherTeamVote: votingState.otherTeamVote 
  });
  return (
    <TeamSelector 
      onSubmitVotes={handleSubmitVotes}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}
