import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { getKafkaProducer } from "../config/kafka.js";
import { logger } from "../config/logger.js";

export type ProductEventType = "product.created" | "product.updated";

export interface ProductEvent {
  eventId: string;
  eventType: ProductEventType;
  occurredAt: string;
  productId: string;
  data: {
    name: string;
    price: string;
    currency: string;
    category: string;
  };
}

/**
 * Publishes an event to Kafka.
 *
 * This starter logs and returns false on failure so a Kafka outage does not
 * turn a successful PostgreSQL write into a failed HTTP request. This can
 * lose events; use a transactional outbox before relying on events for
 * critical downstream workflows.
 */
export async function publishProductEvent(
  eventType: ProductEventType,
  product: {
    id: string;
    name: string;
    price: { toString(): string } | string | number;
    currency: string;
    category: string;
  },
): Promise<boolean> {
  if (env.KAFKA_ENABLED !== true) {
    logger.debug({ eventType, productId: product.id }, "Kafka publishing disabled");
    return false;
  }

  try {
    const producer = await getKafkaProducer();
    const event: ProductEvent = {
      eventId: randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      productId: product.id,
      data: {
        name: product.name,
        price: String(product.price),
        currency: product.currency,
        category: product.category,
      },
    };

    await producer.send({
      topic: env.KAFKA_PRODUCT_TOPIC,
      acks: -1,
      messages: [
        {
          key: product.id,
          value: JSON.stringify(event),
          headers: {
            eventType,
            eventId: event.eventId,
          },
        },
      ],
    });

    logger.info(
      { eventId: event.eventId, eventType, productId: product.id },
      "Product event published",
    );
    return true;
  } catch (error) {
    logger.error(
      { err: error, eventType, productId: product.id },
      "Failed to publish product event",
    );
    return false;
  }
}
