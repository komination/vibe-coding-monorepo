# @kanban/domain-core

Core domain entities and business logic for the Kanban application.

## Overview

This package contains the pure domain layer implementation following Clean Architecture principles. It includes:

- **Entities**: Business objects with behavior and validation
- **Repository Interfaces**: Contracts for data persistence
- **Domain Errors**: Business-specific error types
- **Value Objects**: Core domain types

## Features

- ✅ Framework-agnostic domain logic
- ✅ Zero external dependencies 
- ✅ Type-safe entities with business methods
- ✅ Clean separation of concerns
- ✅ Reusable across multiple applications

## Entities

### Board
Represents a Kanban board with ownership, privacy settings, and member management.

### Card
Individual tasks within lists with assignment, due dates, and position management.

### List
Columns within boards that contain cards with positioning logic.

### User
User accounts with Cognito integration and profile management.

### Label
Categorization tags for cards with color coding.

### Activity
Audit log entries for tracking changes across the system.

## Repository Interfaces

All data access is abstracted through repository interfaces:

- `UserRepository`
- `BoardRepository` 
- `CardRepository`
- `ListRepository`
- `LabelRepository`
- `ActivityRepository`

## Usage

```typescript
import { Board, User, Card } from '@kanban/domain-core';

// Create entities
const board = Board.create({
  title: 'My Project',
  isPublic: false,
  isArchived: false,
  ownerId: 'user-123'
});

// Business logic
const canEdit = board.canBeEditedBy('user-456', 'ADMIN');
board.makePublic();
```

## Development

```bash
# Build the package
bun run build

# Watch mode for development
bun run dev

# Type checking
bun run typecheck
```