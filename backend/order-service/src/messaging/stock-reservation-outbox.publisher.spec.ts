import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StockReservationOutboxPublisher } from './stock-reservation-outbox.publisher.js';

describe('StockReservationOutboxPublisher', () => {
  const event = {
    id: 'event-1',
    topic: 'stock.reserve',
    payload: {
      orderId: 'order-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    },
  };
  const database = {
    outboxEvent: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  const channel = { sendToQueue: vi.fn() };
  const rabbitMQ = { getChannel: vi.fn(() => channel) };
  let publisher: StockReservationOutboxPublisher;

  beforeEach(() => {
    vi.clearAllMocks();
    database.outboxEvent.findMany.mockResolvedValue([event]);
    channel.sendToQueue.mockImplementation(
      (_queue, _message, _options, callback) => callback(null),
    );
    publisher = new StockReservationOutboxPublisher(
      database as never,
      rabbitMQ as never,
    );
  });

  it('publishes pending events and marks them delivered', async () => {
    await publisher.publishPending();

    expect(channel.sendToQueue).toHaveBeenCalledWith(
      'stock.reserve',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        contentType: 'application/json',
      }),
      expect.any(Function),
    );
    expect(database.outboxEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event-1', publishedAt: null },
        data: { publishedAt: expect.any(Date) },
      }),
    );
  });

  it('leaves a failed event pending so it can be retried', async () => {
    channel.sendToQueue.mockImplementation(
      (_queue, _message, _options, callback) =>
        callback(new Error('RabbitMQ unavailable')),
    );

    await publisher.publishPending();

    expect(database.outboxEvent.updateMany).not.toHaveBeenCalled();
  });
});
