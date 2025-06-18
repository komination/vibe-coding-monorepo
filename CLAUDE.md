# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript Kanban application using Turborepo monorepo:
- **Frontend**: Next.js 15.3.3 with App Router and React 19
- **Backend**: Hono web framework with Node.js
- **Build System**: Turborepo for task orchestration and caching
- **Development**: Docker Compose for containerized development

## Architecture

The project follows a monorepo structure with clear separation:

- `backend/` - Hono API server (port 3001)
  - `src/index.ts` - Main server entry point with API endpoints
  - `/api/message` - JSON API endpoint for frontend consumption
  - CORS configuration for cross-origin requests
  - Uses ESM modules and tsx for development
  - Own package.json with backend-specific dependencies
- `frontend/` - Next.js application (port 4001)
  - `app/` - App Router structure with SSR implementation
  - `lib/api.ts` - API client for backend communication
  - Server-side rendering of API data
  - Uses Geist fonts and CSS modules for styling
  - Own package.json with frontend-specific dependencies
- `compose.yml` - Docker development environment

## Dependency Management

Following Turborepo best practices:
- **Each package has its own dependencies** in their respective package.json files
- **Root package.json** only contains repository management tools (turbo)
- **No shared dependencies at root level** - each package declares what it needs
- Dependencies are installed via npm workspaces in package subdirectories

## Development Commands

### Turborepo Commands (Recommended)
```bash
# From project root
npm install            # Install all dependencies
npm run dev            # Start all development servers
npm run build          # Build all packages
npm run lint           # Lint all packages
npm run clean          # Clean all build outputs

# Run specific package commands
npx turbo dev --filter=frontend    # Start only frontend
npx turbo dev --filter=backend     # Start only backend
npx turbo build --filter=frontend  # Build only frontend
```

### Individual Package Development (Alternative)
```bash
cd backend
npm run dev      # Development server with hot reload on port 3001
npm run build    # TypeScript compilation to dist/
npm start        # Production server

cd frontend
npm run dev      # Next.js dev server on port 4001 (Turbopack disabled)
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint checks
```

### Docker Development
```bash
# From project root
docker-compose up  # Start containerized development environment
```

## Key Technical Details

- **Turborepo**: Handles task orchestration, caching, and parallel execution
- **Workspaces**: NPM workspaces for dependency management
- **Backend**: Runs on port 3001 with Hono framework
  - REST API with `/api/message` endpoint
  - CORS enabled for frontend communication
  - JSON response format with message, timestamp, and version
- **Frontend**: Runs on port 4001 with Next.js App Router
  - Server-side rendering (SSR) of API data
  - TypeScript strict mode enabled
  - Turbopack disabled due to compatibility issues
- **API Integration**: Full-stack communication with error handling
- Both use modern TypeScript with ESNext/NodeNext modules
- CSS styling uses CSS modules and custom properties
- No test framework currently configured
- No linting rules beyond Next.js defaults

## Current State

The project has evolved from basic scaffolding to a functional full-stack application:

### Implemented Features
- **Backend API**: Functional REST API with message endpoint
  - `/api/message` returns JSON with Japanese message, timestamp, and version
  - CORS configured for cross-origin requests from frontend
  - Server running on port 3001 with proper error handling

- **Frontend Application**: SSR-enabled Next.js application
  - Server-side rendering of API data on homepage
  - API client with error handling and fallback UI
  - Responsive design with CSS modules styling
  - Server running on port 4001

- **Full-Stack Integration**: Complete API communication
  - Frontend fetches data from backend during SSR
  - Error handling for backend unavailability
  - Real-time timestamp display from server responses

### Development Setup
- Turborepo monorepo configuration working
- Both servers can run simultaneously via `npm run dev`
- All dependencies managed at root level (no individual node_modules)
- Port separation eliminates conflicts (backend: 3001, frontend: 4001)

### Access URLs
- **Frontend Application**: http://localhost:4001
- **Backend API**: http://localhost:3001
- **API Message Endpoint**: http://localhost:3001/api/message
- **Health Check**: http://localhost:3001/ (returns "Hello Hono!")

### Known Issues
- Turbopack disabled due to compatibility issues
- Docker setup references missing .devcontainer directory

### Next Steps Recommendations
- Add test framework (Jest/Vitest recommended)
- Implement proper error boundaries in frontend
- Add more API endpoints for Kanban functionality
- Configure production build and deployment