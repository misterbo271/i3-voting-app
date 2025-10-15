'use client';

import { motion } from 'framer-motion';
import React from 'react';

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
          <div className="text-6xl mb-4">🏺</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Beautiful Vase Contest
          </h1>
          <p className="text-gray-600">
            Which team do you belong to?
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
          Select your team to continue voting
        </motion.div>
      </div>
    </div>
  );
}
