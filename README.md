# 🏛️ LegalAI — AI-Powered Legal Assistant for Indian Law

<div align="center">

<img src="public/logo.jpg" width="120" alt="LegalAI Logo" />

**Access 20+ AI-powered legal tools for Indian law, optimized for BNS 2023 & BNSS 2023.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Groq](https://img.shields.io/badge/AI-Groq%20SDK-orange?logo=fastapi)](https://groq.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase)](https://firebase.google.com/)

[View Demo](https://legal-ai-orpin-seven.vercel.app) · [Documentation](#-core-features) · [Report Bug](https://github.com/stewin16/LegalAI/issues)

</div>

---

## ✨ Overview

**LegalAI** is a comprehensive, state-of-the-art legal companion designed to empower Indian citizens, law students, and professionals with instant, AI-driven legal insights. Built with a focus on accuracy and premium aesthetics, it bridges the gap between complex legal jargon and actionable information.

---

## 🚀 Core Features

### ⚖️ AI-Powered Assistant & Tools
- **Legal Chat Assistant** — Ask legal questions in natural language and get instant answers with Llama-3.3 intelligence.
- **IPC vs BNS Comparison** — Side-by-side analysis of the Indian Penal Code and the new Bharatiya Nyaya Sanhita (2023).
- **Automated Document Drafter** — Generate rental agreements, legal notices, NDAs, affidavits, and formal court memorials instantly.
- **Bail Eligibility Checker** — Quick analysis of bail eligibility under the new BNSS 2023 procedures.
- **Consumer Complaint Generator** — Draft grievances under the Consumer Protection Act 2019.

### 🛡️ Analysis & Protection
- **Legal Risk Analyzer** — Scan contracts for hidden liabilities and legal pitfalls.
- **Property Document Verifier** — Guidance on verifying property layout plans and building approvals.
- **RTIGenerator** — Draft professional Right to Information applications for various public authorities.
- **Cyber Crime Reporter** — Guidance and drafting for reporting digital fraud and cyber offenses.

### 🌐 Live Intelligence
- **Real-Time Legal Updates** — Live RSS integration with Google News providing the latest Supreme Court and statutory updates.
- **Lawyer Finder** — Integrated map search for legal professionals near your current location.
- **Premium UI/UX** — Modern, responsive design with dynamic tricolor backgrounds and persistent scroll progress indicators.

---

## 🛠️ Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Blazing fast SPA architecture |
| **Language** | TypeScript 5.8 | Type-safe development |
| **Styling** | TailwindCSS + Framer Motion | Premium aesthetics and animations |
| **AI Backend** | Groq SDK (Llama-3.3 70B) | High-speed, high-accuracy LLM |
| **Authentication** | Firebase Auth | Secure user sessions and profiles |
| **Icons** | Lucide React | Clean, consistent iconography |

---

## 📦 Installation & Setup

### 1. Prerequisites
- **Node.js 18+**
- **npm 9+**
- A **Groq API Key** (Free at [console.groq.com](https://console.groq.com))
- A **Firebase Project** for Authentication

### 2. Quick Start
```bash
# Clone the repository
git clone https://github.com/stewin16/LegalAI.git
cd LegalAI/IndianLawApp

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Environment Configuration
Create a `.env` file in the `IndianLawApp` directory:

```env
# AI Configuration
VITE_GROQ_API_KEY="your_groq_key_here"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your_key"
VITE_FIREBASE_AUTH_DOMAIN="your_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id"
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Set the **Root Directory** to `IndianLawApp`.
2. Add your environment variables from `.env` to the Vercel dashboard.
3. Click **Deploy**.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer
**LegalAI is an AI-powered informational tool and does not constitute legal advice.** For complex legal matters, always consult a qualified legal professional. For free legal aid in India, visit [NALSA](https://nalsa.gov.in).

---

<div align="center">

**Made with ❤️ in India**

🇮🇳 Empowering Citizens through Legal Technology 🇮🇳

</div>
