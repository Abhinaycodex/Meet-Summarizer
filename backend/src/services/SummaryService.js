import { OpenAI } from 'openai';
import logger from '../utils/logger.js';
import dotenv from "dotenv";
dotenv.config();
import fileParser from '../utils/fileParser.js';
import Summary from '../models/Summary.js';
import fs from 'fs';


class AIService {
  constructor() {
    // Check if OpenAI API key is provided
    console.log("OPENAI KEY:", process.env.OPENAI_API_KEY ? "Loaded ✅" : "Missing ❌");

    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found. AI summarization will use mock responses.');
      this.openai = null;
      this.useMockResponses = true;
    } else {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.useMockResponses = false;
        console.log('OpenAI API initialized successfully');
      } catch (error) {
        console.log('Failed to initialize OpenAI:', error);
        this.openai = null;
        this.useMockResponses = true;
      }
    }
  }

  uploadFile () {
    // You can implement file upload logic here if needed
  }

  async generateSummary(text) {
    try {
      if (!text || !text.trim()) {
        return this.getMockSummary('Empty or missing text provided for summary.');
      }

      // Use mock response if OpenAI is not available
      if (this.useMockResponses || !this.openai) {
        console.log('Using mock AI response - OpenAI API key not configured');
        return this.getMockSummary(text);
      }

      const prompt = this.buildSummaryPrompt(text);

      const response = await this.openai.chat.completions.create({
        // You can switch to a newer model, but gpt-3.5-turbo is fine
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert meeting summarizer. Provide concise, structured summaries with key points and action items.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices?.[0]?.message?.content || '';
      const result = this.parseAIResponse(content);

      return {
        summary: result.summary || '',
        keyPoints: result.keyPoints || [],
        actionItems: result.actionItems || [],
        confidence: 0.85
      };
    } catch (error) {
      console.log('AI service error:', error);
      // Fallback to mock response on error 
      console.log('Falling back to mock response due to AI service error');
      return this.getMockSummary(text);
    }
  }

  getMockSummary(text) {
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const sentences = text ? text.split('.').filter(s => s.trim().length > 0) : [];

    // Generate a simple extractive summary
    const summaryLength = Math.min(3, Math.max(1, Math.floor(sentences.length / 4) || 1));
    const summarySentences = sentences.slice(0, summaryLength);

    return {
      summary: `This meeting covered several important topics. ${summarySentences.join('. ')}.`,
      keyPoints: [
        'Key discussion points were identified',
        'Multiple participants contributed to the conversation',
        'Important decisions were made during the session',
        `Meeting content contained approximately ${wordCount} words`
      ],
      actionItems: [
        {
          task: 'Follow up on discussed items',
          assignee: null,
          deadline: null
        },
        {
          task: 'Review meeting outcomes',
          assignee: null,
          deadline: null
        }
      ],
      confidence: 0.6 // Lower confidence for mock responses
    };
  }

  buildSummaryPrompt(text) {
    return `
Please analyze this meeting transcript/document and provide:

1. A concise summary (2-3 paragraphs)
2. Key points discussed (bullet points)
3. Action items with any mentioned assignees and deadlines

Format your response as JSON with the following structure:
{
  "summary": "Main summary text...",
  "keyPoints": ["Point 1", "Point 2", ...],
  "actionItems": [
    {
      "task": "Task description",
      "assignee": "Person name or null",
      "deadline": "Date or null"
    }
  ]
}

Text to analyze:
${text}
    `;
  }

  parseAIResponse(response) {
    if (!response) {
      return {
        summary: '',
        keyPoints: [],
        actionItems: []
      };
    }

    // Try to strip code fences if model wrapped JSON in ```json ... ```
    const cleaned = response.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (error) {
      console.log('AI response not in pure JSON format, falling back to manual parsing');
      return {
        summary: response.substring(0, 500) + (response.length > 500 ? '...' : ''),
        keyPoints: ['Summary generated from unstructured response'],
        actionItems: []
      };
    }
  }

  /**
   * Transcribe audio using Whisper (or mock if no key)
   * @param {Object} file - Multer file object (disk or memory storage)
   */
  async transcribeAudio(file) {
    try {
      // Use mock response if OpenAI is not available
      if (this.useMockResponses || !this.openai) {
        console.log('Using mock audio transcription - OpenAI API key not configured');

        const approxSeconds = file?.buffer
          ? Math.floor(file.buffer.length / 16000) // very rough guess
          : null;

        return {
          text: `Mock transcription of audio content. ${
            approxSeconds ? `The audio file contained approximately ${approxSeconds} seconds of content. ` : ''
          }This would typically contain meeting discussions, participant introductions, key decisions, and action items that were discussed during the session.`,
          confidence: 0.7
        };
      }

      logger.info('Audio transcription requested - integrating with Whisper API');

      // Handle both memoryStorage (buffer) and diskStorage (path)
      let audioInput;
      if (file.buffer) {
        audioInput = file.buffer;
      } else if (file.path) {
        audioInput = fs.createReadStream(file.path);
      } else {
        throw new Error('No audio buffer or file path available for transcription');
      }

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioInput,
        model: 'whisper-1'
      });

      return {
        text: transcription.text || '',
        confidence: 0.95
      };
    } catch (error) {
      logger.error('Audio transcription error:', error);
      return {
        text: 'Failed to transcribe audio content. Please try again or use a text-based input.',
        confidence: 0.1
      };
    }
  }

  /**
   * Main document processing pipeline:
   *  - Parse file (PDF/DOCX/TXT/etc.)
   *  - If audio, transcribe
   *  - Summarize with OpenAI
   *  - Save Summary document
   */
  async processDocument({ file, userId, title, participants }) {
    try {
      if (!file) throw new Error('No file provided');

      
      const parsed = await fileParser.parseFile(file);

      // If file is audio, use transcription flow
      let originalText = parsed?.text || '';
      let duration = parsed?.duration || null;

      const mimeType = file.mimetype || '';

      if (mimeType.startsWith('audio/')) {
        const transcriptionResult = await this.transcribeAudio(file);
        if (transcriptionResult) {
          originalText = transcriptionResult.text || originalText;
          duration = transcriptionResult.duration || duration || null;
        }
      }

      // Generate AI summary
      const aiResult = await this.generateSummary(originalText);

      // Normalize participants
      let participantsArr = [];
      if (participants) {
        try {
          participantsArr = typeof participants === 'string'
            ? JSON.parse(participants)
            : participants;
        } catch (e) {
          // If parsing fails, treat as single string
          participantsArr = [participants];
        }
      }

      // Map mimetype to simple fileType
      let fileType = 'txt';
      if (mimeType === 'application/pdf') fileType = 'pdf';
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';
      else if (mimeType.startsWith('audio/')) fileType = 'audio';

      const wordCount = originalText
        ? originalText.split(/\s+/).filter(Boolean).length
        : 0;

      const summaryDoc = new Summary({
        title: title || file.originalname || `Document-${new Date().toISOString()}`,
        originalText: originalText || '',
        summary: aiResult.summary || aiResult.summaryText || '',
        keyPoints: aiResult.keyPoints || [],
        actionItems: aiResult.actionItems || [],
        participants: participantsArr,
        fileType,
        fileName: file.originalname || 'upload',
        processingStatus: 'completed',
        userId,
        metadata: {
          wordCount,
          duration,
          confidence: aiResult.confidence || 0
        }
      });

      await summaryDoc.save();

      return summaryDoc;
    } catch (error) {
      logger.error('processDocument error:', error);
      throw error;
    }
  }
}

export default new AIService();
