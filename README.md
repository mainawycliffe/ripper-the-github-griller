# 🔥 Ripper - The GitHub Griller

<div align="center">

![Vertex AI](https://img.shields.io/badge/Powered_by-Vertex_AI-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Functions-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
[![Sponsor](https://img.shields.io/badge/Sponsor-💚-success?style=for-the-badge)](https://github.com/sponsors/mainawycliffe)

**A darkly humorous, AI-powered roaster that tears apart developers based on their GitHub activity!** 💀

[**🚀 Try Live Demo**](https://ripper-the-github-griller.vercel.app/) | [**📖 Documentation**](#features) | [**🤝 Contributing**](#contributing)

</div>

---

## 🎭 What is Ripper?

Ripper is a **Vertex AI-powered** Halloween/dev-themed web app that analyzes your public GitHub profile and delivers savage (but playful) roasts based on your repos, commits, starred projects, and coding patterns. Think of it as a code review from your worst nightmare! 😈

Built with **Firebase Genkit**, **Vertex AI (Gemini 2.5 Flash)**, **Angular 20**, and **Tailwind CSS**, Ripper features:

- 🤖 **8 unique AI personalities** (Gordon Ramsay, Shakespeare, Master Yoda, Kenyan Sheng, and more!)
- 🔥 **5 intensity levels** (from gentle ribbing to absolutely charred)
- 🎨 **Sleek emerald-cyan trickster theme** with animations
- 📸 **Downloadable roast cards** for sharing
- 🌐 **Social sharing** capabilities

---

## ✨ Features

### 🎭 8 Unique Roast Personalities

| Personality           | Description                         | Example                           |
| --------------------- | ----------------------------------- | --------------------------------- |
| 🔥 **Default**        | Witty, sarcastic code reviewer      | Classic tech roasts               |
| 👨‍🍳 **Gordon Ramsay**  | Kitchen nightmare meets code review | "This code is RAW!"               |
| 🏴‍☠️ **Pirate Captain** | High seas coding critique           | "Arrr, this be shipwrecked code!" |
| 🎭 **Shakespeare**    | Theatrical, poetic roasts           | "To code or not to code..."       |
| 😎 **Gen Z**          | Modern slang and memes              | "This code is mid, no cap"        |
| 😊 **Nice Guy**       | Backhanded compliments              | "It's brave you tried..."         |
| 🧙 **Master Yoda**    | Backwards wisdom                    | "Much to learn, you have"         |
| 🇰🇪 **Kenyan Sheng**   | Nairobi street slang                | "Mbaya sana!"                     |

### 🔥 5 Intensity Levels

- **😊 Gentle Ribbing** - Light-hearted teasing
- **😏 Medium Rare** - Mildly sarcastic
- **🔥 Well Done** - Standard roasting (sweet spot)
- **💥 Extra Crispy** - Aggressive but clever
- **☠️ Absolutely Charred** - No mercy, maximum savage

### 📊 Comprehensive Analysis

Ripper analyzes:

- **Profile data** - Bio, followers, company, and account activity
- **Repositories** - Project names, stars, activity patterns
- **Commit messages** - Quality and patterns
- **Language statistics** - Programming language usage
- **Starred repos** - Interests vs actual work

### 🎨 Features

- Beautiful, animated UI with custom theme
- Downloadable roast cards for sharing
- Social sharing capabilities
- Fully responsive design
- Fast and smooth user experience

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 9+
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Nx CLI** (optional, installed as dev dependency)
- **GitHub Personal Access Token** (for API access)
- **Google Cloud Project** with Vertex AI enabled

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mainawycliffe/github-griller.git
   cd github-griller
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up Firebase**

   ```bash
   firebase login
   firebase use --add
   ```

4. **Configure secrets**

   Create a `.env` file in `apps/genkit/`:

   ```bash
   GITHUB_TOKEN=your_github_token_here
   ```

   For production, set Firebase secrets:

   ```bash
   firebase functions:secrets:set GITHUB_TOKEN
   ```

5. **Enable Vertex AI and set permissions**

   ```bash
   # Enable Vertex AI API
   gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID

   # Grant IAM permissions to Cloud Functions service account
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

### Development

**Run the web app:**

```bash
pnpm nx serve web
# Opens at http://localhost:4200
```

**Run Firebase emulators:**

```bash
pnpm nx serve genkit
# Functions at http://localhost:5001
```

**Build for production:**

```bash
# Build web app
pnpm nx build web

# Build Firebase functions
pnpm nx build genkit
```

**Deploy:**

```bash
# Deploy to Vercel (web app)
vercel deploy --prod

# Deploy to Firebase (functions)
firebase deploy --only functions
```

---

## 🏗️ Project Structure

This is an Nx monorepo with two main applications:

- **`apps/genkit/`** - Firebase Functions backend with AI orchestration
- **`apps/web/`** - Angular frontend application

---

## 🛠️ Tech Stack

### Frontend

- **Angular 20** - Modern web framework
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and state management

### Backend

- **Firebase Genkit** - AI orchestration framework
- **Vertex AI (Gemini 2.5 Flash)** - Google's LLM for generating roasts
- **Firebase Functions** - Serverless backend
- **GitHub REST API** - Profile data fetching

### Build Tools

- **Nx** - Monorepo build system
- **TypeScript** - Type safety

---

## 🎨 Customization

### Adding New Personalities

1. **Update backend** (`apps/genkit/src/index.ts`):

   Add your personality to the enum and create a prompt for it.

2. **Update frontend** (`apps/web/src/app/app.ts`):

   Add the personality to the UI with an emoji and description.

---

---

## 🛠️ Tech Stack

### Frontend

- **Angular 20** - Standalone components, signals, control flow
- **Tailwind CSS 3** - Utility-first styling
- **TanStack Query** - State management
- **html2canvas** - Screenshot generation
- **Custom animations** - CSS keyframes

### Backend

### Backend

- **Firebase Genkit** - AI orchestration framework
- **Vertex AI (Gemini 2.5 Flash)** - Google's LLM for generating roasts
- **Firebase Functions** - Serverless backend
- **Zod** - Schema validation
- **GitHub REST API** - Profile data fetching

### Build Tools

- **Nx 21** - Monorepo build system
- **esbuild** - Fast bundling
- **TypeScript 5** - Type safety

---

## 🎨 Customization

### Adding New Personalities

1. **Update backend** (`apps/genkit/src/index.ts`):

   ```typescript
   personality: z.enum([
     'default',
     'your-new-personality',
     // ... other personalities
   ]);

   const personalityPrompts: Record<string, string> = {
     'your-new-personality': 'Your prompt description here...',
   };
   ```

2. **Update frontend** (`apps/web/src/app/app.ts`):
   ```typescript
   personalities = [
     {
       value: 'your-new-personality',
       label: '🎭 Your Label',
       emoji: '🎭',
       description: 'Short description',
     },
   ];
   ```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👨‍💻 Author

**Maina Wycliffe**

- Portfolio: [mainawycliffe.dev](https://mainawycliffe.dev)
- GitHub: [@mainawycliffe](https://github.com/mainawycliffe)
- Sponsor: [GitHub Sponsors](https://github.com/sponsors/mainawycliffe) 💚

---

## 🙏 Acknowledgments

- **Google Cloud** - For Vertex AI and Gemini models
- **Firebase** - For Genkit and Cloud Functions
- **Nx Team** - For the amazing monorepo tools
- **Angular Team** - For Angular 20 and standalone components
- **Open Source Community** - For all the incredible packages

---

## ⚠️ Disclaimer

This app is meant for fun and entertainment! Roasts are generated by AI and should not be taken seriously. All data is fetched from public GitHub APIs - no private information is accessed.

---

<div align="center">

**Made with 💚 (and a dash of evil) by [Maina Wycliffe](https://mainawycliffe.dev)**

⭐ Star this repo if you enjoyed getting roasted! ⭐

</div>
