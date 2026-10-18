# System Architecture — CollabNClass

This document details the real-time collaborative classroom architecture powering video streams, synchronization, and virtual whiteboard canvases.

## Architecture Overview

```text
[ Browser Client ]  <--- WebRTC Mesh (Video/Audio) --->  [ Peer Clients ]
        |
        +--- WebSocket (Socket.io) ---> [ Signalling Node.js Server ]
                                                   |
                                        [ Room Session Manager ]
```

### Components
1. **WebRTC Peer Engine:** Manages RTCPeerConnection instances, STUN/TURN ICE candidate gathering, and dynamic track negotiation.
2. **Synchronized Canvas Engine:** Serializes 2D vector coordinate arrays over WebSockets with client-side interpolation.
3. **Execution Sandbox:** Processes live student code snippets safely in isolated web execution environments.
