'use client';

import { Users, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QueueCounterProps {
  userId: string;
}

export default function QueueCounter({ userId }: QueueCounterProps) {
  const [queueData, setQueueData] = useState({
    position: 0,
    total: 0,
    avgWaitTime: '2-5 min',
    matchesToday: 0
  });

  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const response = await fetch(`/api/queue?userId=${userId}`);
        const data = await response.json();
        setQueueData(data);
      } catch (error) {
        console.error('Error fetching queue data:', error);
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 15000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="bg-gradient-to-r from-pink-50 to-rose-100 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-rose-800 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        File d&apos;attente en direct
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-pink-600 mb-1">
            {queueData.position}
          </div>
          <div className="text-sm text-gray-600">Ta position</div>
        </div>

        <div className="bg-white/80 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {queueData.total}
          </div>
          <div className="text-sm text-gray-600">En attente</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Temps estimé</span>
          </div>
          <span className="font-semibold text-gray-800">{queueData.avgWaitTime}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Matchs aujourd&apos;hui</span>
          </div>
          <span className="font-semibold text-green-600">{queueData.matchesToday}</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progression</span>
          <span>{Math.round((queueData.position / queueData.total) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
            style={{ width: `${Math.min(100, ((queueData.total - queueData.position) / queueData.total) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}