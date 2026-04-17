# Open Brainy - Full-Stack AI Engineer

Open Brainy is a high-fidelity, industrial-grade AI platform for generating, executing, and reviewing full-stack web applications. Unlike traditional UI builders, Open Brainy maintains full codebase awareness and executes code in isolated, high-performance Vercel Sandbox environments.

## 🚀 Key Capabilities

- **Full-Stack Awareness:** Generates multi-file projects including API routes, server actions, and shared components.
- **Compute-Native Execution:** Leverages the **Vercel Sandbox SDK** to boot real-time Firecracker microVMs for every project.
- **Self-Healing Loop:** Automatically detects sandbox build/runtime errors and re-prompts the AI for immediate architectural correction.
- **Dual-Agent Architecture:** Features a Lead AI Engineer (OpenRouter models) and a Senior Architectural Reviewer (Llama 3.3 70B) for rigorous quality control.
- **Multi-Framework Ready:** Defaults to Next.js 15, but capable of handling any framework deployable to Vercel (SvelteKit, Astro, etc.).
- **Premium Industrial UI:** Built with Tailwind CSS v4, Framer Motion, and a strict "Pro Dark" aesthetic.

## 📋 Prerequisites

1. **OpenRouter API Key:** Required for LLM streaming ([openrouter.ai](https://openrouter.ai/keys)).
2. **Vercel OIDC Token:** Required for authenticated sandbox compute ([Vercel Sandbox Docs](https://vercel.com/docs/vercel-sandbox)).

## ⚙️ Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env.local` file:
   ```env
   OPENROUTER_API_KEY=your_key_here
   VERCEL_OIDC_TOKEN=your_token_here
   ```

3. **Run Platform:**
   ```bash
   npm run dev
   ```

## 🧠 System Protocol

- **`/api/chat`**: Streams generation with full-codebase context.
- **`/api/sandbox`**: Orchestrates microVM lifecycle and file synchronization.
- **`/api/review`**: Conducts post-generation architectural audits.

## 🛡️ Workspace Security

All code execution happens in isolated Linux environments. Workspace state is persisted to the browser's Local Storage for a persistent, offline-first experience.

---
*Open Brainy: Architecture. Execution. Excellence.*
