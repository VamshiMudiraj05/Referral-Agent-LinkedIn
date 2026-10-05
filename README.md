<div align="center">

# 🧭 ReferPilot
### AI-Powered Referral Outreach & Professional Networking Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-v1.63-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-0A66C2.svg)](LICENSE)

*An autonomous, safety-first AI agent designed for high-conversion referral outreach. Discovers verified official company pages, identifies high-affinity employees through the People tab, ranks candidates with deterministic heuristics, and coordinates personalized connection notes with human-in-the-loop review.*

[Features](#-key-features) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Safety First](#-safety--account-protection) • [Project Structure](#-project-structure)

</div>

---

## 🌟 Key Features

### 1. 🎯 High-Conversion Affinity Targeting
- **Priority 1 — Mutual Connections & Alumni**: Highest referral success rate. Prioritizes shared professional connections and college alumni who have built-in trust and rapport.
- **Priority 2 — HR & Technical Recruiters**: Connects with active Talent Acquisition Partners, Technical Recruiters, and Sourcers.
- **Priority 3 — IT & Software Engineering**: Software Engineers, Tech Leads, Engineering Managers, DevOps, Cloud Architects, and Data Scientists.
- **Strict Role Exclusion**: Automatically discards unrelated roles (Sales, Marketing, Legal, Finance, Trainees, Admin) to preserve your connection quota for high-yield prospects.

### 2. 🛡️ Safety-First & Zero-Bypass Policy
- **Zero Bot Checkpoint Bypasses**: Never attempts to bypass CAPTCHAs, 2FA, or security challenges. If LinkedIn triggers a verification checkpoint, the agent pauses immediately, alerts the dashboard, and allows you to complete verification in the browser before resuming.
- **Persistent Native Chrome Session**: Runs via your authentic Google Chrome browser using a persistent profile directory (`data/chrome_profile`). Once logged in, your session remains active across restarts without repetitive re-logins.
- **Humanized Interaction Jitter**: Randomized delays (3–8s) between clicks and typing to simulate natural user behavior.
- **Conservative Session Caps**: Strictly limits requests per session (max: 25) to adhere to LinkedIn's weekly invitation limits.

### 3. 👥 Human-in-the-Loop (HITL) Review Mode
- Review candidate cards before sending: preview profile photo, verified current title, relevance breakdown, and personalized connection note.
- **Inline Note Editing**: Tweak or rewrite notes in real-time before approving.
- **Granular Actions**: Approve & Send, Skip Candidate, or Stop Campaign at any point.

### 4. 🏢 Company Verification & Disambiguation
- Discovers and validates official company pages against unofficial agencies, fan groups, and subsidiaries.
- Displays follower counts, official website, industry, and employee breakdown (HR count, IT count, Mutuals count) before outreach begins.

### 5. ⚡ Real-Time Activity Feed Timeline
- Replaces raw console logging with a clean, professional activity feed.
- Live updates streamed over WebSockets (`ws`) displaying automated milestones, profile visits, and candidate assessments.

### 6. 💾 Cross-Session Deduplication & Export
- Persistent memory in `data/history.json` ensures you **never** contact the same person twice, even months later or across different campaigns.
- One-click CSV export for integration into spreadsheets or CRM pipelines.

---

## 🏗 System Architecture

ReferPilot uses a modular **Multi-Agent Architecture** coordinated by a central orchestrator:

```mermaid
flowchart TD
    User([User Dashboard]) <-->|WebSocket & REST API| Server([server.js Express + WS])
    Server <--> Coordinator([WorkflowCoordinator.js])

    subgraph Pipeline [Multi-Agent Execution Pipeline]
        Coordinator --> CompanyAgent([CompanyDiscoveryAgent.js])
        CompanyAgent --> PeopleAgent([PeopleDiscoveryAgent.js])
        PeopleAgent --> RankingAgent([CandidateRankingAgent.js])
        RankingAgent --> VerifyAgent([ProfileVerificationAgent.js])
        VerifyAgent --> OutreachAgent([OutreachAgent.js])
        OutreachAgent --> MessageAgent([MessageAgent.js])
    end

    subgraph Infrastructure [Core Infrastructure & Guardrails]
        Browser([BrowserController.js - Playwright Chrome])
        Safety([SafetyController.js - Rate Limiting & Checkpoints])
        History([HistoryManager.js - Persistent JSON Registry])
    end

    OutreachAgent -.-> Browser
    CompanyAgent -.-> Browser
    PeopleAgent -.-> Browser
    VerifyAgent -.-> Browser
    Coordinator -.-> Safety
    Coordinator -.-> History
```

### Module Responsibilities:
- **`WorkflowCoordinator`**: Central orchestrator managing the multi-stage lifecycle, WebSocket broadcasting, and campaign queues.
- **`CompanyDiscoveryAgent`**: Discovers and validates official LinkedIn company pages.
- **`PeopleDiscoveryAgent`**: Navigates `/people/`, scrolls dynamically, and harvests candidate profiles.
- **`CandidateRankingAgent`**: Deterministic scoring heuristic prioritizing Mutuals, Alumni, HR, and Engineering.
- **`ProfileVerificationAgent`**: Validates current employment and active job titles on candidates' profiles.
- **`MessageAgent`**: Token substitution (`[Company]`, `[First Name]`), enforces strict LinkedIn note limits (<300 chars).
- **`OutreachAgent`**: Interacts with the LinkedIn connection modal, dropdown actions, and note insertion.
- **`BrowserController`**: Manages Playwright persistent contexts, native Chrome binaries, and anti-detection flags.
- **`SafetyController`**: Enforces session rate caps and listens for security checkpoints.
- **`HistoryManager`**: Local JSON storage preventing duplicate outreach across campaigns.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher (tested on Node v20 & v24)
- **Google Chrome** installed (standard path `/Applications/Google Chrome.app` on macOS)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VamshiMudiraj05/LinkedIn-Referral-AI-Agent.git
   cd LinkedIn-Referral-AI-Agent
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies & build bundle**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

### Running the Application

1. **Start the application**:
   ```bash
   npm start
   # or
   npm run dev
   ```

2. **Open the Dashboard**:
   Open **[http://localhost:3001](http://localhost:3001)** in your browser.

3. **Initial Login Setup**:
   - On the first campaign launch, Google Chrome will open.
   - If prompted by LinkedIn to log in, simply log in manually in the visible Chrome window.
   - ReferPilot saves your authentication session in `data/chrome_profile/` so you won't need to log in again on future runs.

---

## 🧪 Running Unit Tests

The automated test suite verifies candidate ranking heuristics, token substitutions, safety rate limiters, and history deduplication:

```bash
npm test
```

---

## 📁 Project Structure

```text
LinkedIn-Referral-AI-Agent/
├── agents/
│   ├── BrowserController.js         # Playwright persistent Chrome context & stealth options
│   ├── SafetyController.js          # Rate limiter, delays (3-8s), security challenge detection
│   ├── CompanyDiscoveryAgent.js     # Disambiguates official company page vs fan groups
│   ├── PeopleDiscoveryAgent.js      # /people/ tab navigator & employee card harvester
│   ├── CandidateRankingAgent.js     # Department scoring, seniority evaluation, and exclusions
│   ├── ProfileVerificationAgent.js  # Validates current active employment on candidate profiles
│   ├── MessageAgent.js              # Token substitution ([Company]), character limit guards
│   ├── OutreachAgent.js             # Connect workflow, note insertion, approval hooks
│   ├── HistoryManager.js            # Persistent history & duplicate contact detection
│   └── WorkflowCoordinator.js       # Master orchestrator for campaigns
├── data/
│   ├── .gitkeep                     # Keeps data directory structure tracked
│   ├── chrome_profile/              # (Ignored) Persistent Chrome session cookies & state
│   └── history.json                 # (Ignored) Cross-session contact registry
├── frontend/                        # React 19 + Vite dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── CampaignSetup.jsx    # Target inputs, template editor, strategy & mode controls
│   │   │   ├── CompanyVerification.jsx # Verified company breakdown card
│   │   │   ├── ApprovalModal.jsx    # Candidate approval dialog with live note editing
│   │   │   ├── LiveActivityLog.jsx  # Activity feed timeline
│   │   │   ├── CandidateTable.jsx   # Candidate profile cards & table with score bars
│   │   │   ├── FinalReport.jsx      # Campaign summary & CSV export
│   │   │   ├── HistoryView.jsx      # Persistent contact database
│   │   │   └── SafetyBanner.jsx     # Manual intervention notification banner
│   │   ├── App.jsx                  # Main application shell & top navigation
│   │   └── index.css                # Professional enterprise light design system
│   ├── index.html                   # HTML entry point with Inter font
│   └── vite.config.js
├── server.js                        # Express REST API & WebSocket event server
├── test_agent.js                    # Automated unit test suite
├── .gitignore                       # Protects credentials, sessions, and build artifacts
├── package.json                     # Root npm scripts & backend dependencies
└── README.md                        # Documentation
```

---

## 🛡️ Safety & Account Protection Best Practices

ReferPilot is built strictly for **ethical, high-relevance referral networking**. To keep your LinkedIn account safe:

1. **Keep Limits Conservative**: Set people limits between 5–15 per session. Never attempt to send hundreds of invitations in a single day.
2. **Use Human Approval Mode**: Review candidates and notes before sending to maintain genuine, personalized communication.
3. **Never Automate Verification Checkpoints**: Always resolve PINs, SMS codes, or security prompts manually in the open Chrome browser.
4. **Use Your Residential IP**: Run ReferPilot on your personal computer connected to your home Wi-Fi. Avoid cloud datacenter IPs (e.g. AWS, GCP) which are frequently flagged by anti-bot systems.

---

## ⚖️ Legal Disclaimer

This software is an autonomous workflow assistant intended for personal career networking and referral discovery. It is an independent open-source project and is **not affiliated, associated, authorized, endorsed by, or in any way officially connected with LinkedIn Corporation** or any of its subsidiaries. Please use responsibly and adhere to LinkedIn's User Agreement and Community Guidelines.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
