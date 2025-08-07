import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/VideoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';
import { useNavigate } from 'react-router-dom';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    const navigate = useNavigate();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // Monitor username changes to ensure it's properly stored
    useEffect(() => {
        if (username && username.trim()) {
            window.currentUsername = username.trim();
            console.log('Username updated:', username.trim());
        }
    }, [username]);

    useEffect(() => {
        console.log("HELLO")
        getPermissions();
    }, []) // Add dependency array to prevent infinite loop

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            try {
                const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoPermission) {
                    setVideoAvailable(true);
                    console.log('Video permission granted');
                    videoPermission.getTracks().forEach(track => track.stop()); // Stop the test stream immediately
                }
            } catch (e) {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            try {
                const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (audioPermission) {
                    setAudioAvailable(true);
                    console.log('Audio permission granted');
                    audioPermission.getTracks().forEach(track => track.stop()); // Stop the test stream
                }
            } catch (e) {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }
        } catch (error) {
            console.log(error);
        }
    };

    let getMedia = () => {
        console.log('📹 Getting media with permissions:', { videoAvailable, audioAvailable });
        console.log('📹 Current video/audio states:', { video, audio });
        
        return new Promise((resolve, reject) => {
            // Get the media stream FIRST
            getUserMedia()
                .then(() => {
                    console.log('Media acquired, now connecting to socket server');
                    // Then connect to socket server
                    connectToSocketServer();
                    resolve();
                })
                .catch((error) => {
                    console.error('Failed to get media:', error);
                    reject(error);
                });
        });
    }

    let getUserMediaSuccess = (stream) => {
        console.log('✅ getUserMediaSuccess called with stream:', stream);
        console.log('Video tracks:', stream.getVideoTracks().length);
        console.log('Audio tracks:', stream.getAudioTracks().length);
        
        // Stop any existing stream
        try {
            if (window.localStream && window.localStream !== stream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { console.log(e) }

        // Set the new stream
        window.localStream = stream
        
        // ENSURE video element gets the stream
        if (localVideoref.current) {
            if (localVideoref.current.srcObject !== stream) {
                localVideoref.current.srcObject = stream
                console.log('Local video ref updated with NEW stream');
            }
            
            // Force the video to play
            setTimeout(() => {
                if (localVideoref.current) {
                    localVideoref.current.play().catch(e => {
                        console.log('Auto-play prevented (expected):', e);
                    });
                }
            }, 100);
        } else {
            console.log('Local video ref is null!');
        }

        console.log('Stream assigned to video element and window.localStream');

        // Only update peer connections if they exist
        for (let id in connections) {
            if (id === socketIdRef.current) continue

            // Update with new tracks for existing connections
            updatePeerTracks(connections[id], stream);

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        // No need for track onended handler here - let's keep it simple
    }

    let getUserMedia = () => {
        console.log('🎥 getUserMedia called with states:', { video, audio, videoAvailable, audioAvailable });
        
        return new Promise((resolve, reject) => {
            // FORCE REAL VIDEO - Don't create black/silent streams unless absolutely necessary
            if (videoAvailable || audioAvailable) {
                const constraints = { 
                    video: videoAvailable ? { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 }
                    } : false, 
                    audio: audioAvailable 
                };
                console.log('Getting media with constraints:', constraints);
                
                navigator.mediaDevices.getUserMedia(constraints)
                    .then((stream) => {
                        console.log('🎉 REAL Stream obtained successfully!');
                        console.log('Stream ID:', stream.id);
                        console.log('Video tracks:', stream.getVideoTracks().length);
                        console.log('Audio tracks:', stream.getAudioTracks().length);
                        
                        // IMMEDIATELY set the stream to video element
                        if (localVideoref.current && stream.getVideoTracks().length > 0) {
                            localVideoref.current.srcObject = stream;
                            window.localStream = stream;
                            console.log('IMMEDIATE: Stream set to video element');
                            
                            // Force video to play
                            localVideoref.current.play().catch(e => console.log('Play prevented:', e));
                        }
                        
                        getUserMediaSuccess(stream);
                        resolve(stream);
                    })
                    .catch((e) => {
                        console.error(' getUserMedia error:', e);
                        alert('Camera access denied! Please allow camera access and refresh the page.');
                        reject(e);
                    })
            } else {
                console.log(' No video/audio available - cannot proceed');
                const error = new Error('No camera or microphone available. Please check your devices.');
                alert(error.message);
                reject(error);
            }
        });
    }

    let updatePeerTracks = (connection, stream) => {
        console.log('Updating peer tracks for connection with new stream:', stream);
        
        try {
            // Handle video track
            const videoTrack = stream.getVideoTracks()[0];
            const videoSender = connection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (videoSender && videoTrack) {
                videoSender.replaceTrack(videoTrack);
                console.log('Replaced video track for connection');
            } else if (videoTrack) {
                connection.addTrack(videoTrack, stream);
                console.log('Added new video track for connection');
            }
            
            // Handle audio track
            const audioTrack = stream.getAudioTracks()[0];
            const audioSender = connection.getSenders().find(s => 
                s.track && s.track.kind === 'audio'
            );
            
            if (audioSender && audioTrack) {
                audioSender.replaceTrack(audioTrack);
                console.log('Replaced audio track for connection');
            } else if (audioTrack) {
                connection.addTrack(audioTrack, stream);
                console.log('Added new audio track for connection');
            }
            
        } catch (e) {
            console.log('Error replacing tracks for connection:', e);
        }
    }




    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            // Use addTrack for screen sharing too
            stream.getTracks().forEach(track => {
                connections[id].addTrack(track, stream);
            });

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        console.log("📨 GOT MESSAGE FROM SERVER:");
        console.log("- FROM ID:", fromId);
        console.log("- MESSAGE:", message);
        
        var signal = JSON.parse(message)
        console.log("📋 PARSED SIGNAL:", signal);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                console.log(" PROCESSING SDP, TYPE:", signal.sdp.type);
                console.log("- From:", fromId);
                console.log("- Connection exists:", !!connections[fromId]);
                
                if (!connections[fromId]) {
                    console.log(" No connection for:", fromId, "- this shouldn't happen");
                    return;
                }
                
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    console.log(" Remote description set successfully for:", fromId);
                    
                    if (signal.sdp.type === 'offer') {
                        console.log(" Creating answer for offer from:", fromId);
                        
                        // ENSURE we add our local stream to this connection before creating answer
                        if (window.localStream && window.localStream.getTracks().length > 0) {
                            console.log(" Adding local stream to connection before creating answer");
                            
                            // Check if tracks are already added
                            const existingSenders = connections[fromId].getSenders();
                            console.log("- Existing senders count:", existingSenders.length);
                            
                            if (existingSenders.length === 0) {
                                window.localStream.getTracks().forEach(track => {
                                    console.log("- Adding track to connection:", track.kind, track.id);
                                    connections[fromId].addTrack(track, window.localStream);
                                });
                                console.log(" Local tracks added to connection");
                            } else {
                                console.log("ℹTracks already added to connection");
                            }
                        } else {
                            console.log(" No local stream available for answer!");
                        }
                        
                        connections[fromId].createAnswer().then((description) => {
                            console.log(" Answer created:", description.type);
                            connections[fromId].setLocalDescription(description).then(() => {
                                console.log(" Local description set, sending answer to:", fromId);
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.error(" Error setting local description:", e))
                        }).catch(e => console.error(" Error creating answer:", e))
                    } else if (signal.sdp.type === 'answer') {
                        console.log(" Received answer from:", fromId);
                    }
                }).catch(e => console.error(" Error setting remote description:", e))
            }

            if (signal.ice) {
                console.log(" PROCESSING ICE CANDIDATE for:", fromId);
                if (connections[fromId]) {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error("❌ Error adding ICE candidate:", e))
                } else {
                    console.log(" No connection for ICE candidate from:", fromId);
                }
            }
        } else {
            console.log("IGNORING MESSAGE FROM SELF");
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { 
            secure: true,
            transports: ['polling'] // Force polling instead of WebSocket
        })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            // Use the globally stored username to ensure it's not lost during state updates
            const usernameToSend = window.currentUsername || username || 'Anonymous';
            console.log('🔗 Socket connected, sending join-call with username:', usernameToSend);
            console.log('🔗 Current username state:', username);
            console.log('🔗 Global username:', window.currentUsername);
            
            socketRef.current.emit('join-call', window.location.href, usernameToSend)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients, clientsWithUsernames) => {
                console.log(" USER JOINED EVENT:");
                console.log("- New User ID:", id);
                console.log("- All Clients:", clients);
                console.log("- Clients with usernames:", clientsWithUsernames);
                console.log("- My ID:", socketIdRef.current);
                console.log("- Am I the new user?", id === socketIdRef.current);
                
                // Store usernames for all clients - ENHANCED MAPPING
                const userMap = {};
                
                // Add my own username first
                const myUsername = window.currentUsername || username || 'Me';
                userMap[socketIdRef.current] = myUsername;
                console.log(`🔗 Added my username: ${socketIdRef.current} → ${myUsername}`);
                
                if (clientsWithUsernames && Array.isArray(clientsWithUsernames)) {
                    clientsWithUsernames.forEach(client => {
                        if (client && client.socketId && client.username) {
                            // Don't overwrite with Unknown values if we have a better name
                            if (client.username.startsWith('Unknown-') && userMap[client.socketId] && !userMap[client.socketId].startsWith('Unknown-')) {
                                console.log(` Keeping existing username for ${client.socketId}: ${userMap[client.socketId]} (ignoring ${client.username})`);
                            } else {
                                userMap[client.socketId] = client.username;
                                console.log(`Mapped ${client.socketId} → ${client.username}`);
                            }
                        }
                    });
                    console.log(" Final userMap:", userMap);
                } else {
                    console.log(" No valid clientsWithUsernames received");
                    // Fallback: create userMap with available info
                    if (clients && Array.isArray(clients)) {
                        clients.forEach(clientId => {
                            if (clientId === socketIdRef.current) {
                                userMap[clientId] = myUsername;
                            } else if (!userMap[clientId]) {
                                userMap[clientId] = `User ${clientId.slice(-4)}`;
                            }
                        });
                        console.log(" Fallback userMap:", userMap);
                    }
                }

                const currentConnectionCount = Object.keys(connections).length;
                console.log(` Current connections: ${currentConnectionCount}, Expected: ${clients.length - 1}`);
                
                clients.forEach((socketListId) => {
                    // Skip setting up connection to myself
                    if (socketListId === socketIdRef.current) {
                        console.log("⏭ SKIPPING SELF CONNECTION");
                        return;
                    }
                    
                    // Skip if connection already exists - STRICT CHECK
                    if (connections[socketListId]) {
                        console.log("♻️ CONNECTION ALREADY EXISTS FOR:", socketListId, "- SKIPPING");
                        return;
                    }
                    
                    // ADDITIONAL CHECK: Prevent creating connection if video already exists
                    const existingVideo = videos.find(v => v.socketId === socketListId);
                    if (existingVideo) {
                        console.log("📺 VIDEO ALREADY EXISTS FOR:", socketListId, "- SKIPPING CONNECTION CREATION");
                        return;
                    }
                    
                    console.log("🔧 SETTING UP NEW CONNECTION FOR:", socketListId);
                    console.log("- Username:", userMap[socketListId] || 'Unknown');

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    
                    console.log("CONNECTION CREATED:", connections[socketListId]);
                    
                    // Monitor connection state
                    connections[socketListId].onconnectionstatechange = () => {
                        console.log(` Connection state for ${socketListId}:`, connections[socketListId].connectionState);
                    };
                    
                    connections[socketListId].oniceconnectionstatechange = () => {
                        console.log(`ICE connection state for ${socketListId}:`, connections[socketListId].iceConnectionState);
                    };
                    
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            console.log("SENDING ICE CANDIDATE to:", socketListId);
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Enhanced ontrack handler for better remote video handling
                    connections[socketListId].ontrack = (event) => {
                        console.log(" RECEIVED TRACK EVENT:");
                        console.log("- From Socket ID:", socketListId);
                        console.log("- Track Kind:", event.track.kind);
                        console.log("- Track ID:", event.track.id);
                        console.log("- Track readyState:", event.track.readyState);
                        console.log("- Track enabled:", event.track.enabled);
                        console.log("- Stream Count:", event.streams.length);
                        
                        if (event.streams && event.streams.length > 0) {
                            const stream = event.streams[0];
                            console.log("📺 Processing received stream:");
                            console.log("- Stream ID:", stream.id);
                            console.log("- Video tracks:", stream.getVideoTracks().length);
                            console.log("- Audio tracks:", stream.getAudioTracks().length);
                            
                            // Enhanced track logging
                            stream.getVideoTracks().forEach((track, idx) => {
                                console.log(`- Video track ${idx}: enabled=${track.enabled}, readyState=${track.readyState}, id=${track.id}`);
                                
                                // Ensure track is enabled
                                if (!track.enabled) {
                                    console.log(`⚠️ Video track ${idx} is disabled, enabling it`);
                                    track.enabled = true;
                                }
                            });

                            stream.getAudioTracks().forEach((track, idx) => {
                                console.log(`- Audio track ${idx}: enabled=${track.enabled}, readyState=${track.readyState}, id=${track.id}`);
                            });

                            // STRICT duplicate prevention - check multiple sources
                            let videoExists = videos.find(video => video.socketId === socketListId);
                            let videoExistsInRef = videoRef.current.find(video => video.socketId === socketListId);

                            if (videoExists || videoExistsInRef) {
                                console.log(" UPDATING EXISTING VIDEO for:", socketListId);
                                console.log("- Previous stream ID:", (videoExists || videoExistsInRef).stream?.id);
                                console.log("- New stream ID:", stream.id);
                                console.log("- Username:", userMap[socketListId] || 'Unknown');

                                setVideos(videos => {
                                    const updatedVideos = videos.map(video =>
                                        video.socketId === socketListId ? { 
                                            ...video, 
                                            stream: stream,
                                            lastUpdated: Date.now(),
                                            hasVideo: stream.getVideoTracks().length > 0,
                                            hasAudio: stream.getAudioTracks().length > 0,
                                            username: userMap[socketListId] || video.username || `Unknown-${socketListId.slice(-4)}`
                                        } : video
                                    );
                                    videoRef.current = updatedVideos;
                                    console.log("Updated videos array:", updatedVideos.length);
                                    
                                    // Force re-render of video elements
                                    setTimeout(() => {
                                        const videoElement = document.querySelector(`video[data-socket="${socketListId}"]`);
                                        if (videoElement && videoElement.srcObject !== stream) {
                                            console.log(" Force updating video element srcObject");
                                            videoElement.srcObject = stream;
                                            videoElement.play().catch(e => console.log("Auto-play blocked:", e));
                                        }
                                    }, 100);
                                    
                                    return updatedVideos;
                                });
                            } else {
                                console.log("➕ CREATING NEW VIDEO for:", socketListId);
                                console.log("- Username:", userMap[socketListId] || 'Unknown');
                                
                                // TRIPLE CHECK for duplicates before creating
                                const tripleCheck1 = videos.find(v => v.socketId === socketListId);
                                const tripleCheck2 = videoRef.current.find(v => v.socketId === socketListId);
                                
                                if (tripleCheck1 || tripleCheck2) {
                                    console.log("TRIPLE CHECK: Video already exists, ABORTING creation");
                                    return;
                                }
                                
                                let newVideo = {
                                    socketId: socketListId,
                                    stream: stream,
                                    autoplay: true,
                                    playsinline: true,
                                    created: Date.now(),
                                    hasVideo: stream.getVideoTracks().length > 0,
                                    hasAudio: stream.getAudioTracks().length > 0,
                                    username: userMap[socketListId] || `Unknown-${socketListId.slice(-4)}`
                                };

                                setVideos(videos => {
                                    // FINAL duplicate check inside setState
                                    const finalCheck = videos.find(v => v.socketId === socketListId);
                                    if (finalCheck) {
                                        console.log("🚨 FINAL CHECK: Duplicate detected in setVideos, REJECTING");
                                        return videos; // Return unchanged videos
                                    }
                                    
                                    console.log("📊 Current videos before adding:", videos.length);
                                    console.log("📊 Adding video for:", socketListId, "with username:", newVideo.username);
                                    const updatedVideos = [...videos, newVideo];
                                    console.log("📊 Updated videos after adding:", updatedVideos.length);
                                    videoRef.current = updatedVideos;
                                    
                                    // Ensure video element gets stream immediately
                                    setTimeout(() => {
                                        const videoElement = document.querySelector(`video[data-socket="${socketListId}"]`);
                                        if (videoElement) {
                                            console.log("🎬 Setting stream to new video element");
                                            videoElement.srcObject = stream;
                                            videoElement.play().catch(e => console.log("Auto-play blocked:", e));
                                        }
                                    }, 100);
                                    
                                    return updatedVideos;
                                });
                            }
                        } else {
                            console.log("No streams in track event for:", socketListId);
                            
                            // Handle tracks without streams (create new MediaStream)
                            console.log("🔧 Creating MediaStream from individual track");
                            const newStream = new MediaStream([event.track]);
                            
                            setVideos(videos => {
                                const existingVideo = videos.find(v => v.socketId === socketListId);
                                if (existingVideo) {
                                    // Add track to existing stream or update existing video
                                    const updatedVideos = videos.map(video => {
                                        if (video.socketId === socketListId) {
                                            if (video.stream) {
                                                video.stream.addTrack(event.track);
                                                return { 
                                                    ...video, 
                                                    lastUpdated: Date.now(),
                                                    username: userMap[socketListId] || video.username || `User ${socketListId.slice(-4)}`
                                                };
                                            } else {
                                                return { 
                                                    ...video, 
                                                    stream: newStream, 
                                                    lastUpdated: Date.now(),
                                                    username: userMap[socketListId] || video.username || `User ${socketListId.slice(-4)}`
                                                };
                                            }
                                        }
                                        return video;
                                    });
                                    videoRef.current = updatedVideos;
                                    return updatedVideos;
                                } else {
                                    // Create new video with the track - PREVENT DUPLICATES
                                    const finalCheck = videos.find(v => v.socketId === socketListId);
                                    if (finalCheck) {
                                        console.log("⚠️ Duplicate detected in track handler, not adding");
                                        return videos;
                                    }
                                    
                                    const newVideo = {
                                        socketId: socketListId,
                                        stream: newStream,
                                        autoplay: true,
                                        playsinline: true,
                                        created: Date.now(),
                                        username: userMap[socketListId] || `User ${socketListId.slice(-4)}`
                                    };
                                    const updatedVideos = [...videos, newVideo];
                                    videoRef.current = updatedVideos;
                                    return updatedVideos;
                                }
                            });
                        }
                    };


                    // Enhanced local stream sharing for better remote video visibility
                    console.log("📤 ADDING LOCAL STREAM TO CONNECTION:", socketListId);
                    console.log("- Local Stream exists:", !!window.localStream);
                    console.log("- Local Stream ID:", window.localStream?.id);
                    console.log("- Local Stream tracks:", window.localStream?.getTracks()?.length || 0);
                    
                    if (window.localStream && window.localStream.getTracks().length > 0) {
                        const tracks = window.localStream.getTracks();
                        console.log("- Total tracks to add:", tracks.length);
                        
                        // Ensure all tracks are enabled before adding
                        tracks.forEach((track, index) => {
                            console.log(`- Track ${index}: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}, id=${track.id}`);
                            
                            // Force enable the track if it's disabled
                            if (!track.enabled) {
                                track.enabled = true;
                                console.log(`- Enabled track ${index}`);
                            }
                            
                            // Add track to the connection
                            try {
                                connections[socketListId].addTrack(track, window.localStream);
                                console.log(` Added track ${index} to connection`);
                            } catch (e) {
                                console.error(` Failed to add track ${index}:`, e);
                            }
                        });
                        
                        console.log(" All local tracks added to connection:", socketListId);
                        
                        // Verify tracks were added by checking senders
                        const senders = connections[socketListId].getSenders();
                        console.log("🔍 Connection senders after adding tracks:", senders.length);
                        senders.forEach((sender, idx) => {
                            console.log(`- Sender ${idx}: ${sender.track?.kind} (enabled: ${sender.track?.enabled})`);
                        });
                        
                    } else {
                        console.log(" NO LOCAL STREAM AVAILABLE - this will cause remote video issues");
                        
                        // Force getting media stream for this connection
                        console.log(" Attempting to get media stream immediately...");
                        getUserMedia().then(() => {
                            console.log(" Media acquired, now adding tracks to connection:", socketListId);
                            if (window.localStream && connections[socketListId]) {
                                window.localStream.getTracks().forEach(track => {
                                    try {
                                        connections[socketListId].addTrack(track, window.localStream);
                                        console.log(` Added ${track.kind} track to connection after media acquisition`);
                                    } catch (e) {
                                        console.error(" Failed to add track after media acquisition:", e);
                                    }
                                });
                            }
                        }).catch(e => {
                            console.error("Failed to get media for connection:", e);
                        });
                    }
                })
                
                // Enhanced offer creation with better timing
                if (id === socketIdRef.current) {
                    // I am the new user joining - create offers to ALL existing users
                    console.log("I AM THE NEW USER, CREATING OFFERS TO EXISTING USERS");
                    
                    // Wait longer to ensure all connections are ready and streams are added
                    setTimeout(() => {
                        console.log("Starting offer creation phase");
                        
                        for (let peerId in connections) {
                            if (peerId === socketIdRef.current) continue;
                            
                            console.log("CREATING OFFER TO EXISTING USER:", peerId);
                            console.log("- Connection state:", connections[peerId].connectionState);
                            console.log("- Senders count:", connections[peerId].getSenders().length);
                            
                            // Double-check that we have local stream tracks before creating offer
                            if (!window.localStream || window.localStream.getTracks().length === 0) {
                                console.log("⚠️ No local stream before creating offer, getting media first");
                                continue;
                            }
                            
                            connections[peerId].createOffer().then((description) => {
                                console.log("📄 OFFER CREATED FOR:", peerId, description.type);
                                console.log("- SDP length:", description.sdp.length);
                                
                                connections[peerId].setLocalDescription(description)
                                    .then(() => {
                                        console.log("LOCAL DESCRIPTION SET, SENDING OFFER TO:", peerId);
                                        socketRef.current.emit('signal', peerId, JSON.stringify({ 'sdp': connections[peerId].localDescription }))
                                    })
                                    .catch(e => console.error("Error setting local description:", e))
                            }).catch(e => console.error(" Error creating offer:", e))
                        }
                    }, 1500); // Increased wait time to ensure streams are ready
                } else {
                    // Someone else joined - if they're new, they'll create offers to me
                    console.log("👤 EXISTING USER - waiting for offers from new user:", id);
                    console.log("- My stream ready:", !!window.localStream);
                    console.log("- My stream tracks:", window.localStream?.getTracks()?.length || 0);
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        console.log('Video button clicked, current state:', video);
        const newVideoState = !video;
        setVideo(newVideoState);
        
        if (window.localStream) {
            const videoTracks = window.localStream.getVideoTracks();
            console.log(`Found ${videoTracks.length} video tracks`);
            
            if (videoTracks.length > 0) {
                videoTracks.forEach(track => {
                    track.enabled = newVideoState;
                    console.log(`Video track enabled set to: ${track.enabled}`);
                });
                
                // Update video for all peer connections
                for (let id in connections) {
                    if (id === socketIdRef.current) continue;
                    
                    try {
                        // Get the sender for video track
                        const sender = connections[id].getSenders().find(s => 
                            s.track && s.track.kind === 'video'
                        );
                        
                        if (sender && sender.track) {
                            sender.track.enabled = newVideoState;
                            console.log(`Updated video track for peer ${id}: ${newVideoState}`);
                        }
                    } catch (e) {
                        console.log('Error updating video for peer:', e);
                    }
                }
            } else {
                console.log('No video tracks found, getting new media');
                // If no video tracks and user wants to enable video, get new media
                if (newVideoState) {
                    // Get new media with updated video state
                    setTimeout(() => {
                        getUserMedia();
                    }, 100);
                }
            }
        } else {
            console.log('No local stream, getting new media');
            // If no stream, get new media
            setTimeout(() => {
                getUserMedia();
            }, 100);
        }
    }
    
    let handleAudio = () => {
        console.log('Audio button clicked, current state:', audio);
        const newAudioState = !audio;
        setAudio(newAudioState);
        
        if (window.localStream) {
            const audioTracks = window.localStream.getAudioTracks();
            console.log(`Found ${audioTracks.length} audio tracks`);
            
            if (audioTracks.length > 0) {
                audioTracks.forEach(track => {
                    track.enabled = newAudioState;
                    console.log(`Audio track enabled set to: ${track.enabled}`);
                });
                
                // Update audio for all peer connections
                for (let id in connections) {
                    if (id === socketIdRef.current) continue;
                    
                    try {
                        // Get the sender for audio track
                        const sender = connections[id].getSenders().find(s => 
                            s.track && s.track.kind === 'audio'
                        );
                        
                        if (sender && sender.track) {
                            sender.track.enabled = newAudioState;
                            console.log(`Updated audio track for peer ${id}: ${newAudioState}`);
                        }
                    } catch (e) {
                        console.log('Error updating audio for peer:', e);
                    }
                }
            } else {
                console.log('No audio tracks found, getting new media');
                // If no audio tracks and user wants to enable audio, get new media
                if (newAudioState) {
                    setTimeout(() => {
                        getUserMedia();
                    }, 100);
                }
            }
        } else {
            console.log('No local stream, getting new media');
            // If no stream, get new media  
            setTimeout(() => {
                getUserMedia();
            }, 100);
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            // Stop all local video tracks
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { 
            console.log('Error stopping tracks:', e)
        }
        
        try {
            // Stop window.localStream tracks if they exist
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) {
            console.log('Error stopping window.localStream tracks:', e)
        }
        
        try {
            // Disconnect socket if connected
            if (socketRef.current) {
                socketRef.current.disconnect()
            }
        } catch (e) {
            console.log('Error disconnecting socket:', e)
        }
        
        // Just redirect to home page without logging out
        navigate("/home");
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    // Function to manually restart video stream
    const forceRestartVideo = () => {
        console.log('🔄 Force restarting video stream');
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
        setTimeout(() => {
            getUserMedia();
        }, 500);
    };

    // Function to clean up duplicate videos
    const cleanupDuplicateVideos = () => {
        console.log('🧹 Cleaning up duplicate videos');
        
        setVideos(currentVideos => {
            const uniqueVideos = [];
            const seenSocketIds = new Set();
            
            currentVideos.forEach(video => {
                if (!seenSocketIds.has(video.socketId)) {
                    seenSocketIds.add(video.socketId);
                    uniqueVideos.push(video);
                    console.log(` Keeping video for: ${video.socketId} (${video.username})`);
                } else {
                    console.log(` Removing duplicate video for: ${video.socketId}`);
                }
            });
            
            console.log(`Removed ${currentVideos.length - uniqueVideos.length} duplicate videos`);
            videoRef.current = uniqueVideos;
            return uniqueVideos;
        });
    };

    // Function to force refresh all remote video connections
    const forceRefreshRemoteVideos = () => {
        console.log(' Force refreshing all remote video connections');
        
        videos.forEach((video, index) => {
            console.log(` Processing video ${index + 1}: ${video.socketId}`);
            
            if (video.stream) {
                const videoElement = document.querySelector(`video[data-socket="${video.socketId}"]`);
                if (videoElement) {
                    console.log(`- Found video element for ${video.socketId}`);
                    console.log(`- Current srcObject: ${videoElement.srcObject?.id}`);
                    console.log(`- Target stream: ${video.stream.id}`);
                    
                    // Force re-assign the stream
                    videoElement.srcObject = null;
                    setTimeout(() => {
                        videoElement.srcObject = video.stream;
                        videoElement.play().catch(e => console.log('Play failed:', e));
                        console.log(`Reassigned stream to ${video.socketId}`);
                    }, 100);
                } else {
                    console.log(`No video element found for ${video.socketId}`);
                }
            } else {
                console.log(`No stream for video ${video.socketId}`);
            }
        });
        
        alert(`Attempted to refresh ${videos.length} remote video connections. Check console for details.`);
    };

    // SIMPLE TEST FUNCTION - Get video directly
    const testGetVideo = async () => {
        console.log('TEST: Getting video directly');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 }, 
                audio: true 
            });
            console.log('TEST: Got stream:', stream);
            
            if (localVideoref.current) {
                localVideoref.current.srcObject = stream;
                window.localStream = stream;
                console.log(' TEST: Set stream to video element');
                
                await localVideoref.current.play();
                console.log('TEST: Video playing!');
            }
        } catch (error) {
            console.error(' TEST ERROR:', error);
            alert('Test failed: ' + error.message);
        }
    };

    // Debug function to check username handling
    const debugUsernames = () => {
        console.log('=== USERNAME DEBUG ===');
        console.log('React state username:', username);
        console.log('Global username:', window.currentUsername);
        console.log('My socket ID:', socketIdRef.current);
        
        // Check videos array usernames
        console.log('\n Videos Array Usernames:');
        videos.forEach((video, idx) => {
            console.log(`Video ${idx + 1}: socketId=${video.socketId}, username="${video.username}"`);
        });
        
        // Check DOM elements
        console.log('\n DOM Username Display:');
        videos.forEach((video) => {
            const usernameElement = document.querySelector(`[data-username-for="${video.socketId}"]`);
            if (usernameElement) {
                console.log(`DOM username for ${video.socketId}: "${usernameElement.textContent}"`);
            } else {
                console.log(`No DOM username element found for ${video.socketId}`);
            }
        });
        
        const summary = `
 Username Debug Summary:
• React Username: "${username}"
• Global Username: "${window.currentUsername}"
• Socket ID: ${socketIdRef.current}
• Videos Count: ${videos.length}

${videos.map((v, i) => `
• Video ${i + 1}: "${v.username}" (${v.socketId.slice(-4)})`).join('')}
        `;
        
        alert(summary);
        console.log('==================');
    };

    // Enhanced debug function to check all connections and streams
    const debugAllConnections = () => {
        console.log('=== ENHANCED CONNECTION DEBUG ===');
        console.log('My Socket ID:', socketIdRef.current);
        console.log('Total connections:', Object.keys(connections).length);
        console.log('Videos array length:', videos.length);
        console.log('Local stream:', window.localStream);
        console.log('Local video tracks:', window.localStream?.getVideoTracks()?.length || 0);
        console.log('Local audio tracks:', window.localStream?.getAudioTracks()?.length || 0);
        
        // Check each connection in detail
        Object.keys(connections).forEach(id => {
            console.log(`\n Connection ${id}:`);
            console.log('- Connection State:', connections[id].connectionState);
            console.log('- ICE Connection State:', connections[id].iceConnectionState);
            console.log('- Signaling State:', connections[id].signalingState);
            console.log('- Senders count:', connections[id].getSenders().length);
            console.log('- Receivers count:', connections[id].getReceivers().length);
            
            // Check senders (what we're sending)
            connections[id].getSenders().forEach((sender, idx) => {
                if (sender.track) {
                    console.log(`   Sender ${idx}: ${sender.track.kind} - enabled: ${sender.track.enabled}, readyState: ${sender.track.readyState}, id: ${sender.track.id}`);
                } else {
                    console.log(`   Sender ${idx}: NO TRACK`);
                }
            });
            
            // Check receivers (what we're receiving)
            connections[id].getReceivers().forEach((receiver, idx) => {
                if (receiver.track) {
                    console.log(`   Receiver ${idx}: ${receiver.track.kind} - enabled: ${receiver.track.enabled}, readyState: ${receiver.track.readyState}, id: ${receiver.track.id}`);
                } else {
                    console.log(`   Receiver ${idx}: NO TRACK`);
                }
            });
        });
        
        // Check videos array
        console.log('\n📺 Videos Array:');
        videos.forEach((video, idx) => {
            console.log(`Video ${idx + 1}:`);
            console.log(`- Socket ID: ${video.socketId}`);
            console.log(`- Username: ${video.username || 'Not set'}`);
            console.log(`- Has Stream: ${!!video.stream}`);
            console.log(`- Stream ID: ${video.stream?.id || 'N/A'}`);
            console.log(`- Video Tracks: ${video.stream?.getVideoTracks()?.length || 0}`);
            console.log(`- Audio Tracks: ${video.stream?.getAudioTracks()?.length || 0}`);
            console.log(`- Has Video Flag: ${video.hasVideo}`);
            console.log(`- Has Audio Flag: ${video.hasAudio}`);
            
            // Check if video element exists and has the stream
            const videoElement = document.querySelector(`video[data-socket="${video.socketId}"]`);
            if (videoElement) {
                console.log(`- Video Element: EXISTS`);
                console.log(`- Video Element srcObject: ${!!videoElement.srcObject}`);
                console.log(`- Video Element srcObject ID: ${videoElement.srcObject?.id || 'N/A'}`);
                console.log(`- Video Element readyState: ${videoElement.readyState}`);
                console.log(`- Video Element paused: ${videoElement.paused}`);
                console.log(`- Video Element dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
            } else {
                console.log(`- Video Element: NOT FOUND`);
            }
        });
        
        console.log('\n==================');
        
        // Show summary alert
        const summary = `
🔍 Connection Debug Summary:
• Connections: ${Object.keys(connections).length}
• Videos: ${videos.length}
• Local Stream: ${window.localStream ? '✅' : '❌'}
• Local Video Tracks: ${window.localStream?.getVideoTracks()?.length || 0}

${Object.keys(connections).map(id => `
• Connection ${id.slice(-4)}: ${connections[id].connectionState}
  - Senders: ${connections[id].getSenders().length}
  - Receivers: ${connections[id].getReceivers().length}`).join('')}

${videos.map((v, i) => `
• Video ${i + 1}: ${v.username || v.socketId.slice(-4)}
  - Stream: ${v.stream ? '✅' : '❌'}
  - Tracks: ${v.stream?.getTracks()?.length || 0}`).join('')}
        `;
        
        alert(summary);
    };

    // Debug function to check stream status
    const checkStreamStatus = () => {
        console.log('=== STREAM DEBUG ===');
        console.log('window.localStream:', window.localStream);
        console.log('video state:', video);
        console.log('audio state:', audio);
        console.log('videoAvailable:', videoAvailable);
        console.log('audioAvailable:', audioAvailable);
        console.log('localVideoref.current:', localVideoref.current);
        console.log('localVideoref.current.srcObject:', localVideoref.current?.srcObject);
        
        if (window.localStream) {
            console.log('Video tracks:', window.localStream.getVideoTracks());
            console.log('Audio tracks:', window.localStream.getAudioTracks());
            
            window.localStream.getVideoTracks().forEach((track, index) => {
                console.log(`Video track ${index}: enabled=${track.enabled}, readyState=${track.readyState}, kind=${track.kind}, id=${track.id}`);
            });
            
            window.localStream.getAudioTracks().forEach((track, index) => {
                console.log(`Audio track ${index}: enabled=${track.enabled}, readyState=${track.readyState}, kind=${track.kind}, id=${track.id}`);
            });
        }
        
        // Check if local video element is showing the stream
        if (localVideoref.current) {
            console.log('Local video element readyState:', localVideoref.current.readyState);
            console.log('Local video element videoWidth:', localVideoref.current.videoWidth);
            console.log('Local video element videoHeight:', localVideoref.current.videoHeight);
            console.log('Local video element paused:', localVideoref.current.paused);
            console.log('Local video element muted:', localVideoref.current.muted);
        }
        
        console.log('==================');
        
        // Show alert with key info
        if (localVideoref.current) {
            const info = `
Video Element Status:
- Width: ${localVideoref.current.videoWidth}
- Height: ${localVideoref.current.videoHeight}
- Ready State: ${localVideoref.current.readyState}
- Paused: ${localVideoref.current.paused}
- Has Stream: ${!!localVideoref.current.srcObject}
- Video Tracks: ${window.localStream?.getVideoTracks()?.length || 0}
            `;
            alert(info);
        }
    };

    // Function to get preview stream for lobby
    const getPreviewStream = async () => {
        try {
            if (videoAvailable) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false // Don't need audio for preview
                });
                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
                return stream;
            }
        } catch (error) {
            console.log('Error getting preview stream:', error);
        }
        return null;
    };

    let connect = () => {
        console.log('🔵 Connect function called');
        console.log('🔵 Username to send:', username);
        console.log('🔵 Username length:', username ? username.length : 'undefined');
        console.log('🔵 Username trimmed:', username ? username.trim() : 'undefined');
        
        // Validate username before connecting
        if (!username || !username.trim()) {
            alert('Please enter a valid username');
            return;
        }
        
        // Store username globally for socket connection
        window.currentUsername = username.trim();
        console.log('🔵 Stored username globally:', window.currentUsername);
        
        // Stop preview stream before connecting
        if (localVideoref.current && localVideoref.current.srcObject) {
            const tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            console.log('Stopped preview stream');
        }
        
        setAskForUsername(false);
        
        console.log('🔵 Starting media acquisition immediately');
        getMedia();
        
        // Debug after connection and clean up duplicates
        setTimeout(() => {
            checkStreamStatus();
            cleanupDuplicateVideos();
        }, 3000);
    }

    // Get preview when component mounts and user is in lobby
    useEffect(() => {
        if (askForUsername && videoAvailable) {
            setTimeout(() => {
                getPreviewStream();
            }, 1000);
        }
    }, [askForUsername, videoAvailable]);


    return (
        <div>

            {askForUsername === true ?

                <div style={{
                    height: '100vh',
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        padding: '40px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 16px 64px rgba(0, 0, 0, 0.3)',
                        minWidth: '400px'
                    }}>
                        <h2 style={{ marginBottom: '30px', fontSize: '2rem' }}>🎥 Join Meeting</h2>
                        <p style={{ marginBottom: '30px', opacity: 0.8 }}>Enter your name to join the video call</p>
                        
                        <TextField 
                            id="outlined-basic" 
                            label="Your Name" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            variant="outlined" 
                            fullWidth
                            style={{ 
                                marginBottom: '20px',
                                background: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px'
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && username.trim()) {
                                    connect();
                                }
                            }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={connect}
                            disabled={!username.trim()}
                            style={{
                                background: '#4CAF50',
                                padding: '12px 30px',
                                fontSize: '1.1rem',
                                borderRadius: '10px',
                                marginBottom: '20px'
                            }}
                            fullWidth
                        >
                            🚀 Join Meeting
                        </Button>

                        <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '10px',
                            padding: '15px',
                            marginTop: '20px'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                                📹 Camera and microphone preview
                            </p>
                            {videoAvailable ? (
                                <video 
                                    ref={localVideoref} 
                                    autoPlay 
                                    muted 
                                    style={{
                                        width: '100%',
                                        maxWidth: '200px',
                                        height: '120px',
                                        borderRadius: '8px',
                                        marginTop: '10px',
                                        objectFit: 'cover',
                                        background: '#000'
                                    }}
                                ></video>
                            ) : (
                                <div style={{
                                    width: '100%',
                                    maxWidth: '200px',
                                    height: '120px',
                                    borderRadius: '8px',
                                    marginTop: '10px',
                                    background: '#333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#999'
                                }}>
                                    📷 Camera not available
                                </div>
                            )}
                        </div>
                    </div>
                </div> :


                <div className={styles.meetVideoContainer}>
                    
                    {/* Participant Counter */}
                    <div className={styles.participantCounter}>
                        👥 {videos.length + 1} participant{videos.length === 0 ? '' : 's'}
                    </div>

                    {/* Control Buttons */}
                    <div className={styles.buttonContainers}>
                        <IconButton 
                            className={styles.IconButton}
                            onClick={handleVideo} 
                            style={{ color: video ? "#4CAF50" : "#f44336" }}
                            title={video ? "Turn off camera" : "Turn on camera"}
                        >
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton 
                            className={styles.IconButton}
                            onClick={handleEndCall} 
                            style={{ color: "#f44336", background: "rgba(244, 67, 54, 0.2)" }}
                            title="End call"
                        >
                            <CallEndIcon  />
                        </IconButton>
                        <IconButton 
                            className={styles.IconButton}
                            onClick={handleAudio} 
                            style={{ color: audio ? "#4CAF50" : "#f44336" }}
                            title={audio ? "Mute microphone" : "Unmute microphone"}
                        >
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton 
                                className={styles.IconButton}
                                onClick={handleScreen} 
                                style={{ color: screen ? "#2196F3" : "white" }}
                                title={screen ? "Stop screen share" : "Share screen"}
                            >
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={99} color='error'>
                            <IconButton 
                                className={styles.IconButton}
                                onClick={() => setModal(!showModal)} 
                                style={{ color: showModal ? "#2196F3" : "white" }}
                                title={showModal ? "Close chat" : "Open chat"}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    {/* Main Video Area */}
                    <div className={styles.conferenceView}>
                        {/* Local/First participant video - ALWAYS VISIBLE */}
                        <div className={styles.videoContainer} style={{ 
                            position: 'relative', 
                            background: '#333', 
                            borderRadius: '8px', 
                            overflow: 'hidden',
                            width: '350px',
                            height: '200px',
                            display: 'block',
                            border: '2px solid #555'
                        }}>
                            <video 
                                ref={localVideoref} 
                                autoPlay 
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1)', // Mirror effect
                                    background: '#000',
                                    display: 'block'
                                }}
                            >
                            </video>
                            
                            {/* Status indicator */}
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: window.localStream?.getVideoTracks()?.length > 0 ? 'rgba(0,255,0,0.8)' : 'rgba(255,0,0,0.8)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '11px',
                                zIndex: 10,
                                fontWeight: 'bold'
                            }}>
                                {window.localStream?.getVideoTracks()?.length > 0 ? '🟢 YOUR VIDEO' : '🔴 NO VIDEO'}
                            </div>
                            
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '8px', 
                                left: '8px', 
                                background: 'rgba(0,0,0,0.8)', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                color: 'white',
                                zIndex: 10,
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                You ({username})
                            </div>
                            
                            {/* Debug buttons */}
                            <button 
                                onClick={checkStreamStatus}
                                style={{
                                    position: 'absolute',
                                    top: '30px',
                                    right: '8px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: 'rgba(255,255,255,0.9)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                Debug
                            </button>
                            <button 
                                onClick={testGetVideo}
                                style={{
                                    position: 'absolute',
                                    top: '55px',
                                    right: '8px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: 'rgba(100,255,100,0.9)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                Test Video
                            </button>
                            <button 
                                onClick={forceRefreshRemoteVideos}
                                style={{
                                    position: 'absolute',
                                    top: '80px',
                                    right: '8px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: 'rgba(255,150,0,0.9)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                Refresh Remote
                            </button>
                            <button 
                                onClick={debugAllConnections}
                                style={{
                                    position: 'absolute',
                                    top: '105px',
                                    right: '8px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: 'rgba(255,255,100,0.9)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                All Debug
                            </button>
                            <button 
                                onClick={cleanupDuplicateVideos}
                                style={{
                                    position: 'absolute',
                                    top: '130px',
                                    right: '8px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: 'rgba(255,100,100,0.9)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                Clean Duplicates
                            </button>
                            <button 
                                onClick={debugUsernames}
                                style={{
                                    position: 'absolute',
                                    top: '155px',
                                    right: '8px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: 'rgba(200,100,255,0.9)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                Debug Names
                            </button>
                        </div>

                        {/* Other participants' videos */}
                        {videos.map((video, index) => {
                            console.log("🎬 RENDERING PARTICIPANT VIDEO:", index + 2);
                            console.log("- Socket ID:", video.socketId);
                            console.log("- Has Stream:", !!video.stream);
                            console.log("- Stream ID:", video.stream?.id);
                            console.log("- Video Tracks:", video.stream?.getVideoTracks()?.length || 0);
                            console.log("- Audio Tracks:", video.stream?.getAudioTracks()?.length || 0);
                            console.log("- Has Video:", video.hasVideo);
                            console.log("- Has Audio:", video.hasAudio);
                            
                            return (
                            <div key={video.socketId} style={{
                                position: 'relative',
                                background: '#333',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                width: '350px',
                                height: '200px',
                                display: 'block',
                                border: '2px solid #555'
                            }}>
                                <video
                                    key={`${video.socketId}-${video.stream?.id || 'no-stream'}`} // Force re-render when stream changes
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            console.log("🔄 SETTING STREAM FOR PARTICIPANT:", video.socketId);
                                            console.log("- Previous srcObject:", ref.srcObject?.id);
                                            console.log("- New srcObject:", video.stream.id);
                                            console.log("- Stream has video tracks:", video.stream.getVideoTracks().length);
                                            console.log("- Stream has audio tracks:", video.stream.getAudioTracks().length);
                                            
                                            // Always set the stream, even if it's the same
                                            ref.srcObject = video.stream;
                                            console.log("✅ Stream set for participant:", video.socketId);
                                            
                                            // Force play with error handling
                                            setTimeout(() => {
                                                if (ref && ref.srcObject) {
                                                    ref.play()
                                                        .then(() => {
                                                            console.log("▶️ Video playing for:", video.socketId);
                                                            console.log("- Video dimensions:", ref.videoWidth, "x", ref.videoHeight);
                                                        })
                                                        .catch(e => {
                                                            console.log("❌ Auto-play blocked for participant:", video.socketId, e);
                                                            // Try to enable with user interaction
                                                            ref.muted = true;
                                                            ref.play().catch(e2 => console.log("Still blocked:", e2));
                                                        });
                                                }
                                            }, 100);
                                            
                                            // Monitor video load events
                                            ref.onloadedmetadata = () => {
                                                console.log("📺 Video metadata loaded for:", video.socketId);
                                                console.log("- Dimensions:", ref.videoWidth, "x", ref.videoHeight);
                                                console.log("- Duration:", ref.duration);
                                            };
                                            
                                            ref.oncanplay = () => {
                                                console.log("🎯 Video can play for:", video.socketId);
                                            };
                                            
                                            ref.onerror = (e) => {
                                                console.error("❌ Video error for:", video.socketId, e);
                                            };
                                            
                                        } else {
                                            console.log("❌ NO STREAM FOR PARTICIPANT:", video.socketId, "REF:", !!ref, "STREAM:", !!video.stream);
                                            if (ref) {
                                                ref.srcObject = null;
                                            }
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    muted={false}
                                    controls={false}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        background: video.stream?.getVideoTracks()?.length > 0 ? '#000' : '#444',
                                        display: 'block'
                                    }}
                                >
                                </video>
                                
                                {/* Stream Status Indicator */}
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    background: video.stream?.getVideoTracks()?.length > 0 ? 'rgba(0,255,0,0.8)' : 'rgba(255,0,0,0.8)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '11px',
                                    zIndex: 10,
                                    fontWeight: 'bold'
                                }}>
                                    {video.stream?.getVideoTracks()?.length > 0 ? '🟢 REMOTE VIDEO' : '🔴 NO REMOTE VIDEO'}
                                </div>
                                
                                <div style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    left: '8px',
                                    background: 'rgba(0,0,0,0.8)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    color: 'white',
                                    zIndex: 10,
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                                data-username-for={video.socketId}
                            >
                                    {video.username || `User ${video.socketId.slice(-4)}`}
                                </div>
                                
                                {/* Debug info */}
                                <div style={{
                                    position: 'absolute',
                                    top: '30px',
                                    right: '8px',
                                    background: 'rgba(0,0,0,0.7)',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '9px',
                                    zIndex: 10
                                }}>
                                    ID: {video.socketId.slice(-4)}
                                </div>
                            </div>
                        )})}
                    </div>

                    {/* Chat Modal */}
                    {showModal && <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <h1>💬 Chat</h1>

                            <div className={styles.chattingDisplay}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div className={styles.messageItem} key={index}>
                                            <div className={styles.sender}>{item.sender}</div>
                                            <p className={styles.messageText}>{item.data}</p>
                                        </div>
                                    )
                                }) : <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No messages yet. Start the conversation! 👋</p>}


                            </div>

                            <div className={styles.chattingArea}>
                                <TextField 
                                    className={styles.TextField}
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)} 
                                    id="outlined-basic" 
                                    label="Type your message..." 
                                    variant="outlined" 
                                    size="small"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <Button 
                                    className={styles.Button}
                                    variant='contained' 
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>}
                </div>
            }
        </div>
    )
}