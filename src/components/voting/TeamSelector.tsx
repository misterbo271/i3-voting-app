'use client';

import { motion } from 'framer-motion';
import React from 'react';
import Image from 'next/image';

import { Team, TEAMS } from '@/lib/voting';

interface TeamSelectorProps {
  onSelectTeam: (teamId: string) => void;
}

export default function TeamSelector({ onSelectTeam }: TeamSelectorProps) {
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
          <p className="text-gray-600">
            Bạn thuộc team nào?
          </p>
        </motion.div>

        <div className="space-y-4">
          {TEAMS.map((team, index) => (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTeam(team.id)}
              className={`w-full p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-white transition-all duration-200 ${team.color} text-white`}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl">{team.emoji}</span>
                <span className="text-xl font-semibold">{team.name}</span>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          Chọn đội của bạn để tiếp tục vote
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
