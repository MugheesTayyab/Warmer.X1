<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Warmer AI Computer Vision Engine

An intelligent, real-time computer vision dashboard powered by Google Gemini 2.0 Flash multimodal models, Web Audio feedback, Web Speech recognition, and interactive spatial reasoning.

## Key Features

- 📹 **Real-time Video Feed & Bounding Box Overlays**: Live webcam canvas rendering with normalized spatial coordinates.
- 🤖 **Gemini 2.0 Vision Integration**: Multimodal object detection, clutter analysis, and prompt grounding.
- 🎙️ **Voice Query Input**: Hands-free natural language queries using Web Speech API synthesis.
- 🔍 **Disambiguation Panel**: Interactive resolution for overlapping or low-confidence detection targets.
- 💡 **Explainability Breakdown**: Deep insight into confidence scoring and visual spatial reasoning.
- 📁 **Project Export & Offline Testing**: Zip archive generation and pre-packaged sample scenes.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion
- **Backend**: Express.js, TypeScript (tsx runtime), JSZip
- **AI Services**: OpenRouter Multimodal API (`openrouter/free`), Google Gen AI SDK (`@google/genai`), Gemini 2.0 Flash

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` with your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key-here"
   OPENROUTER_MODEL="openrouter/free"
   ```
3. Run the application:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:3000`.

