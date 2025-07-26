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

        // Send to /identify endpoint
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result?.toString().split(',')[1];
            // Call /identify for music identification
            const identifyRes = await fetch('http://localhost:8080/identify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio }),
            });
            const identifyData = await identifyRes.json();
            let identifyInfo = '';
            try {
              // Try to parse the body as JSON for pretty display
              const parsed = JSON.parse(identifyData.body);
              if (parsed && parsed.metadata && parsed.metadata.music && parsed.metadata.music.length > 0) {
                const music = parsed.metadata.music[0];
                identifyInfo = `Title: ${music.title || 'Unknown'} | Artist: ${(music.artists && music.artists[0]?.name) || 'Unknown'}`;
              } else {
                identifyInfo = 'No match found.';
              }
            } catch (e) {
              identifyInfo = 'Could not parse identification result.';
            }
            setResult({ rating: 0, suggestions: identifyInfo });
          } catch (error) {
            console.error('Error identifying audio:', error);
            setResult({ rating: 0, suggestions: 'Error identifying your recording. Please try again.' });
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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center mb-12 flex flex-col items-center">
          <Image
            src="/images/Logo.png"
            alt="Melodify Logo"
            width={96}
            height={96}
            className="mx-auto drop-shadow-lg mb-4"
            priority
          />
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
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-lg font-medium text-blue-400">
                    🤖 Identifying your song...
                  </p>
                </div>
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
                  <span className="text-3xl">🎼</span>
                  <span className="text-2xl font-bold text-gray-300">Identification Result:</span>
                </div>
                <div className="text-lg font-semibold text-blue-300">
                  {result.suggestions}
                </div>
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