"use client";
import Image from "next/image";
import React, { useRef, useState } from 'react';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ rating: number; suggestions: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    setResult(null);
    setAudioUrl(null);
    setIsProcessing(false);
    
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Audio recording is not supported in this browser or environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsProcessing(true);

        // Send to backend
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result?.toString().split(',')[1];
            const res = await fetch('http://localhost:8080/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio }),
            });
            const data = await res.json();
            setResult(data);
          } catch (error) {
            console.error('Error processing audio:', error);
            setResult({ rating: 0, suggestions: 'Error processing your recording. Please try again.' });
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400';
    if (rating >= 6) return 'text-yellow-400';
    if (rating >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRatingEmoji = (rating: number) => {
    if (rating >= 9) return '🌟';
    if (rating >= 8) return '🎵';
    if (rating >= 6) return '👍';
    if (rating >= 4) return '😊';
    return '💪';
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,_119,_198,_0.1),_transparent_50%),radial-gradient(circle_at_80%_20%,_rgba(255,_119,_198,_0.1),_transparent_50%)]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Melodify
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2 font-light">
            Sing & Get Rated
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Sing a part of your favorite song. Our AI will listen, rate your performance, and give you personalized suggestions to improve your vocals!
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-lg bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-2xl p-8">
          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-6">
            {!recording ? (
              <button
                className="group relative w-32 h-32 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={startRecording}
                disabled={isProcessing}
              >
                <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              </button>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center relative">
                  <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
                    <div className="w-6 h-6 bg-red-500 rounded-sm animate-pulse"></div>
                  </div>
                  <div className="absolute -inset-1 rounded-full bg-red-500 opacity-20 blur animate-pulse"></div>
                </div>
                <button
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition-colors duration-200 shadow-lg"
                  onClick={stopRecording}
                >
                  Stop Recording
                </button>
              </div>
            )}

            <div className="text-center">
              {recording && (
                <p className="text-lg font-medium text-green-400 animate-pulse">
                  🎤 Recording... Sing your heart out!
                </p>
              )}
              {isProcessing && (
                <p className="text-lg font-medium text-blue-400">
                  🤖 Analyzing your performance...
                </p>
              )}
              {!recording && !isProcessing && !audioUrl && (
                <p className="text-gray-400">
                  Tap the microphone to start recording
                </p>
              )}
            </div>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-8 p-4 bg-gray-700/50 rounded-xl border border-gray-600/50">
              <p className="text-sm text-gray-300 mb-3 text-center">Your Recording:</p>
              <audio 
                controls 
                src={audioUrl} 
                className="w-full [&::-webkit-media-controls-panel]:bg-gray-700 [&::-webkit-media-controls-play-button]:bg-purple-500"
              />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl border border-gray-600/50 backdrop-blur-sm">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-3xl">{getRatingEmoji(result.rating)}</span>
                  <span className="text-2xl font-bold text-gray-300">Your Score:</span>
                </div>
                <div className={`text-4xl font-bold ${getRatingColor(result.rating)}`}>
                  {result.rating}/10
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Feedback & Tips:
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {result.suggestions}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🎵 No login required • Instant AI feedback • Improve your singing skills
          </p>
        </footer>
      </div>
    </main>
  );
}