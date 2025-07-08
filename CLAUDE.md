# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript Kanban application using Turborepo monorepo with complete internal package separation:
- **Frontend**: Next.js 15.3.3 with App Router and React 19
- **Backend**: Hono web framework with Node.js
- **Domain Layer**: Shared business entities and interfaces (`@kanban/domain-core`)
- **Use Cases**: Business logic implementation (`@kanban/use-cases`)
- **Build System**: Turborepo for task orchestration and caching
- **Package Manager**: Bun for fast dependency management
- **Development**: Docker Compose for containerized development

## Architecture

The project follows Clean Architecture with Domain-Driven Design (DDD) principles:

```
kanban-monorepo/
├── apps/
│   ├── backend/         # Hono API server (port 3001)
│   └── frontend/        # Next.js 15 app (port 4001)
└── packages/
    ├── domain-core/     # Business entities & repository interfaces
    └── use-cases/       # Business logic & use case implementations
```

### Internal Packages

#### @kanban/domain-core
- **Purpose**: Core business entities and repository interfaces
- **Contents**:
  - `entities/`: Domain models (User, Board, Card, List, Label, Activity, etc.)
  - `repositories/`: Repository interfaces for data access
  - `errors/`: Domain-specific error classes
  - `types/`: TypeScript types (e.g., BoardMembership)
- **Build**: SWC for fast TypeScript compilation
- **Exports**: ESM modules with TypeScript definitions

#### @kanban/use-cases
- **Purpose**: Business logic implementation
- **Contents**: 40+ use cases organized by domain:
  - Board management (create, update, delete, permissions)
  - Member management (invite, role updates)
  - List operations (CRUD, positioning)
  - Card operations (CRUD, assignments, due dates)
  - Label management
  - User profile operations
- **Dependencies**: `@kanban/domain-core`
- **Testing**: Comprehensive test suite with 30+ test files

### Backend Architecture (apps/backend/)
- **Framework**: Hono web framework on port 3001
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: AWS Cognito integration
- **Architecture Layers**:
  - `src/domain/`: Use case implementations (imports from `@kanban/use-cases`)
  - `src/application/`: Controllers and request handling
  - `src/infrastructure/`: Database, external services
  - `src/interfaces/`: HTTP routes and middleware
- **Key Features**:
  - JWT token management with rotation
  - Role-based access control (OWNER/ADMIN/MEMBER/VIEWER)
  - Comprehensive error handling
  - Database migrations and seeding

### Frontend Architecture (apps/frontend/)
- **Framework**: Next.js 15.3.3 with App Router on port 4001
- **Structure**:
  - `app/(auth)/`: Authentication pages
  - `app/(protected)/`: Protected routes requiring authentication
  - `app/api/`: Backend proxy routes
- **Features**:
  - Server-side rendering
  - CSS modules for styling
  - TypeScript strict mode

## Commands

### Monorepo Commands (Recommended - Run from root)
```bash
bun install          # Install all dependencies
bun run dev          # Start all services concurrently
bun run build        # Build all packages
bun run test         # Run all tests
bun run lint         # Lint all packages with Biome
bun run clean        # Clean all build artifacts
```

### Turborepo-specific Commands
```bash
# Run commands for specific packages
npx turbo dev --filter=backend     # Start only backend
npx turbo dev --filter=frontend    # Start only frontend
npx turbo build --filter=@kanban/domain-core  # Build specific package
npx turbo test --filter=@kanban/use-cases     # Test specific package
```

### Backend Commands (from apps/backend/)
```bash
# Development
bun run dev              # Hot-reload development server (port 3001)
bun run build            # Production build
bun run start            # Production server

# Testing
bun run test             # Run all tests
bun run test:unit        # Unit tests only
bun run test:integration # Integration tests only
bun run test:watch       # Watch mode
bun run test:coverage    # With coverage report

# Database
bun run db:migrate       # Run database migrations
bun run db:migrate:create # Create new migration
bun run db:migrate:deploy # Deploy migrations (production)
bun run db:generate      # Generate Prisma client
bun run db:seed          # Seed database with sample data
bun run db:reset         # Reset database (dev only)
bun run db:studio        # Open Prisma Studio GUI
bun run db:test:setup    # Setup test database
bun run db:test:reset    # Reset test database
```

### Frontend Commands (from apps/frontend/)
```bash
bun run dev      # Development server (port 4001)
bun run build    # Production build
bun run start    # Production server
bun run lint     # Run ESLint
bun run clean    # Remove .next directory
```

### Package Commands (from packages/*)
```bash
# domain-core & use-cases
bun run build    # Compile TypeScript with SWC
bun run clean    # Remove dist directory
bun run test     # Run tests (use-cases only)
```

## Database Schema

The Kanban application uses PostgreSQL with the following core entities:
- **User**: AWS Cognito integration (cognitoSub)
- **Board**: Workspaces with privacy settings
- **BoardMember**: Role-based permissions
- **List**: Kanban columns with positioning
- **Card**: Tasks with metadata (due dates, assignments)
- **Label/CardLabel**: Flexible tagging system
- **Comment**: Card discussions
- **Attachment**: File management
- **Checklist/ChecklistItem**: Sub-tasks
- **Activity**: Audit logging

## Development Workflow

### Running a Single Test
```bash
# Backend tests
cd apps/backend
bun test path/to/test.test.ts

# Use-cases tests
cd packages/use-cases
bun test src/__tests__/boards/createBoard.test.ts
```

### Environment Setup
1. Copy `.env.example` to `.env` in backend directory
2. Configure AWS Cognito credentials
3. Run `docker-compose up` for PostgreSQL
4. Run `bun run db:migrate` to setup database
5. Run `bun run db:seed` for sample data

### Adding New Features
1. Define entities/interfaces in `@kanban/domain-core`
2. Implement use cases in `@kanban/use-cases` with tests
3. Add API endpoints in backend
4. Update frontend components

## Key Technical Details

- **TypeScript**: ESM modules with strict mode
- **Testing**: Bun test runner with fixtures and factories
- **Code Quality**: Biome for formatting and linting
- **Package Manager**: Bun workspaces for dependency management
- **Ports**: Backend (3001), Frontend (4001), PostgreSQL (5432), Prisma Studio (5555)

## Commit Message Convention

Follow the format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `refactor`, `chore`, `test`
Scopes: `backend`, `frontend`, `domain-core`, `use-cases`, `root`

Examples:
- `feat(backend): implement board member management`
- `fix(use-cases): correct card position calculation`
- `refactor(domain-core): improve error handling`