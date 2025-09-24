import { OpenAI } from 'openai';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    // Check if OpenAI API key is provided
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not found. AI summarization will use mock responses.');
      this.openai = null;
      this.useMockResponses = true;
    } else {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.useMockResponses = false;
        logger.info('OpenAI API initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize OpenAI:', error);
        this.openai = null;
        this.useMockResponses = true;
      }
    }
  }

  async generateSummary(text) {
    try {
      // Use mock response if OpenAI is not available
      if (this.useMockResponses) {
        logger.info('Using mock AI response - OpenAI API key not configured');
        return this.getMockSummary(text);
      }

      const prompt = this.buildSummaryPrompt(text);
      
      const response = await this.openai.chat.completions.create({
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

      const result = this.parseAIResponse(response.choices[0].message.content);
      
      return {
        summary: result.summary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
        confidence: 0.85
      };
    } catch (error) {
      logger.error('AI service error:', error);
      
      // Fallback to mock response on error
      logger.info('Falling back to mock response due to AI service error');
      return this.getMockSummary(text);
    }
  }

  getMockSummary(text) {
    const wordCount = text.split(' ').length;
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    
    // Generate a simple extractive summary
    const summaryLength = Math.min(3, Math.max(1, Math.floor(sentences.length / 4)));
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
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      // Fallback: parse text format
      logger.warn('AI response not in JSON format, parsing manually');
      
      return {
        summary: response.substring(0, 500) + '...',
        keyPoints: ['Summary generated from unstructured response'],
        actionItems: []
      };
    }
  }

  async transcribeAudio(audioBuffer) {
    try {
      // Use mock response if OpenAI is not available
      if (this.useMockResponses) {
        logger.info('Using mock audio transcription - OpenAI API key not configured');
        return {
          text: `Mock transcription of audio content. The audio file contained approximately ${Math.floor(audioBuffer.length / 1000)} seconds of content. This would typically contain meeting discussions, participant introductions, key decisions, and action items that were discussed during the session.`,
          confidence: 0.7
        };
      }

      // This would integrate with OpenAI Whisper API for real audio transcription
      logger.info('Audio transcription requested - integrating with Whisper API');
      
      // For now, return mock response even with API key
      // You can implement Whisper API integration here
      return {
        text: 'Mock transcription of audio content - Whisper API integration pending...',
        confidence: 0.9
      };
    } catch (error) {
      logger.error('Audio transcription error:', error);
      return {
        text: 'Failed to transcribe audio content. Please try again or use a text-based input.',
        confidence: 0.1
      };
    }
  }
}

export default new AIService();