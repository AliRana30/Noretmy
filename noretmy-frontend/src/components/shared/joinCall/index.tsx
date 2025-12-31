// import React, { useEffect, useState, useRef } from "react";
// import AgoraRTC from "agora-rtc-sdk-ng";

// const APP_ID = "589d1f80825d48c38521fc4adf40688a"; // Replace with your Agora App ID
// const CHANNEL = "mychannel"; // Replace with your Agora channel name
// const TOKEN = "007eJxTYLD/7T1Fetot//3FIQssOHS3KHvf8X9z80BCUPfUkz5ubgUKDKYWlimGaRYGFkamKSYWycYWpkaGackmiSlpJgZmFhaJO7I2pDcEMjJMyFvGyMgAgSA+J0NuZXJGYl5eag4DAwDMsCE7"; // Replace with your Agora token if needed

// const VideoCall = () => {
//   const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
//   const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
//   const [remoteUsers, setRemoteUsers] = useState({});
//   const [isAudioMuted, setIsAudioMuted] = useState(false);
//   const [isVideoMuted, setIsVideoMuted] = useState(false);
//   const localPlayerRef = useRef(null);
//   const remotePlayerRef = useRef(null);

//   useEffect(() => {
//     client.current.on("user-published", handleUserJoined);
//     client.current.on("user-unpublished", handleUserLeft);

//     return () => {
//       client.current.off("user-published", handleUserJoined);
//       client.current.off("user-unpublished", handleUserLeft);
//     };
//   }, []);

//   const joinCall = async () => {
//     try {
//       const uid = await client.current.join(APP_ID, CHANNEL, TOKEN, null);

//       const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
//       const videoTrack = await AgoraRTC.createCameraVideoTrack();

//       setLocalTracks({ audio: audioTrack, video: videoTrack });

//       // Ensure video container exists
//       const localStream = document.createElement("div");
//       localStream.id = `user-${uid}`;
//       localStream.className = "video-container";
//       localPlayerRef.current.innerHTML = ""; // Clear previous instances
//       localPlayerRef.current.appendChild(localStream);

//       videoTrack.play(localStream);
//       await client.current.publish([audioTrack, videoTrack]);
//     } catch (error) {
//       console.error("Join call error:", error);
//     }
//   };

//   const handleUserJoined = async (user, mediaType) => {
//     await client.current.subscribe(user, mediaType);

//     if (mediaType === "video") {
//       setRemoteUsers((prevUsers) => ({ ...prevUsers, [user.uid]: user }));

//       // Ensure remote video container exists
//       const remoteStream = document.createElement("div");
//       remoteStream.id = `user-${user.uid}`;
//       remoteStream.className = "video-container";
//       remotePlayerRef.current.appendChild(remoteStream);

//       user.videoTrack.play(remoteStream);
//     }
//     if (mediaType === "audio") {
//       user.audioTrack.play();
//     }
//   };

//   const handleUserLeft = (user) => {
//     setRemoteUsers((prevUsers) => {
//       const updatedUsers = { ...prevUsers };
//       delete updatedUsers[user.uid];
//       return updatedUsers;
//     });

//     // Remove video container of the user who left
//     const videoElement = document.getElementById(`user-${user.uid}`);
//     if (videoElement) {
//       videoElement.remove();
//     }
//   };

//   const toggleAudio = async () => {
//     if (localTracks.audio) {
//       await localTracks.audio.setMuted(!isAudioMuted);
//       setIsAudioMuted(!isAudioMuted);
//     }
//   };

//   const toggleVideo = async () => {
//     if (localTracks.video) {
//       await localTracks.video.setMuted(!isVideoMuted);
//       setIsVideoMuted(!isVideoMuted);
//     }
//   };

//   const leaveCall = async () => {
//     for (let track of Object.values(localTracks)) {
//       if (track) {
//         track.stop();
//         track.close();
//       }
//     }
//     await client.current.leave();
//     setLocalTracks({ audio: null, video: null });
//     setRemoteUsers({});

//     // Clear video containers
//     if (localPlayerRef.current) localPlayerRef.current.innerHTML = "";
//     if (remotePlayerRef.current) remotePlayerRef.current.innerHTML = "";
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
//       {/* Video Containers */}
//       <div className="grid grid-cols-2 gap-4 p-4 w-full max-w-4xl">
//         {/* Local Video */}
//         <div ref={localPlayerRef} className="video-container bg-gray-800 rounded-lg flex items-center justify-center w-full h-60">
//           <p className="text-center text-gray-400">Your Video</p>
//         </div>

//         {/* Remote Video */}
//         <div ref={remotePlayerRef} className="video-container bg-gray-800 rounded-lg flex items-center justify-center w-full h-60">
//           <p className="text-center text-gray-400">Remote User</p>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="mt-4 flex space-x-4">
//         <button className="px-4 py-2 bg-blue-600 rounded-md" onClick={joinCall}>Join</button>
//         <button className="px-4 py-2 bg-yellow-500 rounded-md" onClick={toggleAudio}>{isAudioMuted ? "Unmute" : "Mute"}</button>
//         <button className="px-4 py-2 bg-green-500 rounded-md" onClick={toggleVideo}>{isVideoMuted ? "Show Video" : "Hide Video"}</button>
//         <button className="px-4 py-2 bg-red-600 rounded-md" onClick={leaveCall}>Leave</button>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;
