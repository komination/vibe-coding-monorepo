# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript Kanban application using Turborepo monorepo:
- **Frontend**: Next.js 15.3.3 with App Router and React 19
- **Backend**: Hono web framework with Node.js
- **Build System**: Turborepo for task orchestration and caching
- **Development**: Docker Compose for containerized development

## Architecture

The project follows a monorepo structure with clear separation and Clean Architecture principles:

### Backend (`backend/`) - Clean Architecture Structure
- **Clean Architecture Layers**:
  - `src/domain/` - Business logic layer
    - `entities/` - Business objects and domain models
    - `repositories/` - Repository interfaces
    - `usecases/` - Business rules and use cases
  - `src/application/` - Application layer
    - `controllers/` - Request/response handling
    - `presenters/` - Data presentation logic
    - `validators/` - Input validation
  - `src/infrastructure/` - Infrastructure layer
    - `database/` - Database connection and configuration
    - `repositories/` - Repository implementations
    - `external/` - External service integrations
  - `src/interfaces/` - Interface layer
    - `http/routes/` - HTTP route definitions
    - `http/middleware/` - HTTP middleware
    - `http/dto/` - Data transfer objects
- **Database**: PostgreSQL with Prisma ORM
  - Full Kanban schema with 11+ tables
  - Migration system with `npm run db:migrate`
  - Seed data system with `npm run db:seed`
- **Technology Stack**:
  - Hono web framework
  - Prisma ORM with PostgreSQL
  - ESM modules and tsx for development
  - Port 3001 for API server

### Frontend (`frontend/`) - Next.js Application
- `app/` - App Router structure with SSR implementation
- `lib/api.ts` - API client for backend communication
- Server-side rendering of API data
- Uses Geist fonts and CSS modules for styling
- Own package.json with frontend-specific dependencies
- Port 4001 for web application

### Infrastructure
- `compose.yml` - Docker development environment with PostgreSQL
- PostgreSQL 16 running on port 5432

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
# Backend development
cd backend
npm run dev           # Development server with hot reload on port 3001
npm run build         # TypeScript compilation to dist/
npm start             # Production server
npm run db:migrate    # Run database migrations
npm run db:seed       # Insert seed data
npm run db:reset      # Reset database (dev only)
npm run db:studio     # Open Prisma Studio GUI

# Frontend development
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

### Build System & Workspaces
- **Turborepo**: Handles task orchestration, caching, and parallel execution
- **Workspaces**: NPM workspaces for dependency management
- Both use modern TypeScript with ESNext/NodeNext modules

### Backend Architecture
- **Framework**: Hono web framework on port 3001
- **Database**: PostgreSQL 16 with Prisma ORM
- **Architecture**: Clean Architecture with domain-driven design
- **API Design**: RESTful endpoints with proper error handling
- **Migration System**: Prisma-based schema versioning
- **Database Schema**: Comprehensive Kanban application schema
  - User management with authentication
  - Board/List/Card hierarchy with position management
  - Label system for categorization
  - Comment and attachment features
  - Activity logging for audit trails
  - Role-based access control (OWNER/ADMIN/MEMBER/VIEWER)

### Frontend Architecture  
- **Framework**: Next.js 15.3.3 with App Router on port 4001
- **Rendering**: Server-side rendering (SSR) of API data
- **Styling**: CSS modules and custom properties
- **TypeScript**: Strict mode enabled
- **Turbopack**: Disabled due to compatibility issues

### Database Schema
The Kanban application uses a comprehensive PostgreSQL schema with:
- **User**: Authentication and profile management
- **Board**: Project workspaces with ownership
- **BoardMember**: Role-based access control
- **List**: Kanban columns with positioning
- **Card**: Tasks with rich metadata (due dates, assignments, etc.)
- **Label/CardLabel**: Flexible tagging system
- **Comment**: Collaboration features
- **Attachment**: File management
- **Checklist/ChecklistItem**: Sub-task management
- **Activity**: Comprehensive audit logging

### Development Tools
- **Database GUI**: Prisma Studio for data management
- **Migration**: Automated schema versioning
- **Seeding**: Sample data for development
- **Type Safety**: Full end-to-end TypeScript coverage

## Current State

The project has evolved from basic scaffolding to a well-architected Kanban application foundation:

### Implemented Infrastructure
- **Clean Architecture Backend**: Complete directory structure following domain-driven design
  - Domain layer with entities, repositories, and use cases
  - Application layer with controllers and validators
  - Infrastructure layer with database and external integrations
  - Interface layer with HTTP routes and DTOs

- **Database Architecture**: Production-ready PostgreSQL setup
  - Comprehensive Kanban schema with 11+ tables
  - Proper relationships with foreign keys and cascading deletes
  - Optimized indexes for performance
  - Migration system for schema versioning
  - Seed data system for development

- **Development Environment**: Docker-based PostgreSQL
  - PostgreSQL 16 container with persistent volumes
  - Automated database setup and migrations
  - Prisma Studio for database management

### Ready for Implementation
- **Backend API**: Clean architecture structure ready for:
  - User authentication and authorization
  - Board management (CRUD operations)
  - Card and list management with drag-and-drop support
  - Real-time collaboration features
  - File attachment handling

- **Frontend Application**: Next.js foundation ready for:
  - Kanban board UI components
  - Drag-and-drop interactions
  - Real-time updates
  - User authentication flows

### Development Setup
- Turborepo monorepo configuration working
- Database migrations and seeding automated
- All dependencies managed at workspace level
- Port separation: Backend (3001), Frontend (4001), PostgreSQL (5432)

### Access URLs
- **Frontend Application**: http://localhost:4001
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on localhost:5432
- **Prisma Studio**: http://localhost:5555 (when running `npm run db:studio`)

### Current Status
- ✅ Clean Architecture structure implemented
- ✅ Database schema and migrations complete
- ✅ PostgreSQL integration working
- ✅ Development environment containerized
- 🔄 Ready for API endpoint implementation
- 🔄 Ready for frontend Kanban UI development

### Next Development Phase
- Implement domain entities and use cases
- Create repository implementations
- Build REST API endpoints for Kanban operations
- Develop frontend Kanban board interface
- Add real-time collaboration features