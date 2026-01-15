"use client";

import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, UID, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import axios from "axios";
import { showSuccess, showError } from '@/util/toast';

interface VideoCallProps {
  orderId: string;
  onLeave?: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ orderId, onLeave }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const setRemoteVideoRef = (uid: UID, node: HTMLDivElement | null) => {
    remoteVideoRefs.current[uid as string] = node;
  };

  const getGridConfig = (totalUsers: number) => {
    if (totalUsers === 1) return 'grid-cols-1 max-w-4xl';
    if (totalUsers === 2) return 'grid-cols-1 xl:grid-cols-2 max-w-7xl';
    if (totalUsers <= 4) return 'grid-cols-1 md:grid-cols-2 max-w-7xl';
    if (totalUsers <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-7xl';
    if (totalUsers <= 9) return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 max-w-screen-xl';
    return 'grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 max-w-screen-2xl';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const init = async () => {
        setLoading(true);
        setError(null);
        try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

          const { data } = await axios.post(`${BACKEND_URL}/video/token`, { orderId }, { withCredentials: true });

          const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
          setClient(agoraClient);

          await agoraClient.join(data.appId, data.channelName, data.token, data.uid);

          const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
          setLocalTracks(tracks);

          if (localVideoRef.current) {
            tracks[1].play(localVideoRef.current);
          }

          await agoraClient.publish(tracks);
          setJoined(true);
          setLoading(false);
          showSuccess('You joined the video call');

          agoraClient.on("user-published", async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            setRemoteUsers([...agoraClient.remoteUsers]);
          });

          agoraClient.on("user-unpublished", (user) => {
            setRemoteUsers([...agoraClient.remoteUsers]);
          });

        } catch (err: any) {
          console.error("Error joining video call:", err);
          setError("Failed to join video call. Please try again later.");
          setLoading(false);
          showError("Failed to join video call. Please try again later.");
        }
      };

      init();
    }

    return () => {
      if (client) {
        client.leave();
      }
      if (localTracks) {
        localTracks.forEach((track) => {
          track.stop();
          track.close();
        });
      }
      setRemoteUsers([]);
    };
  }, [orderId]);

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack && remoteVideoRefs.current[user.uid as string]) {
        user.videoTrack.play(remoteVideoRefs.current[user.uid as string]!);
      }
      if (user.audioTrack) {
        user.audioTrack.play();
      }
    });
  }, [remoteUsers]);

  const leaveChannel = async () => {
    try {
      if (localTracks) {
        localTracks.forEach((track) => {
          track.stop();
          track.close();
        });
        setLocalTracks(null);
      }
      
      if (client) {
        await client.leave();
        setClient(null);
      }
      
      setJoined(false);
      setRemoteUsers([]);
      showSuccess('You left the video call');
      
      if (onLeave) {
        onLeave();
      }
    } catch (err) {
      console.error("Error leaving video call:", err);
      if (onLeave) {
        onLeave();
      }
    }
  };

  const toggleMic = async () => {
    if (localTracks) {
      await localTracks[0].setMuted(!micMuted);
      setMicMuted((prev) => !prev);
    }
  };

  const toggleCam = async () => {
    if (localTracks) {
      await localTracks[1].setEnabled(camOff);
      setCamOff((prev) => !prev);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 border max-w-md w-full">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Joining meeting...</h3>
              <p className="text-gray-600 text-sm">Please wait while we connect you</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 border max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Can't join meeting</h3>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button 
            onClick={leaveChannel} 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const totalUsers = remoteUsers.length + 1;

  return (
    <div className="max-h-[500px] bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Video Meeting</h1>
            <p className="text-xs text-gray-500">Order #{orderId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-xs font-medium text-orange-700">
              {totalUsers} participant{totalUsers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className={`grid gap-3 ${getGridConfig(totalUsers)} w-full h-full`}>
          {/* Local Video */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-300 aspect-video">
            <div 
              ref={localVideoRef} 
              className="w-full h-full bg-gray-800"
            />
            
            {/* Local User Overlay */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black/70 rounded-md px-2 py-1 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">ME</span>
                  </div>
                  <span className="text-white text-sm font-medium">You</span>
                </div>
                <div className="flex space-x-1">
                  {micMuted && (
                    <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {camOff && (
                    <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m7.022-7.022L21 3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Waiting Screen */}
          {remoteUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 aspect-video p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium text-center mb-1">Waiting for others to join</p>
              <p className="text-gray-500 text-sm text-center">They'll appear here when they join the meeting</p>
            </div>
          )}

          {/* Remote Videos */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-300 aspect-video">
              {user.hasVideo ? (
                <div
                  ref={(node) => setRemoteVideoRef(user.uid, node)}
                  className="w-full h-full bg-gray-800"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Remote User Overlay */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/70 rounded-md px-2 py-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">{String(user.uid).slice(-2).toUpperCase()}</span>
                    </div>
                    <span className="text-white text-sm font-medium">User {user.uid}</span>
                  </div>
                  <div className="flex space-x-1">
                    {!user.hasAudio && (
                      <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center" title="Microphone off">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {!user.hasVideo && (
                       <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center" title="Camera off">
                         <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m7.022-7.022L21 3" />
                         </svg>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-center flex-shrink-0">
        <div className="flex items-center space-x-2">
          {/* Microphone Button */}
          <button 
            onClick={toggleMic} 
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              micMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={micMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {micMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h1.586l4.707-4.707C10.923 4.663 12 5.109 12 6v11.293l6.207-6.207a1 1 0 011.414 1.414L8.707 23.414a1 1 0 01-1.414 0L6.586 22.707 5.586 15zM17 7l-5 5v6l5-5V7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          {/* Camera Button */}
          <button 
            onClick={toggleCam} 
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              camOff 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={camOff ? 'Turn camera on' : 'Turn camera off'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {camOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m7.022-7.022L21 3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* End Call Button */}
          <button 
            onClick={leaveChannel} 
            className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200"
            title="End call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17l-1.5 1.5-1.5-1.5-1.015 1.258A11.042 11.042 0 013 12c0-4.478 4.05-8 9-8a9.49 9.49 0 014.5 1.207" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;