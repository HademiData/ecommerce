import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.includes('ecommerce_orders_test')) {
  throw new Error(
    'Safety check failed: DATABASE_URL must target ecommerce_orders_test',
  );
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

describe('Order database integration', () => {
  let orderId: string | undefined;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.order.deleteMany({
        where: { id: orderId },
      });
    }

    await prisma.$disconnect();
  });

  it('persists an order and its items in MySQL', async () => {
    const order = await prisma.order.create({
      data: {
        userId: 'integration-test-user',
        totalAmount: '50000.00',
        status: 'PENDING',
        items: {
          create: [
            {
              productId: 'integration-test-product',
              name: 'Integration Test Keyboard',
              quantity: 2,
              unitPrice: '25000.00',
            },
          ],
        },
      },
      include: { items: true },
    });

    orderId = order.id;

    expect(order.id).toBeTruthy();
    expect(order.status).toBe('PENDING');
    expect(Number(order.totalAmount)).toBe(50000);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      productId: 'integration-test-product',
      name: 'Integration Test Keyboard',
      quantity: 2,
    });
    expect(Number(order.items[0].unitPrice)).toBe(25000);

    const savedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    expect(savedOrder?.items).toHaveLength(1);
    expect(savedOrder?.userId).toBe('integration-test-user');
  });

  it('enforces the foreign key from order items to orders', async () => {
    await expect(
      prisma.orderItem.create({
        data: {
          orderId: 'nonexistent-integration-order',
          productId: 'integration-test-product',
          name: 'Orphan Item',
          quantity: 1,
          unitPrice: '100.00',
        },
      }),
    ).rejects.toThrow();
  });
});
