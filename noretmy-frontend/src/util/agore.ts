// import { createClient, createMicrophoneAndCameraTracks } from "agora-rtc-sdk-ng";

// const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID; // Use environment variables
// const TOKEN = process.env.NEXT_PUBLIC_AGORA_TOKEN || null; // Set token (null for testing)

// const agoraClient = createClient({ mode: "rtc", codec: "vp8" });

// /**
//  * Generates a unique Agora room name based on sellerId and buyerId.
//  */
// const generateRoomName = (sellerId, buyerId) => {
//   return `room-${sellerId}-${buyerId}`;
// };

// /**
//  * Initializes Agora and joins a specific room.
//  */
// export const initAgora = async (sellerId, buyerId) => {
//   try {
//     const CHANNEL = generateRoomName(sellerId, buyerId);
//     await agoraClient.join(APP_ID, CHANNEL, TOKEN, null);
//     const tracks = await createMicrophoneAndCameraTracks();
//     return { tracks, CHANNEL };
//   } catch (error) {
//     console.error("Agora Initialization Error:", error);
//     return null;
//   }
// };

// /**
//  * Leaves the Agora call and stops tracks.
//  */
// export const leaveCall = async (tracks) => {
//   try {
//     if (tracks) {
//       tracks.forEach((track) => {
//         track.stop();
//         track.close();
//       });
//     }
//     await agoraClient.leave();
//     console.log("Left the call successfully.");
//   } catch (error) {
//     console.error("Error leaving the call:", error);
//   }
// };

// /**
//  * Toggles the microphone on/off.
//  */
// export const toggleMic = (track, isMuted) => {
//   if (track) {
//     isMuted ? track.setMuted(false) : track.setMuted(true);
//     return !isMuted;
//   }
//   return isMuted;
// };

// /**
//  * Toggles the camera on/off.
//  */
// export const toggleCamera = (track, isDisabled) => {
//   if (track) {
//     isDisabled ? track.setEnabled(true) : track.setEnabled(false);
//     return !isDisabled;
//   }
//   return isDisabled;
// };

// export { agoraClient, generateRoomName };
