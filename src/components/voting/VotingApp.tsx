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

import TeamSelector from './TeamSelector';
import VotingInterface from './VotingInterface';
import VotingResults from './VotingResults';

export default function VotingApp() {
  const [votingState, setVotingState] = useState<VotingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get user identifier
        const userIdentifier = getUserIdentifier();
        
        // Load local state first
        const localState = loadVotingState(userIdentifier);
        console.log('📱 Loaded local state:', localState);
        setVotingState(localState);
        
        // Check backend for vote status and results
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
          votes: results.results.reduce((acc, result) => {
            acc[result.teamId] = result.votes;
            return acc;
          }, {} as Record<string, number>),
        };
        
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
  }, []);

  const handleSelectTeam = (teamId: string) => {
    if (!votingState) return;
    
    const newState = {
      ...votingState,
      userTeam: teamId,
    };
    
    setVotingState(newState);
    saveVotingState(newState);
  };

  const handleVote = async (teamId: string) => {
    if (!votingState || votingState.hasVoted || !votingState.userTeam || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('📤 Submitting vote to backend...');
      
      // Submit vote to backend
      const response = await api.submitVote({
        userTeam: votingState.userTeam,
        votedFor: teamId,
        userIdentifier: votingState.userIdentifier,
      });
      
      console.log('✅ Vote successfully submitted to backend');
      
      // Update local state with backend response
      const newState: VotingState = {
        ...votingState,
        hasVoted: true,
        votedFor: teamId,
        votes: response.results,
      };
      
      setVotingState(newState);
      saveVotingState(newState);
      
    } catch (error) {
      console.error('❌ Error submitting vote:', error);
      setError(handleApiError(error));
      
      // If it's a "already voted" error, update local state
      if (error instanceof Error && error.message.includes('already voted')) {
        const newState = {
          ...votingState,
          hasVoted: true,
        };
        setVotingState(newState);
        saveVotingState(newState);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏺</div>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  if (!votingState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center text-red-600 max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold mb-2">Error loading voting data</div>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show results if user has already voted
  if (votingState.hasVoted) {
    return <VotingResults votingState={votingState} />;
  }

  // Show voting interface if user has selected their team
  if (votingState.userTeam) {
    return (
      <VotingInterface
        userTeam={votingState.userTeam}
        onVote={handleVote}
        isSubmitting={isSubmitting}
        error={error}
      />
    );
  }

  // Show team selection if user hasn't selected their team yet
  return <TeamSelector onSelectTeam={handleSelectTeam} />;
}
