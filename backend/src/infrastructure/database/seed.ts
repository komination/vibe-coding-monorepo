import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users (Cognito-authenticated)
  const user1 = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      username: 'demo_user',
      cognitoSub: 'demo-cognito-sub-123',
      name: 'Demo User',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'john_doe',
      cognitoSub: 'john-cognito-sub-456',
      name: 'John Doe',
      isActive: true,
    },
  });

  // Create a demo board
  const board = await prisma.board.create({
    data: {
      title: 'プロジェクト管理',
      description: 'チームのタスクとプロジェクトを管理するボード',
      ownerId: user1.id,
      members: {
        create: [
          {
            userId: user1.id,
            role: 'OWNER',
          },
          {
            userId: user2.id,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  // Create lists
  const todoList = await prisma.list.create({
    data: {
      title: 'To Do',
      position: 0,
      boardId: board.id,
      color: '#e3e3e3',
    },
  });

  const inProgressList = await prisma.list.create({
    data: {
      title: 'In Progress',
      position: 1,
      boardId: board.id,
      color: '#3498db',
    },
  });

  const doneList = await prisma.list.create({
    data: {
      title: 'Done',
      position: 2,
      boardId: board.id,
      color: '#2ecc71',
    },
  });

  // Create labels
  const urgentLabel = await prisma.label.create({
    data: {
      name: '緊急',
      color: '#e74c3c',
      boardId: board.id,
    },
  });

  const bugLabel = await prisma.label.create({
    data: {
      name: 'バグ',
      color: '#f39c12',
      boardId: board.id,
    },
  });

  const featureLabel = await prisma.label.create({
    data: {
      name: '新機能',
      color: '#9b59b6',
      boardId: board.id,
    },
  });

  // Create sample cards
  const card1 = await prisma.card.create({
    data: {
      title: 'ユーザー認証機能の実装',
      description: 'JWTを使用したユーザー認証システムを実装する',
      position: 0,
      listId: inProgressList.id,
      creatorId: user1.id,
      assigneeId: user2.id,
      labels: {
        create: [
          { labelId: featureLabel.id },
        ],
      },
    },
  });

  const card2 = await prisma.card.create({
    data: {
      title: 'データベース設計',
      description: 'カンバンアプリケーションのためのデータベーススキーマを設計',
      position: 0,
      listId: doneList.id,
      creatorId: user1.id,
    },
  });

  const card3 = await prisma.card.create({
    data: {
      title: 'フロントエンドUIの修正',
      description: 'レスポンシブデザインの問題を修正',
      position: 0,
      listId: todoList.id,
      creatorId: user2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      labels: {
        create: [
          { labelId: bugLabel.id },
          { labelId: urgentLabel.id },
        ],
      },
    },
  });

  // Add a comment
  await prisma.comment.create({
    data: {
      content: 'このタスクは来週までに完了する必要があります',
      cardId: card3.id,
      userId: user1.id,
    },
  });

  // Add a checklist
  const checklist = await prisma.checklist.create({
    data: {
      title: '実装タスク',
      position: 0,
      cardId: card1.id,
      items: {
        create: [
          {
            content: 'JWTライブラリの調査',
            position: 0,
            isCompleted: true,
            completedAt: new Date(),
          },
          {
            content: '認証ミドルウェアの実装',
            position: 1,
            isCompleted: false,
          },
          {
            content: 'ユニットテストの作成',
            position: 2,
            isCompleted: false,
          },
        ],
      },
    },
  });

  // Add activity logs
  await prisma.activity.createMany({
    data: [
      {
        action: 'CREATE',
        entityType: 'BOARD',
        entityId: board.id,
        entityTitle: board.title,
        userId: user1.id,
        boardId: board.id,
      },
      {
        action: 'CREATE',
        entityType: 'CARD',
        entityId: card1.id,
        entityTitle: card1.title,
        userId: user1.id,
        boardId: board.id,
        cardId: card1.id,
      },
      {
        action: 'ASSIGN',
        entityType: 'CARD',
        entityId: card1.id,
        entityTitle: card1.title,
        userId: user1.id,
        boardId: board.id,
        cardId: card1.id,
        data: JSON.stringify({ assigneeId: user2.id }),
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
  Created:
  - 2 users
  - 1 board
  - 3 lists
  - 3 labels
  - 3 cards
  - 1 comment
  - 1 checklist with 3 items
  - 3 activity logs
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });