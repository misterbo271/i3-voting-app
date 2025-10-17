'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import Image from 'next/image';

import { Team, TEAMS } from '@/lib/voting';

interface TeamSelectorProps {
  onSubmitVotes: (team1: string, team2: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function TeamSelector({ onSubmitVotes, isSubmitting = false, error }: TeamSelectorProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const handleTeamClick = (teamId: string) => {
    if (isSubmitting) return;
    
    if (selectedTeams.includes(teamId)) {
      // Deselect team
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else if (selectedTeams.length < 2) {
      // Select team (max 2 allowed)
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleSubmit = () => {
    if (selectedTeams.length === 2) {
      onSubmitVotes(selectedTeams[0], selectedTeams[1]);
    }
  };

  const canSubmit = selectedTeams.length === 2;

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
            Bình chọn bình hoa
          </h1>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
           đẹp nhất
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Chọn 2 đội bạn thích nhất ({selectedTeams.length}/2)
          </p>
          
          {selectedTeams.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {selectedTeams.map((teamId, index) => {
                const team = TEAMS.find(t => t.id === teamId);
                return (
                  <div key={teamId} className={`px-3 py-1 rounded-full text-white text-sm font-medium shadow-lg backdrop-blur-sm border border-white border-opacity-20 ${team?.color} opacity-90`}>
                    {index + 1}. {team?.emoji} {team?.name}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          {TEAMS.map((team, index) => {
            const isSelected = selectedTeams.includes(team.id);
            const selectionOrder = selectedTeams.indexOf(team.id) + 1;
            const canSelect = selectedTeams.length < 2 || isSelected;
            
            return (
              <motion.button
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: isSubmitting || !canSelect ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || !canSelect ? 1 : 0.98 }}
                onClick={() => handleTeamClick(team.id)}
                disabled={isSubmitting || (!canSelect && !isSelected)}
                className={`relative w-full p-6 rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  isSelected 
                    ? `${team.color} border-white border-4 text-white opacity-30 shadow-xl transform scale-105` 
                    : canSelect
                    ? `${team.color} border-transparent hover:border-white text-white hover:opacity-90 hover:shadow-xl hover:transform hover:scale-102`
                    : `${team.color} border-transparent text-white opacity-40`
                } ${isSubmitting ? 'opacity-30 cursor-not-allowed' : canSelect ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-white ml-2 mr-2 mt-1 mb-1 text-sm font-bold">✓</span>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-3xl">{team.emoji}</span>
                  <div className="text-left">
                    <div className="text-lg text-white opacity-90">
                      {isSelected 
                        ? 'Nhấn để bỏ chọn' 
                        : canSelect 
                        ? 'Nhấn để chọn' 
                        : 'Đã chọn đủ 2 đội'
                      }
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {canSubmit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full p-4 bg-primary-400 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 font-semibold text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Đang gửi vote...</span>
                </div>
              ) : (
                'Hoàn thành bình chọn 🎉'
              )}
            </motion.button>
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
                <div className="text-sm font-medium">Lỗi khi gửi vote</div>
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
              <div className="font-medium mb-1">Cách thức bình chọn</div>
              <div>• Chọn 2 đội bạn thích nhất</div>
              <div>• Mỗi thiết bị chỉ vote được 1 lần</div>
              <div>• Nhấn vào đội để chọn/bỏ chọn</div>
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
