'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, Video, Mic, } from 'lucide-react';

interface VideoCallProps {
    currentUser: string;
    targetUser: string;
    onEndCall: () => void;
    initialIsIncoming?: boolean; // If true, we are receiving the call
}

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export default function VideoCall({ currentUser, targetUser, onEndCall, initialIsIncoming = false }: VideoCallProps) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // 'calling' = we are calling them. 'ringing' = they are calling us.
    const [callStatus, setCallStatus] = useState<CallStatus>(initialIsIncoming ? 'ringing' : 'calling');

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Audio effects
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

    // --- HELPER FUNCTIONS DEFINED EARLY ---

    const playRingtone = useCallback((url: string) => {
        if (!ringtoneRef.current) {
            ringtoneRef.current = new Audio(url);
            ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.src = url;
        ringtoneRef.current.play().catch(e => console.log('Audio play failed', e));
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, []);

    const endCallCleanup = useCallback(() => {
        localStream?.getTracks().forEach(track => track.stop());
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setCallStatus('ended');
    }, [localStream]);

    const handleHangup = useCallback(() => {
        stopRingtone();
        // Forward declaration issue solved by define-before-use or using refs if circular deps exist,
        // but here we can define sendSignal next.
        // Actually, sendSignal needs to be defined now.
        // But sendSignal uses 'currentUser' which is in scope.
    }, [stopRingtone]); // We will complete this after sendSignal is defined? 
    // Circular dependency: handleHangup calls sendSignal -> sendSignal is simple.
    // Let's define sendSignal first.

    const sendSignal = useCallback(async (type: string, data: any) => {
        await fetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: currentUser,
                receiver: targetUser,
                type,
                data
            })
        });
    }, [currentUser, targetUser]);

    const actualHandleHangup = useCallback(() => {
        stopRingtone();
        sendSignal('end', {});
        endCallCleanup();
        onEndCall();
    }, [stopRingtone, sendSignal, endCallCleanup, onEndCall]);


    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream); // Set state triggers render
            // Since we need the stream immediately for logic, we return it too.
            // But we also need to attach it to ref, which we can do in useEffect or here.
            setTimeout(() => {
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            }, 0);
            return stream;
        } catch (err) {
            console.error('Error accessing media', err);
            onEndCall();
            return null;
        }
    }, [onEndCall]);

    const initializePeerConnection = useCallback((stream: MediaStream) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal('ice-candidate', event.candidate);
            }
        };

        pc.ontrack = (event) => {
            console.log('Track received');
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('connected');
            stopRingtone();
        };

        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnection.current = pc;
        return pc;
    }, [sendSignal, stopRingtone]);


    const handleSignal = useCallback(async (signal: any) => {
        if (signal.sender === currentUser) return;

        // If we are calling and they accept
        if (callStatus === 'calling' && signal.type === 'accept') {
            stopRingtone();
            setCallStatus('connected');

            // We need local stream here. If it's already set in state `localStream` we use it.
            // CAUTION: existing 'localStream' closure might be stale if not in dep array.
            // Better to re-fetch or trust state if updated. 
            // `startLocalStream` handles this? No, it requests new stream.
            // Let's rely on looking up current stream from ref or re-requesting if null (idempotent-ish).
            // Actually, for this logic to be robust, we often just keep it simple:

            // If we are 'calling', we should ALREADY have a stream from the effect.
            // But `localStream` state variable might be stale in this callback if not added to deps.
            // We'll add `localStream` to deps.
            if (localStream) {
                const pc = initializePeerConnection(localStream);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal('offer', offer);
            }
        }

        // If we are evaluating an offer (standard WebRTC flow)
        if (signal.type === 'offer') {
            // We need a stream to answer
            let currentStream = localStream;
            if (!currentStream) {
                currentStream = await startLocalStream();
            }

            if (currentStream) {
                if (!peerConnection.current) {
                    initializePeerConnection(currentStream);
                }
                const pc = peerConnection.current;
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sendSignal('answer', answer);
                }
            }
        }
        else if (signal.type === 'answer' && peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.data));
        }
        else if (signal.type === 'ice-candidate' && peerConnection.current) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.data));
        }
        else if (signal.type === 'reject' || signal.type === 'end') {
            stopRingtone();
            endCallCleanup();
            onEndCall();
        }
    }, [currentUser, callStatus, localStream, initializePeerConnection, sendSignal, startLocalStream, stopRingtone, endCallCleanup, onEndCall]);

    const answerCall = useCallback(async () => {
        stopRingtone();
        const stream = await startLocalStream();
        if (!stream) return;

        initializePeerConnection(stream);
        sendSignal('accept', {});
    }, [stopRingtone, startLocalStream, initializePeerConnection, sendSignal]);


    // --- EFFECTS ---

    // Poll for signals
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            if (callStatus === 'ended') return;

            try {
                const res = await fetch(`/api/calls/signal?username=${currentUser}`);
                const data = await res.json();

                if (data.signals) {
                    for (const signal of data.signals) {
                        handleSignal(signal);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }, 1500);

        return () => clearInterval(pollInterval);
    }, [currentUser, callStatus, handleSignal]);

    // Handle initial setup logic based on direction
    useEffect(() => {
        if (!initialIsIncoming) {
            // We are calling
            playRingtone('https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3');
            startLocalStream().then(() => {
                sendSignal('invite', {});
            });
        } else {
            // We are receiving
            playRingtone('https://assets.mixkit.co/active_storage/sfx/2516/2516-preview.mp3');
        }

        return () => {
            stopRingtone();
            endCallCleanup();
        };
        // We only want this to run ONCE on mount, but we need the functions to be stable or ignored in deps
        // Since we wrapped them in useCallback, we can include them safely.
    }, [initialIsIncoming, playRingtone, startLocalStream, sendSignal, stopRingtone, endCallCleanup]);


    // --- UI RENDERING ---

    // 1. Ringing Component (Incoming)
    if (callStatus === 'ringing') {
        return (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-4xl font-bold mb-8 animate-pulse">
                    {targetUser[0]}
                </div>
                <h2 className="text-2xl font-bold mb-2">{targetUser}</h2>
                <p className="text-gray-400 mb-12">Appel vidéo entrant...</p>
                <div className="flex space-x-12">
                    <button onClick={actualHandleHangup} className="flex flex-col items-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
                            <PhoneOff className="w-8 h-8" />
                        </div>
                        <span className="text-sm">Refuser</span>
                    </button>
                    <button onClick={answerCall} className="flex flex-col items-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors animate-bounce">
                            <Phone className="w-8 h-8" />
                        </div>
                        <span className="text-sm">Accepter</span>
                    </button>
                </div>
            </div>
        );
    }

    // 2. Calling Component (Outgoing)
    if (callStatus === 'calling') {
        return (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
                <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-pink-500 flex items-center justify-center text-4xl font-bold mb-8">
                    {targetUser[0]}
                </div>
                <h2 className="text-2xl font-bold mb-2">{targetUser}</h2>
                <p className="text-gray-400 mb-12">Appel en cours...</p>

                {/* Local Video Preview */}
                <div className="w-48 h-32 bg-gray-900 rounded-lg overflow-hidden mb-12">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>

                <button onClick={actualHandleHangup} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
                    <PhoneOff className="w-8 h-8" />
                </button>
            </div>
        );
    }

    // 3. Connected Component
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                {/* Remote Video */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Local Video (PIP) */}
                <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-72 bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
                    <button className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700">
                        <Mic />
                    </button>
                    <button onClick={actualHandleHangup} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transform hover:scale-110 transition-all shadow-lg">
                        <PhoneOff className="w-8 h-8" />
                    </button>
                    <button className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700">
                        <Video />
                    </button>
                </div>
            </div>
        </div>
    );
}
