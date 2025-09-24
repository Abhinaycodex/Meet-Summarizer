import { Kafka } from 'kafkajs';
import Summary from '../models/summary.js';
import aiService from '../services/aiService.js';
import fileParser from '../utils/fileParser.js';
import logger from '../utils/logger.js';

const e = require('express');

class QueueConsumer {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'file-processing-client', // Custom client ID
      brokers: [process.env.KAFKA_BROKER_URL] // Kafka broker URL from environment variables
    });
    this.consumer = this.kafka.consumer({ groupId: 'file-processing-group' });
  }

  // Start consuming from Kafka topic
  async start() {
    try {
      // Connect to the Kafka consumer
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'file-processing', fromBeginning: true });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            await this.processFile(data);
          } catch (error) {
            logger.error('Message processing error:', error);
          }
        }
      });

      logger.info('Kafka consumer started and listening to the topic: file-processing');
    } catch (error) {
      logger.error('Consumer start error:', error);
    }
  }

  // Process the file after receiving the message
  async processFile(data) {
    const { summaryId, file } = data;

    try {
      // Update status to processing
      await Summary.findByIdAndUpdate(summaryId, {
        processingStatus: 'processing'
      });

      // Parse file content
      const parsedContent = await fileParser.parseFile(file);
      let text = parsedContent.text;

      // If it's an audio file, transcribe it first
      if (file.mimetype.startsWith('audio/')) {
        const transcription = await aiService.transcribeAudio(file.buffer);
        text = transcription.text;
      }

      // Generate summary using AI
      const aiResult = await aiService.generateSummary(text);

      // Update summary with results
      await Summary.findByIdAndUpdate(summaryId, {
        originalText: text,
        summary: aiResult.summary,
        keyPoints: aiResult.keyPoints,
        actionItems: aiResult.actionItems,
        processingStatus: 'completed',
        metadata: {
          wordCount: text.split(' ').length,
          confidence: aiResult.confidence,
          ...(parsedContent.duration && { duration: parsedContent.duration })
        }
      });

      logger.info(`File processing completed for summary: ${summaryId}`);
    } catch (error) {
      logger.error(`File processing failed for summary: ${summaryId}`, error);

      // Update status to failed
      await Summary.findByIdAndUpdate(summaryId, {
        processingStatus: 'failed'
      });
    }
  }
}

export default QueueConsumer;