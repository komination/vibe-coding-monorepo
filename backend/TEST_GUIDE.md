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

### Unit Tests

Unit tests focus on testing individual components in isolation:

```typescript
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateBoardUseCase } from "@/domain/usecases/CreateBoard";

describe("CreateBoardUseCase", () => {
  let useCase: CreateBoardUseCase;
  let mockBoardRepository: BoardRepository;

  beforeEach(() => {
    // Create mocks
    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      // ... other methods
    };

    useCase = new CreateBoardUseCase(mockBoardRepository);
  });

  test("should create a board successfully", async () => {
    const request = {
      title: "Test Board",
      ownerId: "user-123",
    };

    const result = await useCase.execute(request);

    expect(result.board.title).toBe("Test Board");
    expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Integration tests verify that components work together correctly:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { PrismaBoardRepository } from "@/infrastructure/repositories/PrismaBoardRepository";
import { prismaTest } from "@/test/setup";

describe("PrismaBoardRepository", () => {
  let repository: PrismaBoardRepository;

  beforeEach(async () => {
    repository = new PrismaBoardRepository(prismaTest);
  });

  test("should save a board to database", async () => {
    const board = Board.create({
      title: "Test Board",
      ownerId: testUser.id,
    });

    await repository.save(board);

    const savedBoard = await prismaTest.board.findUnique({
      where: { id: board.id },
    });

    expect(savedBoard).toBeDefined();
  });
});
```

### API Tests

API tests verify HTTP endpoints:

```typescript
import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { boardRoutes } from "@/interfaces/http/routes/boardRoutes";

describe("Board Routes", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/boards", boardRoutes);
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
      }),
    });

    expect(response.status).toBe(201);
  });
});
```

## Test Utilities

### Entity Factories

Use factories to create test data:

```typescript
import { createMockUser, createMockBoard } from "@/test/fixtures/entityFactories";

const user = createMockUser({
  name: "John Doe",
  email: "john@example.com",
});

const board = createMockBoard({
  title: "Test Board",
  ownerId: user.id,
});
```

### Test Helpers

Common test utilities:

```typescript
import { createTestContext, cleanDatabase, mockDate } from "@/test/utils/testHelpers";

// Mock current date
const restoreDate = mockDate(new Date("2024-01-01"));
// ... run tests
restoreDate(); // Restore original Date

// Clean database between tests
await cleanDatabase(prisma);
```

### Mock Authentication

For testing authenticated endpoints:

```typescript
import { mockAuthMiddleware, createMockAuthToken } from "@/test/utils/mockAuth";

// Use mock auth middleware in tests
app.use("*", mockAuthMiddleware);

// Create auth token for specific user
const token = createMockAuthToken("user-cognito-id");
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Database Cleanup**: Tests automatically clean up data after each test
3. **Mock External Services**: Use mocks for AWS Cognito and other external services
4. **Test Coverage**: Aim for at least 80% code coverage
5. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
6. **Arrange-Act-Assert**: Follow the AAA pattern in your tests
7. **Test Business Logic**: Focus on testing business rules and edge cases

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

### ドメイン層

#### エンティティ (104テスト実装済み)

- **User** (22テスト) - 全メソッドのテスト実装済み
  - `create`: 新規ユーザー作成、UUID生成、最小プロパティでの作成
  - `createCognitoUser`: Cognito統合ユーザー作成、デフォルトアクティブステータス
  - `fromPersistence`: 永続化データからの復元
  - `updateProfile`: プロファイル更新、名前とアバターの個別更新
  - `activate`/`deactivate`: アクティベーション状態の切り替え
  - `updateCognito`: Cognito Sub更新（新しいインスタンス生成）
  - `toJSON`: シリアライゼーション
  - ビジネスルール: 空メール、無効なメール形式、長い名前、無効なURL

- **Board** (26テスト) - 全メソッドのテスト実装済み
  - `create`: 新規ボード作成、UUID生成、最小プロパティでの作成
  - `fromPersistence`: 永続化データからの復元
  - 更新メソッド: `updateTitle`、`updateDescription`、`updateBackground`
  - 公開設定: `makePublic`/`makePrivate`
  - アーカイブ: `archive`/`unarchive`
  - 所有権: `isOwner`/`isOwnedBy`
  - 権限チェック: `canBeEditedBy`（オーナー/アドミンのみ）、`canBeViewedBy`（公開ボード/メンバー）
  - ビジネスルール: 空タイトル、長いタイトル/説明、無効なURL

- **List** (27テスト) - 全メソッドのテスト実装済み
  - `create`: 新規リスト作成、色指定なし、ゼロ/負のポジション
  - `fromPersistence`: 永続化データからの復元
  - `updateTitle`: タイトル更新、空タイトル許可
  - `updateColor`: 色更新、色のクリア、初期色なしからの設定
  - `updatePosition`: ポジション更新、ゼロ/負/大きな値の処理
  - `belongsToBoard`: ボード所属確認
  - `toJSON`: シリアライゼーション
  - ビジネスルール: 空タイトル、長いタイトル、無効な色形式、小数ポジション

- **Card** (29テスト) - 全メソッドのテスト実装済み
  - `create`: 新規カード作成、最小プロパティでの作成
  - `fromPersistence`: 永続化データからの復元
  - 更新メソッド: `updateTitle`、`updateDescription`、`updatePosition`、`updateDueDate`、`updateStartDate`、`updateCover`
  - `moveToList`: リスト間移動、同一リスト内移動
  - `assignTo`: ユーザー割り当て、割り当て解除、再割り当て
  - アーカイブ: `archive`/`unarchive`
  - 関連確認: `belongsToList`、`isCreatedBy`、`isAssignedTo`
  - `isOverdue`: 期限切れ判定（過去日付、未来日付、期限なし、現在時刻）
  - ビジネスルール: 空タイトル、長いタイトル/説明、無効なカバーURL、負/小数ポジション、無効な日付範囲

### その他実装済みのテスト

- **Board Use Case** (CreateBoard.test.ts) - 基本的なユースケーステスト
- **Board Validator** (BoardValidator.test.ts) - バリデーションロジック
- **Board Routes** (boardRoutes.test.ts, boardRoutes.integration.test.ts) - APIエンドポイント
- **Prisma Board Repository** (PrismaBoardRepository.test.ts) - データベース統合テスト
