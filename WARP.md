# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Ripper - The GitHub Griller** is a Halloween/dev-themed web application that generates humorous roasts of developers based on their public GitHub activity. The system uses Google's Gemini AI through Firebase Genkit to analyze GitHub repositories, commit messages, and user profiles to create witty, developer-centric roasts.

## Architecture

### Tech Stack
- **Frontend**: Angular 20 (standalone components) with TailwindCSS
- **Backend**: Firebase Functions with Google Genkit AI framework
- **AI Model**: Google Gemini 2.0 Flash via Genkit
- **State Management**: TanStack Query (Angular Query) for async state
- **Build System**: Nx monorepo with pnpm package manager
- **Deployment**: Firebase Functions for backend, frontend can be deployed separately

### Monorepo Structure
```
apps/
├── web/          # Angular frontend application
│   └── src/app/  # Standalone components and services
└── genkit/       # Firebase Functions with Genkit AI backend
    └── src/      # Cloud Functions and AI tools
```

### Key Components

#### Frontend (`apps/web`)
- **App Component**: Main application with GitHub username input and roast triggering
- **RoastCard Component**: Modal component that displays AI-generated roasts with sharing capabilities
- **Firebase Integration**: Direct connection to Firebase Functions via Angular Fire
- **HTML2Canvas Integration**: Allows users to download/share roast results as images

#### Backend (`apps/genkit`)
- **GitHub API Tools**: Three Genkit tools for fetching user data:
  - `fetchGithubRepos`: Gets recent repositories with metadata
  - `fetchCommitMessages`: Extracts commit messages from recent activity
  - `fetchGithubUserProfile`: Retrieves public user profile data
- **AI Flow**: `githubGrillerFlow` orchestrates data fetching and roast generation
- **Cloud Function**: `githubGrillerFunction` exposes the flow via Firebase callable function

## Development Commands

### Prerequisites
- Use **pnpm** (configured in package.json) - never use npm directly
- Requires Firebase CLI for local development and deployment
- Requires environment secrets for GITHUB_TOKEN and GEMINI_API_KEY

### Frontend Development
```bash
# Start Angular development server
pnpm nx serve web

# Build frontend for production
pnpm nx build web

# Lint frontend code
pnpm nx lint web
```

### Backend Development
```bash
# Start Firebase emulator for local development
pnpm nx serve genkit
# This runs: firebase emulators:start --only functions

# Build backend functions
pnpm nx build genkit

# Run backend tests
pnpm nx test genkit

# Lint backend code
pnpm nx lint genkit
```

### Full System Development
```bash
# Lint all projects
pnpm nx run-many --target=lint

# Build all projects
pnpm nx run-many --target=build

# Test all projects (where tests exist)
pnpm nx run-many --target=test
```

### Deployment
```bash
# Deploy Firebase Functions
pnpm nx deploy genkit
# This runs: firebase deploy --only functions

# Check affected projects (useful for CI/CD)
pnpm nx affected:build
pnpm nx affected:test
```

## Firebase Configuration

### Required Secrets
The backend requires two Firebase secrets to be configured:
- `GITHUB_TOKEN`: GitHub personal access token for API access
- `GEMINI_API_KEY`: Google AI API key for Gemini model access

### Local Development
- Firebase emulator runs on port 5001
- UI dashboard available when emulator is running
- Functions are hot-reloaded during development

## Code Architecture Notes

### Frontend Patterns
- Uses Angular 20 standalone components (no NgModules)
- Signal-based state management with `signal()` and `input()`/`output()`
- TanStack Query for Firebase Function calls and async state management
- Modern Angular patterns with dependency injection via `inject()`

### Backend Patterns
- Genkit framework for AI tool definition and flow orchestration
- Zod schemas for runtime type validation of external API responses
- Functional programming approach with `ai.defineTool()` and `ai.defineFlow()`
- Firebase Functions v2 with callable functions pattern

### Key Integration Points
- Frontend calls backend via `httpsCallable` from Angular Fire
- Backend uses GitHub API with bearer token authentication
- AI flow combines multiple tools before generating final roast content
- Error handling includes both TypeScript compilation checks and runtime validation

## Development Notes

### Known Issues
- There's a TypeScript error in the `fetchGithubUserProfile` tool (line 174-192) where the schema validation is incorrect
- Nx build may have lockfile-related warnings but shouldn't affect functionality

### AI Prompt Engineering
The roast generation prompt is carefully crafted to be:
- Witty and sarcastic but not genuinely mean
- Focused on technical aspects (languages, repo names, activity patterns)
- Halloween/spooky themed to match the app's aesthetic
- Constrained to only use GitHub activity data

### Sharing Features
- Uses html2canvas to convert roast cards to images
- Supports both download and native share API
- Graceful fallback when share API is not supported

## Firebase Project
- Project ID: `github-griller`
- Functions deploy to `us-central1` region (default)
- Single codebase configuration in `.firebaserc`