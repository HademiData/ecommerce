import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import amqp, { type ConfirmChannel, type ChannelModel } from 'amqplib';

const rabbitUrl = process.env.RABBITMQ_URL;

if (!rabbitUrl) {
  throw new Error('RABBITMQ_URL must be configured for integration tests');
}

const queue = 'ecommerce.integration.test';
let connection: ChannelModel | undefined;
let channel: ConfirmChannel | undefined;

beforeAll(async () => {
  connection = await amqp.connect(rabbitUrl);
  channel = await connection.createConfirmChannel();

  await channel.assertQueue(queue, {
    durable: false,
    exclusive: true,
    autoDelete: true,
  });
}, 10000);

afterAll(async () => {
  if (channel) {
    await channel.close().catch(() => undefined);
  }

  if (connection) {
    await connection.close().catch(() => undefined);
  }
}, 10000);

describe('RabbitMQ integration', () => {
  it('publishes a message and reads it back', async () => {
    if (!channel) throw new Error('RabbitMQ channel was not initialized');

    const payload = {
      testId: 'rabbitmq-integration-1',
      event: 'integration.test',
    };

    await new Promise<void>((resolve, reject) => {
      channel!.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(payload)),
        { contentType: 'application/json' },
        (error) => (error ? reject(error) : resolve()),
      );
    });

    await channel.waitForConfirms();

    const message = await channel.get(queue, { noAck: true });

    expect(message).not.toBe(false);
    expect(JSON.parse(message!.content.toString())).toEqual(payload);
  }, 10000);
});
