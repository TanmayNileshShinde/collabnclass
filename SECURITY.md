# Security Policy

**CollabNClass** is a real-time collaborative virtual classroom featuring WebRTC video calling, synchronized canvas, and live code execution.

---

## 🔒 Security Practices

1. **Sandboxed Code Execution:** Code execution runtimes must execute within isolated sandboxes or container environments (Docker) with restricted resource quotas and network limits.
2. **Encrypted Media Streams:** Real-time WebRTC audio and video streams are encrypted end-to-end via SRTP/DTLS.
3. **Room Access Control:** Classroom sessions require valid room tokens to join.

---

## 🚨 Vulnerability Reporting

Please report any security findings directly to:
- **Email:** `tanmaynileshshinde@gmail.com`
- **Subject:** `[SECURITY] CollabNClass Vulnerability Report`
