'use client';

import { motion } from 'framer-motion';
import React from 'react';
import Image from 'next/image';

import { getTeamById, TEAMS, VotingState } from '@/lib/voting';

interface VotingResultsProps {
  votingState: VotingState;
}

export default function VotingResults({ votingState }: VotingResultsProps) {
  const userTeamData = getTeamById(votingState.userTeam!);
  const votedForTeamData = getTeamById(votingState.votedFor!);
  
  const totalVotes = Object.values(votingState.votes).reduce((sum, votes) => sum + votes, 0);
  const sortedTeams = TEAMS.map(team => ({
    ...team,
    votes: votingState.votes[team.id],
    percentage: totalVotes > 0 ? (votingState.votes[team.id] / totalVotes) * 100 : 0,
  })).sort((a, b) => b.votes - a.votes);

  const winningTeam = sortedTeams[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thank You for Voting!
          </h1>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-gray-600">Bạn đã vote cho</span>
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${votedForTeamData?.color}`}>
              {votedForTeamData?.emoji} {votedForTeamData?.name}
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>là thành viên của</span>
            <span className={`px-2 py-1 rounded-full text-white text-xs ${userTeamData?.color}`}>
              {userTeamData?.emoji} {userTeamData?.name}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-6 bg-white rounded-2xl shadow-lg border-2 border-yellow-200"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">{winningTeam.emoji}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Đội dẫn đầu
            </h2>
            <div className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${winningTeam.color}`}>
              {winningTeam.name}
            </div>
            <div className="text-2xl font-bold text-gray-800 mt-2">
              {winningTeam.votes} votes
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
            Kết quả (real time)
          </h3>
          {sortedTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-xl p-4 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{team.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{team.name}</div>
                    <div className="text-sm text-gray-500">
                      {team.votes} votes ({team.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <div className="text-2xl">👑</div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${team.percentage}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  className={`h-2 rounded-full ${team.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center"
        >
          <div className="text-blue-800">
            <span className="text-lg">ℹ️</span>
            <p className="text-sm mt-1">
              Results update in real-time. You cannot vote again even if you refresh the page.
            </p>
          </div>
        </motion.div>

        {/* Footer with i3 Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-4 left-4 flex items-center space-x-2 opacity-60"
        >
          <Image 
            src="/images/i3_logo.png" 
            alt="i3 International" 
            width={32} 
            height={32}
            className="object-contain"
          />
          <span className="text-xs text-gray-400">Powered by i3 International</span>
        </motion.div>
      </div>
    </div>
  );
}
