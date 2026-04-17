# v0 Pro - AI Interface Builder

A high-fidelity, production-ready clone of the **v0.dev** platform. This project enables developers to generate, preview, and deploy React components using a conversational AI interface powered by **OpenRouter** and **Vercel Sandbox**.

## 🚀 Live Features

- **Generative UI:** Describe any component and watch it come to life with Next.js and Tailwind CSS.
- **Compute-Native Previews:** Unlike static mocks, this app uses the **Vercel Sandbox SDK** to run your code in real-time on isolated Firecracker microVMs.
- **Model Intelligence:** Select from a curated list of OpenRouter free models. The interface scales model icons based on their "power" (Gemini Flash → Llama 70B).
- **Self-Healing Loop:** Automatically captures build/runtime errors from the sandbox and feeds them back to the AI for an instantaneous "Auto-fix".
- **Dual-AI Architecture:** Every generation is critiqued by a "Reviewer AI" to ensure it matches your prompt and follows UX best practices.
- **Persistent Workspace:** Your code and conversation history are saved locally, ensuring a seamless workflow.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Compute:** Vercel Sandbox
- **LLM API:** OpenRouter

## 📋 Prerequisites

To run this project locally, you will need:
1. An **OpenRouter API Key** (Get it at [openrouter.ai](https://openrouter.ai/keys))
2. A **Vercel OIDC Token** (Follow the [Vercel Sandbox Auth Guide](https://vercel.com/docs/vercel-sandbox/authentication))

## ⚙️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd v0-pro-clone
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_key
   VERCEL_OIDC_TOKEN=your_vercel_oidc_token
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🧠 System Architecture

- **`api/chat`**: Handles streaming AI generations.
- **`api/sandbox`**: Manages the lifecycle of Vercel microVMs, file synchronization, and command execution.
- **`api/review`**: Triggers the secondary AI critique layer.
- **`lib/prompts`**: Contains the professional-grade system prompts that guide the AI's behavior.

## 🛡️ Authentication

For this demo, a simple email-based authentication barrier is implemented to protect compute resources. Data is persisted to the browser's Local Storage.

---
*Built with precision to emulate the v0.dev professional experience.*
