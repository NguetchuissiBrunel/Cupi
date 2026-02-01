'use client';

import { useEffect, useState } from 'react';
import { Heart, X, Bell } from 'lucide-react';

interface LoveNotificationProps {
  matchName: string;
  compatibility: number;
  onClose: () => void;
}

export default function LoveNotification({ matchName, compatibility, onClose }: LoveNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Jouer le son après un court délai
    const audioElement = new Audio('/sounds/cupid-arrow.mp3');
    audioElement.volume = 0.7;
    setAudio(audioElement);

    const timer = setTimeout(() => {
      setIsVisible(true); // Trigger animation slightly after mount
      audioElement.play().catch(e => console.log("Audio error:", e));
    }, 100);

    return () => {
      clearTimeout(timer);
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-bounce-in">
        <div className="text-center space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-white/80" />
              <span className="text-white/80 text-sm">Notification Cupidon</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="py-6">
            <div className="relative inline-block mb-4">
              <Heart className="w-20 h-20 text-white heart-beat fill-white" />
              <div className="absolute inset-0 animate-ping">
                <Heart className="w-20 h-20 text-white opacity-50" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-white mb-4 font-dancing">
              🎉 Coup de foudre ! 🎉
            </h3>

            <div className="bg-white/20 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-xl text-white mb-3">
                <span className="font-bold">{matchName}</span> pourrait être ton âme sœur !
              </p>
              <div className="inline-flex items-center space-x-2 bg-white/30 px-4 py-2 rounded-full">
                <Heart className="w-4 h-4 text-white fill-white" />
                <span className="text-white font-semibold">
                  Compatibilité : {compatibility}%
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6">
            <p className="text-white/90 italic text-lg font-dancing">
              &quot;Deux cœurs destinés à battre à l&apos;unisson&quot;
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-white text-rose-600 font-bold py-4 rounded-xl hover:bg-rose-50 transition-colors transform hover:scale-105"
          >
            Voir les détails du match
          </button>
        </div>
      </div>
    </div>
  );
}