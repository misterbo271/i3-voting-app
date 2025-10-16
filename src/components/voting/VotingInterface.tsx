'use client';

import { motion } from 'framer-motion';
import React from 'react';
import Image from 'next/image';

import { getAllTeamsToVote, getTeamById, Team } from '@/lib/voting';

interface VotingInterfaceProps {
  userTeam: string;
  onVote: (teamId: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function VotingInterface({ userTeam, onVote, isSubmitting = false, error }: VotingInterfaceProps) {
  const availableTeams = getAllTeamsToVote();
  const userTeamData = getTeamById(userTeam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="mb-2 flex justify-center">
            <Image 
              src="/images/vase.png" 
              alt="Vase" 
              width={136} 
              height={136}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Lượt vote thứ 2!
          </h1>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-gray-600">Bạn thuộc đội</span>
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${userTeamData?.color}`}>
              {userTeamData?.emoji} {userTeamData?.name}
            </div>
          </div>
          <p className="text-gray-600">
            Chọn đội bạn nghĩ có bình hoa đẹp nhất
          </p>
        </motion.div>

        <div className="space-y-4">
          {availableTeams.map((team, index) => (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              onClick={() => !isSubmitting && onVote(team.id)}
              disabled={isSubmitting}
              className={`w-full p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-white transition-all duration-200 ${team.color} text-white relative overflow-hidden ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <motion.div
                className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200"
                whileHover={{ opacity: 0.1 }}
              />
              <div className="flex items-center justify-center space-x-3 relative z-10">
                <span className="text-4xl">{team.emoji}</span>
                <div className="text-left">
                  <div className="text-xl font-semibold flex items-center space-x-2">
                    <span>{team.name}</span>
                    {team.id === userTeam && (
                      <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        Đội của bạn
                      </span>
                    )}
                  </div>
                  <div className="text-sm opacity-90">
                    {isSubmitting ? 'Submitting...' : 'Vote for this team'}
                  </div>
                </div>
                {isSubmitting && (
                  <div className="ml-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <div className="flex items-center justify-center space-x-3 text-blue-800">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium">
                Submitting your vote to server...
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-center space-x-3 text-red-800">
              <span className="text-lg">❌</span>
              <div>
                <div className="text-sm font-medium">Error submitting vote</div>
                <div className="text-xs text-red-600 mt-1">{error}</div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-center space-x-2 text-blue-800">
            <span className="text-lg">ℹ️</span>
            <div className="text-sm">
              <div className="font-medium mb-1">Lượt vote thứ 2 của bạn</div>
              <div>Bạn có thể vote cho bất kỳ đội nào, kể cả đội của mình!</div>
            </div>
          </div>
        </motion.div>

        {/* Footer with i3 Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
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
