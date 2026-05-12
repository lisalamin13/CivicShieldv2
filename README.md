# 🛡️ CivicShield: Private Enterprise Security Framework
### Proprietary AI-Powered Infrastructure for Secure Anonymous Reporting & Compliance

> **PROPRIETARY AND CONFIDENTIAL**  
> This software and its documentation are the exclusive property of the CivicShield development team. Unauthorized copying, distribution, or use of this system is strictly prohibited.

---

## 🔒 Executive Overview

CivicShield is a high-security, multi-tenant infrastructure designed for organizations to manage internal grievances and whistleblower reports with **absolute anonymity**. Unlike public reporting tools, CivicShield utilizes a decentralized, local-only architecture to ensure that no data ever leaves the organizational perimeter.

### Core Security Guardrails:
- **Air-Gapped AI Intelligence**: Utilizing local NLP engines (SmolLM2) to provide guidance without sending data to third-party APIs (No Google/OpenAI leaks).
- **Universal Media Sanitization**: Automated server-side scrubbing of GPS, EXIF, and ID3 metadata from all evidence (Images, Video, Audio).
- **Cryptographic Isolation**: AES-256-CBC encryption for all report content and secure 2-way communication channels.
- **Zero-Trace Architecture**: No IP logging, no device fingerprinting, and randomized tracking identifiers.

---

## 🏗️ Technical Architecture

The platform operates as a unified private network of three core clusters:
1. **Security Gateway (Frontend)**: React-based interface with encrypted state management.
2. **Logic Core (Backend)**: Node.js/Express environment managing the cryptographic layer.
3. **Intelligence Hub (AI Engine)**: Python-based FastAPI service running local transformer models for real-time analysis.

---

## 🛠️ Internal Deployment Protocol

This section is intended for **Authorized System Administrators** only.

### System Prerequisites:
- **Compute**: Node.js (v18+) & Python (3.10+)
- **Security Tools**: FFmpeg (Verified for Universal Sanitization)
- **Database**: MongoDB (Isolated Instance or Private Cloud)
- **Authentication**: Twilio Verify API (For secure multi-factor staff login)

### 1. Backend Initialization:
```bash
cd backend && npm install
```
Configure the `.env` file using the `ENCRYPTION_KEY` generation protocol to ensure unique organizational encryption.

### 2. Intelligence Hub Setup:
```bash
cd ai_engine && pip install -r requirements.txt
```
Ensure the **SmolLM2-135M** model is correctly initialized within the local environment.

### 3. Frontend Deployment:
```bash
cd frontend && npm install
```

---

## 📊 Administrative Dashboards

The system provides three strictly partitioned access tiers:
1. **Super Administrator**: Platform-wide monitoring, organization onboarding, and global audit logs.
2. **Organizational Admin/Investigator**: Case management, AI-powered triage, and secure reporter communication.
3. **Authorized Reporter**: Encrypted dashboard for report tracking and anonymous dialogue.

---

## 🛡️ Security Compliance Notes

- **Metadata Policy**: All evidence files undergo mandatory sanitization before being persisted to storage.
- **Encryption Standards**: All "at-rest" data is secured via AES-256. All "in-transit" data must be served over HTTPS/TLS.
- **AI Ethics**: The AI engine is strictly confined to the local server; no external "Learning" or "Data Harvesting" occurs.

---

## 📞 Administrative Support

For internal technical support or deployment assistance:
- **Lead Developer**: Lisawanny Lamin
- **Institution**: Assam Don Bosco University

---
*© 2026 CivicShield Security. All Rights Reserved. Private & Confidential.*
