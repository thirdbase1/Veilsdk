# Open Brainy - Industrial Full-Stack AI Engineer

Open Brainy is a high-fidelity, industrial-grade AI platform for architecting and executing full-stack web applications. Built for the Vercel ecosystem, it maintains persistent codebase awareness and executes code in high-performance, isolated microVMs via the **Vercel Sandbox Beta SDK**.

## 🚀 Key Features

- **Full-Stack Orchestration:** Generates multi-file projects (Next.js 15, SvelteKit, etc.) including API routes, server actions, and deep logic.
- **Persistent Workspace:** Uses the new Vercel Sandbox Beta protocol to save filesystem state automatically between runs.
- **Compute-Native Previews:** Renders live-running applications on isolated Firecracker microVMs with sub-second response times.
- **Self-Healing Infrastructure:** Automatically analyzes Sandbox build failures and performs architectural fixes.
- **Dual-Agent Governance:** Employs a Lead AI Engineer (OpenRouter) and a Senior Architectural Reviewer (Llama 3.3 70B) for maximum code integrity.
- **Universal Responsibility:** Fully responsive "Industrial Pro" UI that adapts to any screen, with dedicated mobile navigation.

## 📋 Prerequisites

1. **OpenRouter API Key:** [openrouter.ai](https://openrouter.ai/keys)
2. **Vercel Authentication:**
   - `VERCEL_TEAM_ID`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_TOKEN` (Access Token)

## ⚙️ Setup

1. **Install:**
   ```bash
   npm install
   ```

2. **Environment:**
   Create `.env.local`:
   ```env
   OPENROUTER_API_KEY=...
   VERCEL_TEAM_ID=...
   VERCEL_PROJECT_ID=...
   VERCEL_TOKEN=...
   ```

3. **Develop:**
   ```bash
   npm run dev
   ```

## 🧠 System Protocol

Open Brainy uses a specialized multi-file transmission protocol to manage the codebase:
\`--- FILE: path/to/file --- [CONTENT] --- END ---\`

## 🛡️ Industrial Security

Execution happens in strictly isolated Linux environments. Auth and Workspace state are persisted securely via OIDC tokens and browser-level encryption placeholders.

---
*Open Brainy: Building the Future, Pixel by Pixel, Component by Component.*
