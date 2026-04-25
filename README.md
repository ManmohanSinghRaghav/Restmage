# 🏗️ Restmage: Real Estate AI Workspace

**Restmage** is a comprehensive, state-of-the-art AI-powered platform designed for real estate developers, architects, and property managers. It seamlessly integrates interactive GIS mapping, AI-driven architectural layout generation, and advanced construction cost prediction into a unified, high-performance workspace.

![Restmage Dashboard](https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

---

## 🚀 Key Feature Deep Dive

### 🤖 Gemini AI Floorplan Engine
The heart of Restmage is its **LLM-driven architectural engine**. Unlike traditional CAD tools, Restmage uses **Google Gemini AI** to interpret natural language requirements and property constraints to generate structured 2D layouts.

*   **Prompt-to-Plan**: Describe your requirements (e.g., "A modern 3BHK with a large open kitchen and Vastu compliance") and the AI generates a complete layout.
*   **Constraint Intelligence**: The engine automatically respects plot dimensions (Length x Width) and entrance facing (North/South/East/West) to ensure valid site orientation.
*   **Structured Output**: The AI returns a precise JSON schema containing:
    *   **Walls & Enclosures**: Geometric coordinates for structural elements.
    *   **Room Labeling**: Semantic identification of spaces (Master Bedroom, Balcony, etc.).
    *   **Fixtures & Openings**: Strategic placement of doors and windows based on functional flow.
*   **Interactive Editor**: Once generated, plans can be fine-tuned in our custom-built 2D editor.

### 🗺️ Interactive Map Workspace
Restmage transforms site analysis with a professional-grade **GIS mapping interface** powered by **Leaflet**.

*   **Spatial Context**: Map your project boundaries directly onto real-world coordinates.
*   **Layer Management**: Toggle between satellite imagery, street views, and custom property overlays.
*   **Real-time Marker Sync**: Drag-and-drop markers for site features, with positions saved instantly to the cloud.

### 💰 Intelligent Price & Cost Engine
Restmage provides a dual-approach to financial planning:

1.  **ML-Driven Market Prediction**: Uses a Linear Regression model to predict the market value of a property based on area, age, location, and amenities.
    *   *Reliability Guard*: If the ML Python service is unavailable, the system automatically falls back to a **Heuristic Model** based on pre-defined regional market coefficients.
2.  **Granular Material Ledger**: A bottom-up cost estimation tool where you can track:
    *   Material quantities (Cement, Steel, Bricks, etc.).
    *   Real-time unit pricing.
    *   Labor and equipment overheads.

### 🎨 State-of-the-Art Theme System
Restmage features a dynamic theme engine built on **HSL (Hue, Saturation, Lightness)** logic, allowing for seamless transitions between 5 curated aesthetics:
*   ❄️ **Arctic**: Ultra-clean, high-productivity light mode.
*   🌌 **Midnight Glass**: Premium dark mode with frosted glass (Glassmorphism) effects.
*   ☀️ **Solar Flare**: Warm, high-contrast palette for daylight environments.
*   🌲 **Forest Serenity**: Balanced, organic green tones.
*   ⚡ **Cyberpunk**: A sharp, zero-border, neon-glow aesthetic for the modern power user.

---

## 🛠️ Technical Architecture

### **The Backend Stack**
*   **Node.js & Express**: Optimized for low-latency API responses.
*   **MongoDB & Mongoose**: A robust, document-oriented database for complex project schemas.
*   **Socket.io**: Powers real-time updates and collaboration markers.
*   **Python (ML Service)**: Handles advanced statistical predictions using `scikit-learn`.
*   **Google Generative AI SDK**: High-speed interface for Gemini-2.5-flash.

### **The Frontend Stack**
*   **React 18**: Component-based architecture with **TypeScript** for type safety.
*   **Material-UI (MUI)**: A highly customized UI framework utilizing advanced CSS-in-JS.
*   **Framer Motion**: Smooth page transitions and responsive micro-interactions.
*   **Leaflet.js**: Industry-standard library for interactive maps.

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Instance (Local or Atlas)
- Google AI (Gemini) API Key

### Installation & Launch

1. **Clone & Navigate**:
   ```bash
   git clone https://github.com/ManmohanSinghRaghav/Restmage.git
   cd Restmage
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_token
   GEMINI_API_KEY=your_google_gemini_key
   ```

3. **Install & Run**:
   ```bash
   # Install all dependencies (Root, Client, Server)
   npm install

   # Start the development workspace (Client + Server)
   npm run dev
   ```

---

## 📄 License & Credits
Licensed under the **MIT License**.

Built with ❤️ for the future of Real Estate AI by **Manmohan Singh Raghav**.
