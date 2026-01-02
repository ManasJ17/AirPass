# AirPass — Secure File Sharing 🚀🔒

AirPass is a minimal, privacy-first web app for secure temporary file transfers. Upload files, get short-lived keys or QR codes, and let recipients download without accounts or persistent storage — fast, private, and straightforward.

---

## 📋 Project Overview & Concept

AirPass solves cross-device file transfer friction by providing ephemeral, server-mediated downloads protected by short-lived keys and optional QR codes. The UI is intentionally minimal and dark-themed to focus on the task: send, receive, and verify files quickly and privately.

---

## ✨ Core Features

- 🔼 **Send File** — Upload a single file and receive a short-lived key + QR.  
- 📦 **MultiSend** — Upload multiple files and stream a ZIP archive for single-key access.  
- 🔽 **Receive File** — Enter a key (or use QR upload) to download a file; server validates expiry and serves the file.  
- 📱 **QR Share** — Generate QR codes for keys; upload static QR images to auto-fill and redirect.  
- ⏰ **Auto-Expiry** — Default expiry (12 hours) with server-side enforcement and periodic cleanup.  
- 🛡️ **Privacy-first design** — No accounts, no long-term storage; small in-memory metadata store.

---

## 📋 Prerequisites

- Node.js (v14+ recommended)  
- npm (or yarn)  
- Modern browser (Chrome / Firefox / Safari / Edge)

---

## 🔒 Security & Safety

- ✅ HTTPS recommended for production (deploy behind TLS)  
- ✅ One-time / short-lived keys; server enforces expiry before downloads  
- ✅ Temporary file storage with automatic cleanup after expiry  
- ✅ No user accounts or analytics; minimal in-memory metadata  
- ✅ Streamed ZIP creation to minimize disk usage

---

## 🗂️ Project Structure

```
secure-file-share/
├── server.js                # Express server, upload & download routes
├── start.js                 # (optional) start script
├── package.json
├── public/                  # Frontend assets
│   ├── index.html
│   ├── send.html
│   ├── receive.html
│   ├── multisend.html
│   ├── qr.html
│   ├── style.css
│   ├── send.js
│   ├── receive.js
│   ├── multisend.js
│   ├── navbar.js
│   └── assets/
└── uploads/                 # Temporary upload area (cleared by server)
```

---
🖼️ Visuals (Screenshots)
Hero · Send / Receive
<p align="center"> <img width="100%" alt="Hero / CTA" src="https://github.com/user-attachments/assets/38703bb8-3fd7-42d7-aa11-6de18f857b05" /> </p>
MultiSend
<p align="center"> <img width="420" alt="MultiSend Upload" src="https://github.com/user-attachments/assets/75782645-f70a-488f-ba0a-7fc09100011e" /> </p>
Receive · QR Upload
<p align="center"> <img width="420" alt="Receive QR Upload" src="https://github.com/user-attachments/assets/95d32fc4-2c90-492e-8434-c5a49d87bf0b" /> </p>
Mobile Navigation
<p align="center"> <img width="380" alt="Mobile Navbar" src="https://github.com/user-attachments/assets/b65c16bb-5e8d-446f-b8b2-060ce295b213" /> </p> <p align="center">
