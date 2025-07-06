# Backend Testing Guide

This guide explains the test infrastructure setup for the Kanban backend application.

## Test Framework

The backend uses **Bun's built-in test runner**, which is Jest-compatible and requires no additional dependencies. Bun provides native TypeScript execution without compilation, making it ideal for modern TypeScript development.

**Key Features:**

- Fast test execution with native TypeScript support
- No build step required - TypeScript files run directly
- Jest-compatible API for familiar testing patterns
- Built-in coverage reporting
- Watch mode for development
- Comprehensive mocking capabilities
- Zero configuration setup

## Test Structure

Tests are organized following the Clean Architecture layers:

```text
src/
├── domain/__tests__/
│   ├── entities/        # Domain entity tests
│   └── usecases/        # Business logic tests
├── application/__tests__/
│   ├── controllers/     # Controller tests
│   └── validators/      # Input validation tests
├── infrastructure/__tests__/
│   └── repositories/    # Database integration tests
├── interfaces/__tests__/
│   └── routes/          # API endpoint tests
└── test/
    ├── setup.ts         # Global test setup
    ├── fixtures/        # Test data factories
    └── utils/           # Test helpers
```

## Current Test Implementation Status

As of the latest assessment, the backend has achieved partial test coverage with strengths in the domain layer but significant gaps in other architectural layers:

**Overall Metrics:**
- **Total Implementation Files**: 92
- **Total Test Files**: 40 
- **Overall Test Coverage**: ~43.5%
- **Total Tests**: 936 tests passing

### Test Coverage by Layer

| Layer | Implementation Files | Test Files | Coverage | Status |
|-------|---------------------|------------|----------|---------|
| **Domain/Entities** | 7 | 7 | 100% | ✅ Excellent |
| **Domain/UseCases** | 35 | 29 | 82.9% | ⚠️ Good, but gaps in auth |
| **Application/Controllers** | 5 | 0 | 0% | ❌ Critical gap |
| **Application/Validators** | 6 | 1 | 16.7% | ❌ Needs improvement |
| **Infrastructure/Repositories** | 6 | 1 | 16.7% | ❌ Needs improvement |
| **Interface/Routes** | 6 | 2 | 33.3% | ❌ Insufficient |

### Missing Test Coverage

**Domain Layer - UseCases without tests (6/35):**
- `GetUserBoards` - User board retrieval
- `GetUserProfile` - User profile fetching
- `UpdateUserProfile` - Profile modifications
- `LogoutUser` - Session termination
- `SyncCognitoUser` - AWS Cognito sync (16.67% coverage)
- `VerifyCognitoToken` - Token validation (33.33% coverage)

**Application Layer - No controller tests implemented**

**Infrastructure Layer - Limited repository tests:**
- Only `PrismaBoardRepository` has tests (92.31% coverage)
- Missing: User, Card, List, Label, Activity repositories

**Interface Layer - Limited route tests:**
- Only `boardRoutes` has comprehensive tests
- Missing: auth, card, list, label routes

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run with coverage report
bun run test:coverage

# Run only unit tests (domain + application layers)
bun run test:unit

# Run only integration tests (infrastructure + interfaces)
bun run test:integration

# Setup test database
bun run db:test:setup

# Reset test database
bun run db:test:reset
```

## Test Database

The test suite uses a separate PostgreSQL database (`kanban_test`) to avoid affecting development data.

### Setup Test Database

1. Create the test database:
   ```bash
   createdb kanban_test
   ```

2. Run migrations on test database:
   ```bash
   bun run db:test:setup
   ```

## Test Quality Assessment

### Strengths
- ✅ **Domain layer tests are high quality**: Comprehensive coverage with proper test patterns
- ✅ **Builder Pattern implementation**: Clean, readable test data creation
- ✅ **Test isolation**: Proper database cleanup and mocking strategies
- ✅ **Fast execution**: Leveraging Bun's native test runner
- ✅ **Good test organization**: Clear separation by architectural layers

### Critical Gaps
- ❌ **No Application Controller tests**: API input/output validation untested
- ❌ **Missing authentication tests**: Critical security functionality not covered
- ❌ **Limited Infrastructure tests**: Database operations mostly untested
- ❌ **No E2E tests**: Full API flow validation missing

## Improvement Recommendations

### Priority 1: High Risk Areas (Implement immediately)
1. **Application Controllers** - Test API contract and error handling
   - Focus on request validation and response formatting
   - Test authentication and authorization flows
   - Verify error response structures

2. **Authentication UseCases** - Critical security functionality
   - `VerifyCognitoToken` - Token validation logic
   - `GetUserProfile` - User data access control
   - `SyncCognitoUser` - User synchronization

### Priority 2: Data Integrity (Implement soon)
3. **Infrastructure Repositories** - Database operation correctness
   - Start with `PrismaUserRepository` and `PrismaCardRepository`
   - Test transaction handling and error cases
   - Verify cascade operations work correctly

4. **Validators** - Input sanitization and validation
   - Implement remaining validator tests (Auth, Card, List, Label)
   - Test edge cases and malicious input handling

### Priority 3: API Coverage (Complete coverage)
5. **Interface Routes** - End-to-end API testing
   - Implement tests for auth, card, list, and label routes
   - Include both unit and integration tests
   - Test rate limiting and middleware behavior

### Recommended Coverage Targets
- **Overall**: Aim for 80%+ coverage
- **Domain Layer**: Maintain current 90%+ (excellent)
- **Application Layer**: Target 85%+ (critical for API safety)
- **Infrastructure Layer**: Target 80%+ (data integrity)
- **Interface Layer**: Target 75%+ (API specifications)

## Writing Tests

### Implemented Test Patterns

Use the actual test patterns currently implemented in the codebase as reference.

### Entity Tests (Domain Layer)

Entity tests use the **Builder Pattern** and implement comprehensive test cases:

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Card } from "@/domain/entities/Card";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";
import { CardBuilder } from "@/test/fixtures/entityFactories";

describe("Card Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("Card creation", () => {
    test("generates unique UUID when creating card", () => {
      const card = CardBuilder.valid().build();
      expect(card.id).toMatch(UUID_REGEX);
    });

    test("assigns card to specified list", () => {
      const card = CardBuilder.valid().inList("list-456").build();
      expect(card.listId).toBe("list-456");
    });
  });

  describe("Card assignment", () => {
    test("should assign card to a user", () => {
      const card = CardBuilder.valid().build();
      card.assignTo("user-456");
      expect(card.assigneeId).toBe("user-456");
    });

    test("should unassign card when set to undefined", () => {
      const card = CardBuilder.valid().assignedTo("user-456").build();
      card.assignTo(undefined);
      expect(card.assigneeId).toBeUndefined();
    });
  });
});
```

### Use Case Tests (Domain Layer)

Use cases isolate dependencies using mock repositories:

```typescript
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateBoardUseCase } from "@/domain/usecases/CreateBoard";
import { createMockUser } from "@/test/fixtures/entityFactories";

describe("CreateBoardUseCase", () => {
  let useCase: CreateBoardUseCase;
  let mockBoardRepository: BoardRepository;
  let mockUserRepository: UserRepository;
  let mockActivityRepository: ActivityRepository;

  beforeEach(() => {
    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      addMember: mock(() => Promise.resolve()),
      // ... other methods
    } as unknown as BoardRepository;

    mockUserRepository = {
      findById: mock(() => Promise.resolve(createMockUser({ isActive: true }))),
      // ... other methods
    } as unknown as UserRepository;

    useCase = new CreateBoardUseCase(
      mockBoardRepository,
      mockUserRepository,
      mockActivityRepository
    );
  });

  test("should create a board successfully", async () => {
    const request = {
      title: "My Test Board",
      description: "A board for testing",
      ownerId: "user-123",
    };

    const result = await useCase.execute(request);

    expect(result.board.title).toBe("My Test Board");
    expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockBoardRepository.addMember).toHaveBeenCalledWith(
      expect.any(String),
      "user-123",
      "OWNER"
    );
  });

  test("should throw error if owner not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      title: "Test Board",
      ownerId: "non-existent-user",
    };

    expect(useCase.execute(request)).rejects.toThrow("Owner not found");
  });
});
```

**CreateLabel Use Case Pattern** (newly implemented):

```typescript
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateLabelUseCase } from "@/domain/usecases/CreateLabel";
import { Board, BoardRole } from "@/domain/entities/Board";

describe("CreateLabelUseCase", () => {
  let useCase: CreateLabelUseCase;
  let mockLabelRepository: LabelRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;

  beforeEach(() => {
    // Create a default board entity
    const defaultBoard = Board.create({
      title: "Test Board",
      description: "Test Description",
      isPublic: false,
      isArchived: false,
      ownerId: "board-owner",
    });

    mockBoardRepository = {
      findById: mock(() => Promise.resolve(defaultBoard)),
      getMemberRole: mock(() => Promise.resolve("ADMIN" as BoardRole)),
      // ... other methods
    } as unknown as BoardRepository;

    useCase = new CreateLabelUseCase(
      mockLabelRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should create a label successfully", async () => {
    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Bug");
    expect(result.label.color).toBe("#FF0000"); // Should be uppercase
    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should deny MEMBER to create label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      name: "Bug", 
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });
});
```

### Repository Integration Tests

Integration tests using real database:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { PrismaBoardRepository } from "@/infrastructure/repositories/PrismaBoardRepository";
import { prismaTest } from "@/test/setup";
import { Board } from "@/domain/entities/Board";

describe("PrismaBoardRepository", () => {
  let repository: PrismaBoardRepository;
  let testUser: any;

  beforeEach(async () => {
    repository = new PrismaBoardRepository(prismaTest);

    // Create test user in database
    testUser = await prismaTest.user.create({
      data: {
        cognitoSub: "test-cognito-id",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        isActive: true,
      },
    });
  });

  test("should save a new board", async () => {
    const board = Board.create({
      title: "Test Board",
      description: "Test Description",
      isPublic: false,
      isArchived: false,
      ownerId: testUser.id,
    });

    await repository.save(board);

    const savedBoard = await prismaTest.board.findUnique({
      where: { id: board.id },
    });

    expect(savedBoard).toBeDefined();
    expect(savedBoard?.title).toBe("Test Board");
  });

  test("should find boards by owner with filtering", async () => {
    await prismaTest.board.createMany({
      data: [
        { title: "Active Board", ownerId: testUser.id },
        { title: "Archived Board", ownerId: testUser.id, isArchived: true },
      ],
    });

    const boards = await repository.findByOwner(testUser.id);
    expect(boards).toHaveLength(1); // Archived board excluded by default

    const allBoards = await repository.findByOwner(testUser.id, {
      includeArchived: true,
    });
    expect(allBoards).toHaveLength(2);
  });
});
```

### API Route Tests

Implementing both unit tests and integration tests:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { createBoardRoutes } from "@/interfaces/http/routes/boardRoutes";
import { prismaTest } from "@/test/setup";
import { mockAuthMiddleware } from "@/test/utils/mockAuth";

describe("Board Routes", () => {
  let app: Hono;
  let testUser: any;

  beforeEach(async () => {
    app = new Hono();
    app.use("*", mockAuthMiddleware);
    app.route("/boards", createBoardRoutes(container.boardController, container.listController));

    testUser = await prismaTest.user.create({
      data: {
        cognitoSub: "test-cognito-id",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        isActive: true,
      },
    });
  });

  test("POST /boards should create a board", async () => {
    const response = await app.request("/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        title: "New Board",
        description: "Board Description",
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.title).toBe("New Board");

    // Verify board was created in database
    const board = await prismaTest.board.findUnique({
      where: { id: data.id },
    });
    expect(board).toBeDefined();
  });

  test("should return 403 if user is not owner or admin", async () => {
    const otherUser = await prismaTest.user.create({
      data: {
        cognitoSub: "other-cognito-id",
        email: "other@example.com",
        username: "otheruser",
        name: "Other User",
      },
    });

    const board = await prismaTest.board.create({
      data: {
        title: "Other's Board",
        ownerId: otherUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: "MEMBER", // Not ADMIN or OWNER
          },
        },
      },
    });

    const response = await app.request(`/boards/${board.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        title: "Updated Title",
      }),
    });

    expect(response.status).toBe(403);
  });
});
```

### Validation Tests

Detailed validation logic tests:

```typescript
import { describe, test, expect } from "bun:test";
import { BoardValidator } from "@/application/validators/BoardValidator";

describe("BoardValidator", () => {
  describe("validateCreateBoard", () => {
    test("should validate valid board data", () => {
      const data = {
        title: "My Board",
        description: "A test board",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: "My Board",
        description: "A test board",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
      });
    });

    test("should fail if title is too long", () => {
      const data = {
        title: "a".repeat(256),
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "title",
          message: "title must be no more than 255 characters",
        })
      );
    });
  });
});
```

## Test Utilities

### Entity Factories (Builder Pattern)

Use the currently implemented Builder patterns to create test data:

```typescript
import { 
  UserBuilder, 
  BoardBuilder, 
  ListBuilder, 
  CardBuilder,
  createBoardMember,
  createOwnerMember,
  createAdminMember,
  createRegularMember,
  createViewerMember
} from "@/test/fixtures/entityFactories";

// Builder pattern with method chaining
const user = UserBuilder.valid()
  .withEmail("custom@example.com")
  .withName("Custom User")
  .active()
  .build();

const board = BoardBuilder.valid()
  .withTitle("Test Board")
  .withDescription("Board for testing")
  .withOwner(user.id)
  .public()
  .build();

const card = CardBuilder.valid()
  .withTitle("Test Card")
  .inList("list-123")
  .createdBy(user.id)
  .assignedTo(user.id)
  .withDueDate(new Date("2024-12-31"))
  .build();

// BoardMember factory functions
const member = createBoardMember({ userId: "user-123", role: "ADMIN" });
const owner = createOwnerMember("owner-123");
const admin = createAdminMember("admin-123");
const regularMember = createRegularMember("member-123");
const viewer = createViewerMember("viewer-123");

// Cognito user creation
const cognitoUser = UserBuilder.valid()
  .withCognitoSub("cognito-abc-123")
  .buildCognito();
```

### Test Helpers

Implemented test utilities:

```typescript
import { 
  mockDate, 
  cleanDatabase, 
  UUID_REGEX, 
  DEFAULT_TEST_DATE,
  DEFAULT_PROPS 
} from "@/test/utils/testHelpers";

describe("Entity Test", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    // Mock consistent date for testing
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    // Restore original Date implementation
    restoreDate();
  });

  test("should generate valid UUID", () => {
    const entity = SomeEntity.create(DEFAULT_PROPS.ENTITY);
    expect(entity.id).toMatch(UUID_REGEX);
  });
});

// Database cleanup (handled automatically in setup.ts)
await cleanDatabase(prismaTest);
```

### Mock Authentication

Authentication mocks for API tests:

```typescript
import { mockAuthMiddleware, createMockAuthToken } from "@/test/utils/mockAuth";

describe("API Tests", () => {
  beforeEach(() => {
    // Apply mock auth to all routes
    app.use("*", mockAuthMiddleware);
  });

  test("should authenticate with test token", async () => {
    const response = await app.request("/protected-route", {
      headers: {
        Authorization: "Bearer test-token", // Default test user
      },
    });
    expect(response.status).toBe(200);
  });

  test("should authenticate specific user", async () => {
    const user = await prismaTest.user.create({
      data: { cognitoSub: "custom-cognito-id", /* ... */ },
    });

    const token = createMockAuthToken("custom-cognito-id");
    const response = await app.request("/user-specific-route", {
      headers: {
        Authorization: token,
      },
    });
    expect(response.status).toBe(200);
  });
});
```

### Test Container & Dependency Injection

DI container setup for tests:

```typescript
import { initTestContainer, createMockRepositories } from "@/test/utils/testContainer";

// Integration tests with real repositories
const container = initTestContainer();
app.route("/boards", createBoardRoutes(container.boardController, container.listController));

// Unit tests with mock repositories
const mockRepos = createMockRepositories();
const useCase = new SomeUseCase(mockRepos.boardRepository, mockRepos.userRepository);
```

## Test Implementation Progress

### Domain Layer Status

**Entity Tests** (7/7 implemented):
```bash
src/domain/__tests__/entities/
├── User.test.ts           # ✅ Implemented
├── Board.test.ts          # ✅ Implemented
├── List.test.ts           # ✅ Implemented
├── Card.test.ts           # ✅ Implemented
├── Label.test.ts          # ✅ Implemented
├── Activity.test.ts       # ✅ Implemented
└── BoardMember.test.ts    # ✅ Implemented
```

Note: Checklist, ChecklistItem, Attachment, and Comment entities are not yet implemented in the codebase.

**Use Case Tests** (29/35 implemented):

Implemented:
- ✅ All Board operations (5/5)
- ✅ All Card operations (11/11) 
- ✅ All List operations (6/6)
- ✅ All BoardMember operations (3/3)
- ✅ All Label operations (4/4)

Missing (6 use cases):
```bash
src/domain/__tests__/usecases/
└── user/
    ├── GetUserBoards.test.ts      # 🔄 To be created
    ├── GetUserProfile.test.ts     # 🔄 To be created
    ├── UpdateUserProfile.test.ts  # 🔄 To be created
    ├── LogoutUser.test.ts         # 🔄 To be created
    ├── SyncCognitoUser.test.ts    # ⚠️ Partial coverage (16.67%)
    └── VerifyCognitoToken.test.ts # ⚠️ Partial coverage (33.33%)
```

### Infrastructure Layer Status

**Repository Tests** (1/6 implemented):
```bash
src/infrastructure/__tests__/repositories/
├── PrismaBoardRepository.test.ts     # ✅ Implemented (92.31% coverage)
├── PrismaUserRepository.test.ts      # 🔄 To be created
├── PrismaCardRepository.test.ts      # 🔄 To be created
├── PrismaListRepository.test.ts      # 🔄 To be created
├── PrismaLabelRepository.test.ts     # 🔄 To be created
└── PrismaActivityRepository.test.ts  # 🔄 To be created
```

### Application Layer Status

**Controller Tests** (0/5 implemented):
```bash
src/application/__tests__/controllers/
├── AuthController.test.ts    # 🔄 To be created
├── BoardController.test.ts   # 🔄 To be created
├── CardController.test.ts    # 🔄 To be created
├── ListController.test.ts    # 🔄 To be created
└── LabelController.test.ts   # 🔄 To be created
```

**Validator Tests** (1/6 implemented):
```bash
src/application/__tests__/validators/
├── BoardValidator.test.ts   # ✅ Implemented
├── AuthValidator.test.ts    # 🔄 To be created
├── CardValidator.test.ts    # 🔄 To be created
├── ListValidator.test.ts    # 🔄 To be created
├── LabelValidator.test.ts   # 🔄 To be created
└── UserValidator.test.ts    # 🔄 To be created
```

### Interface Layer Status

**Route Tests** (2/10 implemented):
```bash
src/interfaces/__tests__/routes/
├── boardRoutes.test.ts              # ✅ Implemented
├── boardRoutes.integration.test.ts  # ✅ Implemented
├── authRoutes.test.ts               # 🔄 To be created
├── authRoutes.integration.test.ts   # 🔄 To be created
├── cardRoutes.test.ts               # 🔄 To be created
├── cardRoutes.integration.test.ts   # 🔄 To be created
├── listRoutes.test.ts               # 🔄 To be created
├── listRoutes.integration.test.ts   # 🔄 To be created
├── labelRoutes.test.ts              # 🔄 To be created
└── labelRoutes.integration.test.ts  # 🔄 To be created
```

### Recommended Test Implementation Order

Based on risk assessment and current gaps:

1. **Critical: Application Controllers** (0% coverage)
   - Start with AuthController for security
   - Follow with BoardController as reference implementation exists
   - Test request/response handling and error cases

2. **High Priority: Authentication UseCases** 
   - Complete VerifyCognitoToken tests
   - Implement GetUserProfile and UpdateUserProfile tests
   - These are critical for security

3. **Medium Priority: Infrastructure Repositories**
   - PrismaUserRepository (authentication flow)
   - PrismaCardRepository (core functionality)
   - Follow PrismaBoardRepository patterns

4. **Medium Priority: Validators**
   - AuthValidator (security critical)
   - CardValidator and ListValidator (data integrity)
   - Reference BoardValidator implementation

5. **Lower Priority: Interface Routes**
   - Complete route tests following boardRoutes patterns
   - Include both unit and integration tests

### Test Coverage Goals

Current vs Target:
- **Domain Layer**: 82.9% → 95%+ (Add auth use cases)
- **Application Layer**: 16.7% → 85%+ (Critical gap to fill)
- **Infrastructure Layer**: 16.7% → 80%+ (Data integrity)
- **Interface Layer**: 33.3% → 75%+ (API coverage)
- **Overall**: 43.5% → 80%+ (Production readiness)

## Best Practices

Best practices adopted in the current implementation:

### 1. Builder Pattern for Test Data
```typescript
// ✅ Good - Fluent, readable, maintainable
const card = CardBuilder.valid()
  .withTitle("Test Card")
  .inList("list-123")
  .assignedTo("user-456")
  .build();

// ❌ Avoid - Hard to read and maintain
const card = new Card("id", "Test Card", "list-123", 1000, false, "user-456");
```

### 2. Test Isolation & Database Management
```typescript
// ✅ Automatic cleanup in setup.ts handles isolation
beforeEach(async () => {
  // Fresh state for each test - handled automatically
});

// ✅ Use separate test database
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kanban_test";
```

### 3. Date Mocking for Consistency
```typescript
// ✅ Mock dates for deterministic tests
beforeEach(() => {
  restoreDate = mockDate(DEFAULT_TEST_DATE);
});

afterEach(() => {
  restoreDate(); // Always restore
});
```

### 4. Comprehensive Entity Testing
```typescript
// ✅ Test all entity methods and edge cases
describe("Card Entity", () => {
  describe("Card creation", () => { /* creation tests */ });
  describe("Card updates", () => { /* update tests */ });
  describe("Card assignment", () => { /* assignment tests */ });
  describe("Card validation", () => { /* business rule tests */ });
  describe("Card serialization", () => { /* JSON tests */ });
});
```

### 5. Mock vs Real Dependencies
```typescript
// ✅ Unit tests - Mock external dependencies
const mockRepository = {
  save: mock(() => Promise.resolve()),
  findById: mock(() => Promise.resolve(entity)),
};

// ✅ Integration tests - Use real database
const repository = new PrismaBoardRepository(prismaTest);
```

### 6. Error Testing Patterns
```typescript
// ✅ Test error conditions explicitly
test("should throw error if owner not found", async () => {
  mockUserRepository.findById = mock(() => Promise.resolve(null));
  
  expect(useCase.execute(request)).rejects.toThrow("Owner not found");
});

// ✅ Test validation errors with specific messages
expect(result.errors).toContainEqual(
  expect.objectContaining({
    field: "title",
    message: "title must be no more than 255 characters",
  })
);
```

### 7. API Testing Patterns
```typescript
// ✅ Test both positive and negative cases
test("should create resource successfully", async () => {
  const response = await app.request("/resource", {
    method: "POST",
    headers: { Authorization: "Bearer test-token" },
    body: JSON.stringify(validData),
  });
  
  expect(response.status).toBe(201);
  // Verify in database
  const created = await prismaTest.resource.findUnique({ where: { id: data.id } });
  expect(created).toBeDefined();
});

test("should return 403 if unauthorized", async () => {
  const response = await app.request("/resource", {
    method: "POST",
    // Missing authorization header
    body: JSON.stringify(validData),
  });
  
  expect(response.status).toBe(403);
});
```

### 8. Test Organization
```typescript
// ✅ Group related tests logically
describe("Board Entity", () => {
  describe("Board creation", () => { 
    test("generates unique UUID", () => {});
    test("sets default values", () => {});
  });
  
  describe("Board permissions", () => {
    test("allows owner to edit", () => {});
    test("denies non-member access", () => {});
  });
});
```

### 9. Descriptive Test Names
```typescript
// ✅ Clear, specific test names
test("should update card position when moved to different list")
test("should return 403 if user is not owner or admin")
test("should trim whitespace from title and description")

// ❌ Vague test names
test("should work")
test("test update")
test("error case")
```

### 10. Domain-Driven Validation
```typescript
// ✅ Domain entities allow invalid data (validation at app layer)
test("should allow empty title (validation at application layer)", () => {
  const card = Card.create({ title: "", /* other props */ });
  expect(card.title).toBe("");
});

// ✅ Application layer enforces business rules
test("should fail if title is empty", () => {
  const result = CardValidator.validateCreateCard({ title: "" });
  expect(result.success).toBe(false);
});
```

### 11. Test Coverage Guidelines

- **100% Entity Methods**: Test all public methods
- **Edge Cases**: Boundary values, null/undefined, empty strings
- **Error Paths**: Exceptional situations and error handling
- **Integration Points**: Interactions between multiple components
- **Business Rules**: Domain rules and validation

### 12. Performance Considerations

```typescript
// ✅ Parallel test execution safe (isolated data)
// ✅ Efficient database setup (transaction rollback)
// ✅ Minimal data creation (only what's needed for test)

beforeEach(async () => {
  // Create only necessary test data
  testUser = await prismaTest.user.create({
    data: { /* minimal required fields */ },
  });
});
```

## Coverage Reports

After running tests with coverage, you can view the detailed report:

```bash
bun run test:coverage
```

Coverage results will be displayed in the terminal and saved to `coverage/` directory.

## Debugging Tests

To debug tests in Bun:

```bash
# Run specific test file
bun test src/domain/__tests__/usecases/CreateBoard.test.ts

# Run tests matching pattern
bun test -t "should create a board"

# Enable verbose output
DEBUG=* bun test
```

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Setup Database
  run: |
    createdb kanban_test
    bun run db:test:setup

- name: Run Tests
  run: bun run test:coverage
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/kanban_test
```

## Common Issues

### Test Database Connection Failed

Ensure PostgreSQL is running and the test database exists:
```bash
createdb kanban_test
```

### Tests Failing Due to Timezone

Use `mockDate()` helper to ensure consistent dates in tests.

### Prisma Client Issues

Regenerate Prisma client if you see type errors:
```bash
bun run db:generate
```

## Summary

The backend test implementation shows a **partially adequate** test coverage with significant strengths and critical gaps:

### Current State Assessment

- **Strong Foundation**: Domain layer tests are well-implemented with good patterns
- **Critical Risk**: Zero test coverage for API controllers poses security and reliability risks
- **Infrastructure Gaps**: Limited repository testing could lead to data integrity issues
- **Authentication Concerns**: Incomplete auth-related tests are a security vulnerability

### Production Readiness

The current test implementation is **NOT production-ready** due to:

1. Missing controller tests (API contract validation)
2. Incomplete authentication test coverage
3. Limited infrastructure layer testing
4. No E2E test suite

### Immediate Actions Required

1. Implement Application Controller tests (especially AuthController)
2. Complete authentication-related use case tests
3. Add infrastructure repository tests for User and Card entities
4. Establish minimum 80% overall coverage target

### Long-term Goals

- Achieve 80%+ overall test coverage
- Implement comprehensive E2E test suite
- Add performance and load testing
- Establish CI/CD pipeline with test gates

The test infrastructure and patterns are solid, but significant work remains to achieve production-quality test coverage.

## Quick Reference

For detailed test implementation status, see the **"Current Test Implementation Status"** section at the beginning of this document.

### What's Implemented

- **Domain Layer**: 7/7 entities, 29/35 use cases (82.9% coverage)
- **Application Layer**: 1/6 validators, 0/5 controllers (16.7% coverage)
- **Infrastructure Layer**: 1/6 repositories (16.7% coverage)
- **Interface Layer**: 2/10 route files (33.3% coverage)

### What's Missing (Priority Order)

1. **Critical**: All controller tests (0% coverage)
2. **High**: Authentication use cases (6 missing)
3. **Medium**: Repository tests (5 missing)
4. **Medium**: Validator tests (5 missing)
5. **Low**: Route tests (8 missing)
