# Backend Testing Guide

This guide explains the test infrastructure setup for the Kanban backend application.

## Test Framework

The backend uses **Bun's built-in test runner**, which is Jest-compatible and requires no additional dependencies. Bun test provides:

- Fast test execution
- Built-in TypeScript support
- Coverage reporting
- Watch mode
- Mocking capabilities

## Test Structure

Tests are organized following the Clean Architecture layers:

```
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

## Writing Tests

### 実装済みテストパターン

現在のコードベースで使用されている実際のテストパターンを参考にしてください。

### Entity Tests (Domain Layer)

エンティティのテストには **Builder Pattern** を使用し、包括的なテストケースを実装:

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

ユースケースはモックリポジトリを使用して依存関係を分離:

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

### Repository Integration Tests

実際のデータベースを使用した統合テスト:

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

ユニットテストと統合テストの両方を実装:

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

詳細なバリデーションロジックのテスト:

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

現在実装されているBuilderパターンを使用してテストデータを作成:

```typescript
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder } from "@/test/fixtures/entityFactories";

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

// Cognito user creation
const cognitoUser = UserBuilder.valid()
  .withCognitoSub("cognito-abc-123")
  .buildCognito();
```

### Test Helpers

実装済みのテストユーティリティ:

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

API테스ト用の認証モック:

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

テスト用のDIコンテナ設定:

```typescript
import { initTestContainer, createMockRepositories } from "@/test/utils/testContainer";

// Integration tests with real repositories
const container = initTestContainer();
app.route("/boards", createBoardRoutes(container.boardController, container.listController));

// Unit tests with mock repositories
const mockRepos = createMockRepositories();
const useCase = new SomeUseCase(mockRepos.boardRepository, mockRepos.userRepository);
```

## 今後の実装ガイドライン

### 優先度 1: ドメイン層の完成

**エンティティテスト** (未実装の7エンティティ):
```bash
src/domain/__tests__/entities/
├── Label.test.ts          # 🔄 作成必要
├── Activity.test.ts       # 🔄 作成必要
├── BoardMember.test.ts    # 🔄 作成必要
├── Checklist.test.ts      # 🔄 作成必要
├── ChecklistItem.test.ts  # 🔄 作成必要
├── Attachment.test.ts     # 🔄 作成必要
└── Comment.test.ts        # 🔄 作成必要
```

**ユースケーステスト** (31個のユースケース):
```bash
src/domain/__tests__/usecases/
├── board/
│   ├── UpdateBoard.test.ts
│   ├── DeleteBoard.test.ts
│   └── GetBoard.test.ts
├── list/
│   ├── CreateList.test.ts
│   ├── UpdateList.test.ts
│   └── DeleteList.test.ts
└── card/
    ├── CreateCard.test.ts
    ├── UpdateCard.test.ts
    └── MoveCard.test.ts
```

### 優先度 2: インフラストラクチャ層

**リポジトリテスト** (5個の未実装リポジトリ):
```bash
src/infrastructure/__tests__/repositories/
├── PrismaUserRepository.test.ts      # 🔄 作成必要
├── PrismaCardRepository.test.ts      # 🔄 作成必要
├── PrismaListRepository.test.ts      # 🔄 作成必要
├── PrismaLabelRepository.test.ts     # 🔄 作成必要
└── PrismaActivityRepository.test.ts  # 🔄 作成必要
```

### 優先度 3: アプリケーション層

**バリデーターテスト**:
```bash
src/application/__tests__/validators/
├── AuthValidator.test.ts    # 🔄 作成必要
├── CardValidator.test.ts    # 🔄 作成必要
├── ListValidator.test.ts    # 🔄 作成必要
└── LabelValidator.test.ts   # 🔄 作成必要
```

### 優先度 4: インターフェース層

**ルートテスト**:
```bash
src/interfaces/__tests__/routes/
├── authRoutes.test.ts       # 🔄 作成必要
├── authRoutes.integration.test.ts
├── cardRoutes.test.ts       # 🔄 作成必要
├── cardRoutes.integration.test.ts
├── listRoutes.test.ts       # 🔄 作成必要
├── listRoutes.integration.test.ts
├── labelRoutes.test.ts      # 🔄 作成必要
└── labelRoutes.integration.test.ts
```

### テスト実装の推奨順序

1. **エンティティファクトリーの拡張** - 未実装エンティティ用のBuilderを追加
2. **ドメインエンティティテスト** - 既存パターンに従って実装
3. **ユースケーステスト** - CreateBoardパターンを参考に実装
4. **リポジトリ統合テスト** - PrismaBoardRepositoryパターンを参考
5. **APIルートテスト** - boardRoutesのパターンを再利用

### テストカバレッジ目標

- **ドメイン層**: 90%以上 (ビジネスロジックの完全テスト)
- **アプリケーション層**: 85%以上 (バリデーション・制御ロジック)
- **インフラ層**: 80%以上 (データアクセス・統合)
- **インターフェース層**: 75%以上 (API仕様・エラーハンドリング)

## Best Practices

現在の実装で採用されているベストプラクティス:

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

- **100% Entity Methods**: 全てのpublicメソッドをテスト
- **Edge Cases**: 境界値、null/undefined、空文字列
- **Error Paths**: 例外的な状況とエラーハンドリング
- **Integration Points**: 複数コンポーネント間の相互作用
- **Business Rules**: ドメインルールとバリデーション

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

## 実装済みテスト

### テストカバレッジ概要

現在の実装状況（2024年6月28日時点）:
- **総テスト数**: 104テスト実装済み
- **ドメイン層**: 40% カバレッジ (4/11 エンティティ完全実装)
- **アプリケーション層**: 20% カバレッジ (1/5 バリデーター実装)
- **インフラ層**: 17% カバレッジ (1/6 リポジトリ実装)
- **インターフェース層**: 17% カバレッジ (1/6 ルートグループ実装)

### ✅ 完全実装済み

#### ドメイン層 - エンティティ (104テスト)

**User Entity** (22テスト) - `/domain/__tests__/entities/User.test.ts`
- ✅ 新規作成: `create`, `createCognitoUser` (UUID生成、プロパティ設定)
- ✅ 永続化復元: `fromPersistence` (完全なデータ復元)
- ✅ プロファイル操作: `updateProfile` (名前・アバター更新)
- ✅ アカウント状態: `activate`/`deactivate` (状態切り替え)
- ✅ Cognito統合: `updateCognito` (新インスタンス生成パターン)
- ✅ シリアライゼーション: `toJSON` (完全なデータ出力)
- ✅ ビジネスルール検証: バリデーション責任分離パターン

**Board Entity** (26テスト) - `/domain/__tests__/entities/Board.test.ts`
- ✅ ボード作成・復元: `create`, `fromPersistence`
- ✅ プロパティ更新: `updateTitle`, `updateDescription`, `updateBackground`
- ✅ 公開設定: `makePublic`/`makePrivate` (可視性制御)
- ✅ アーカイブ: `archive`/`unarchive` (状態管理)
- ✅ 所有権確認: `isOwner`/`isOwnedBy` (アクセス制御)
- ✅ 権限システム: `canBeEditedBy`, `canBeViewedBy` (ロールベース認可)
- ✅ ビジネスルール: ドメイン層での制約なし設計

**List Entity** (27テスト) - `/domain/__tests__/entities/List.test.ts`
- ✅ リスト作成・復元: `create`, `fromPersistence`
- ✅ プロパティ更新: `updateTitle`, `updateColor`, `updatePosition`
- ✅ 位置管理: ゼロ・負数・小数点対応
- ✅ 所属確認: `belongsToBoard` (関連性チェック)
- ✅ シリアライゼーション: 完全なJSONエクスポート

**Card Entity** (29テスト) - `/domain/__tests__/entities/Card.test.ts`
- ✅ カード作成・復元: `create`, `fromPersistence`
- ✅ 基本更新: `updateTitle`, `updateDescription`, `updatePosition`
- ✅ 日付管理: `updateDueDate`, `updateStartDate` (期限・開始日)
- ✅ ビジュアル: `updateCover` (カバー画像)
- ✅ リスト移動: `moveToList` (位置更新込み)
- ✅ 担当者管理: `assignTo` (割り当て・解除・再割り当て)
- ✅ アーカイブ: `archive`/`unarchive`
- ✅ 関連確認: `belongsToList`, `isCreatedBy`, `isAssignedTo`
- ✅ 期限判定: `isOverdue` (現在時刻との比較)

#### ドメイン層 - ユースケース

**CreateBoard Use Case** (CreateBoard.test.ts) - `/domain/__tests__/usecases/CreateBoard.test.ts`
- ✅ 正常フロー: ボード作成、オーナー追加、アクティビティログ
- ✅ 入力値検証: タイトル必須、長さ制限、空白文字のトリム
- ✅ ビジネスルール: オーナー存在確認、アクティブアカウントのみ
- ✅ エラーハンドリング: 詳細なエラーメッセージ
- ✅ リポジトリ連携: モック使用による依存関係テスト

#### アプリケーション層

**BoardValidator** (BoardValidator.test.ts) - `/application/__tests__/validators/BoardValidator.test.ts`
- ✅ 作成バリデーション: `validateCreateBoard` (必須項目、長さ制限、URL検証)
- ✅ 更新バリデーション: `validateUpdateBoard` (部分更新対応)
- ✅ メンバー追加: `validateAddMember` (ユーザーID、ロール検証)
- ✅ メンバー更新: `validateUpdateMember` (ロール変更)
- ✅ エラー処理: 詳細なフィールド別エラーメッセージ

#### インフラストラクチャ層

**PrismaBoardRepository** (PrismaBoardRepository.test.ts) - `/infrastructure/__tests__/repositories/PrismaBoardRepository.test.ts`
- ✅ CRUD操作: `save`, `findById`, `update`, `delete`
- ✅ 検索機能: `findByOwner`, `findByMember` (フィルタリング・ページング)
- ✅ メンバー管理: `addMember`, `removeMember` (ロール設定)
- ✅ データ整合性: 外部キー制約、カスケード削除
- ✅ 実データベース: PostgreSQL統合テスト

#### インターフェース層

**Board Routes** - `/interfaces/__tests__/routes/`
- **ユニットテスト** (boardRoutes.test.ts):
  - ✅ CRUD API: POST, GET, PUT, DELETE `/boards`
  - ✅ 認証・認可: Bearer token, ロールベースアクセス制御
  - ✅ バリデーション: 入力検証、エラーレスポンス
  - ✅ ステータスコード: 適切なHTTPレスポンス

- **統合テスト** (boardRoutes.integration.test.ts):
  - ✅ エンドツーエンド: API→DB→レスポンスの完全フロー
  - ✅ データ永続化: 実データベースでの作成・更新・削除
  - ✅ カスケード処理: ボード削除時の関連データ削除
  - ✅ メンバーシップ: ボードメンバー追加・削除・ロール管理

### ✅ テストインフラストラクチャ (完全実装)

**テストセットアップ** (`/test/setup.ts`):
- ✅ テスト専用データベース設定
- ✅ 自動クリーンアップ (テスト間のデータ分離)
- ✅ Prismaクライアント設定

**テストファクトリー** (`/test/fixtures/entityFactories.ts`):
- ✅ Builderパターン実装 (UserBuilder, BoardBuilder, ListBuilder, CardBuilder)
- ✅ メソッドチェーン対応
- ✅ デフォルト値設定とカスタマイズ可能性

**テストユーティリティ** (`/test/utils/`):
- ✅ 日付モック (`mockDate`) - 一貫したタイムスタンプ
- ✅ 認証モック (`mockAuthMiddleware`) - APIテスト用
- ✅ データクリーンアップ (`cleanDatabase`)
- ✅ DIコンテナ (`testContainer`) - 依存性注入テスト

### 🟡 部分実装・未実装領域

#### ドメイン層 (未実装)
- **エンティティ**: Label, Activity, BoardMember, Checklist, ChecklistItem, Attachment, Comment (7エンティティ)
- **ユースケース**: 31個のユースケース (CreateBoard以外すべて)
  - ボード操作: UpdateBoard, DeleteBoard, GetBoard, etc.
  - リスト操作: CreateList, UpdateList, DeleteList, etc.
  - カード操作: CreateCard, UpdateCard, MoveCard, etc.
  - メンバー管理: AddBoardMember, RemoveBoardMember, etc.

#### アプリケーション層 (未実装)
- **バリデーター**: AuthValidator, CardValidator, ListValidator, LabelValidator (4バリデーター)
- **コントローラー**: ユニットテスト (モック使用)
- **プレゼンター**: データ変換ロジックテスト

#### インフラストラクチャ層 (未実装)
- **リポジトリ**: PrismaUserRepository, PrismaCardRepository, PrismaListRepository, PrismaLabelRepository, PrismaActivityRepository (5リポジトリ)
- **AWS統合**: Cognito統合テスト
- **外部サービス**: サードパーティAPI統合

#### インターフェース層 (未実装)
- **ルート**: authRoutes, cardRoutes, listRoutes, labelRoutes (4ルートグループ)
- **ミドルウェア**: 認証、エラーハンドリング、レート制限
- **DTO**: データ転送オブジェクトのテスト
