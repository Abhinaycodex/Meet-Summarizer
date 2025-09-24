import { Kafka } from 'kafkajs';
import logger from '../utils/logger.js';

let kafka;
let producer;

const connectKafka = async () => {
  try {
    kafka = new Kafka({
      clientId: 'file-processing-client',
      brokers: [process.env.KAFKA_BROKER_URL]
    });

    producer = kafka.producer();
    await producer.connect();

    logger.info('Kafka connected successfully');
  } catch (error) {
    logger.error('Kafka connection error:', error);
  }
};

const publishToKafka = async (topic, data) => {
  try {
    if (!producer) {
      await connectKafka();
    }

    const message = JSON.stringify(data);

    await producer.send({
      topic,
      messages: [{ value: message }]
    });

    logger.info(`Message published to Kafka topic: ${topic}`);
  } catch (error) {
    logger.error('Kafka publish error:', error);
    throw error;
  }
};

export { connectKafka, publishToKafka };
