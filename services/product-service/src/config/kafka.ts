import { Kafka, logLevel, type Producer } from "kafkajs";
import { env } from "./env.js";
import { logger } from "./logger.js";
import fs from "node:fs";
import path from "node:path";

let producer: Producer | undefined;
const caPath = path.resolve(process.cwd(), env.KAFKA_CA_PATH);

export function getKafkaProducer(): Producer {
  if (producer) return producer;

  const brokers = env.KAFKA_BROKERS.split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);
  if (brokers.length === 0) throw new Error("KAFKA_BROKERS must contain at least one host:port");

  const kafka = new Kafka({
    clientId: env.KAFKA_CLIENT_ID,
    brokers,
    ssl: {
      ca: [fs.readFileSync(caPath, "utf8")],
      rejectUnauthorized: true,
    },
    sasl: {
      mechanism: "scram-sha-256",
      username: env.KAFKA_USERNAME,
      password: env.KAFKA_PASSWORD,
    },
    logLevel: logLevel.NOTHING,
    retry: { retries: 5 },
  });

  producer = kafka.producer({ allowAutoTopicCreation: false });
  return producer;
}

export async function connectKafkaProducer(): Promise<void> {
  await getKafkaProducer().connect();
  logger.info("Connected to Aiven Apache Kafka");
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (!producer) return;
  try {
    await producer.disconnect();
    logger.info("Disconnected from Aiven Apache Kafka");
  } finally {
    producer = undefined;
  }
}
