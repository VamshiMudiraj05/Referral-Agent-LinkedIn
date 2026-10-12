# 🪟 Windows Setup & Execution Guide

This guide details how to install, configure, test, and run the **LinkedIn Referral Outreach AI Agent** on Windows 10 and Windows 11.

---

## 1. System Requirements & Prerequisites

Ensure the following tools are installed on your Windows machine:

1. **Node.js**: Version 18.x, 20.x, or 22.x+ (Recommended: LTS)
   - Download from: [https://nodejs.org](https://nodejs.org)
   - Verify in Windows PowerShell:
     ```powershell
     node -v
     npm -v
     ```

2. **Google Chrome**:
   - The agent operates using persistent Chrome browser sessions.
   - Standard Windows 64-bit installation path: `C:\Program Files\Google\Chrome\Application\chrome.exe` (or `C:\Program Files (x86)\...` / `%LOCALAPPDATA%\Google\Chrome\...`).
   - If installed in a custom directory, you can set the `CHROME_PATH` environment variable (see section 4).

3. **PowerShell / Command Prompt**:
   - Windows PowerShell 5.1+ or PowerShell 7+ (Default on Windows 10/11).

---

## 2. Installation & Dependency Setup

Run these commands from the project root folder (`LinkedIn-Referral-AI-Agent`):

### Step 1: Install Root Backend Dependencies
In Windows PowerShell or Command Prompt:
```powershell
npm install
```

### Step 2: Install Frontend Dependencies & Build Bundle
```powershell
npm --prefix frontend install
npm run build:frontend
```
> **Note**: Building the frontend generates production static assets in `frontend/dist/`, which are automatically served by the Express backend.

---

## 3. Running Verification Tests

To verify that your environment, path resolution, ranking algorithms, and browser automation drivers are functioning correctly on Windows:

### A. Run Core Agent Unit Tests
```powershell
npm test
```
*Validates MessageAgent token replacement, CandidateRankingAgent scoring & exclusions, SafetyController limits, HistoryManager deduplication, and BrowserController Chrome path resolution.*

### B. Run Windows Browser Automation Compatibility Test
```powershell
npm run test:windows
```
*Validates that Playwright locates `chrome.exe` on Windows, launches a persistent context, verifies the Windows user-agent, executes clean lock releases, and cleanly shuts down.*

---

## 4. Starting the Application

Start the unified server (API, WebSocket, and Web Dashboard):

```powershell
npm start
```
*(Alternatively, `npm run dev`)*

Once started, open your web browser and navigate to:
```
http://localhost:3001
```

---

## 5. First-Time LinkedIn Authentication Workflow

1. Click **Start Campaign** on the dashboard.
2. A visible Google Chrome window will launch automatically.
3. If you are not already logged into LinkedIn:
   - The agent detects this and pauses with a safety prompt: `"LinkedIn login required"`.
   - Log into your LinkedIn account manually in the visible browser window (including 2FA/SMS confirmation if enabled).
   - Once logged in, the agent automatically detects authentication and proceeds with your campaign.
4. **Session Persistence**: Authentication cookies and browser tokens are safely persisted in `data/chrome_profile/`. You will not need to log in again on subsequent runs.

---

## 6. Environment Variables (Optional)

If you use custom paths or ports, you can define them in a `.env` file in the project root:

```env
# Custom port (Default is 3001)
PORT=3001

# Custom Google Chrome executable path (optional - auto-detected by default)
# CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

In PowerShell, you can also set environment variables temporarily:
```powershell
$env:PORT="3001"
npm start
```

---

## 7. Troubleshooting Common Windows Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`'vite' is not recognized`** | Frontend dependencies were copied from macOS without installing Windows binaries. | Run `npm --prefix frontend install` followed by `npm run build:frontend`. |
| **Chrome not found / launch error** | Google Chrome is installed in an unconventional path. | Set `$env:CHROME_PATH="C:\Path\To\chrome.exe"` or install Google Chrome standard 64-bit. |
| **`Opening in existing browser session` / Singleton Lock** | An existing Chrome instance or crash left profile lock files behind. | The agent auto-cleans stale locks. Alternatively, close any lingering Chrome processes with: `Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue`. |
| **PowerShell script execution policy error** | Execution policy restricts running local `.ps1` scripts. | Run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |
| **Port 3001 already in use** | A previous instance of the server is still running. | Run in PowerShell: `Get-Process node \| Stop-Process -Force` or set a different `PORT` in `.env`. |
