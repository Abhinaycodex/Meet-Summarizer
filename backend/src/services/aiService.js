import OpenAI from 'openai';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateSummary(text) {
    try {
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

      const rawContent = response.choices[0].message.content;
      const result = this.parseAIResponse(rawContent);
      
      return {
        summary: result.summary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
        confidence: 0.85
      };
    } catch (error) {
      logger.error('AI service error:', error);
      throw new Error('Failed to generate summary');
    }
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
      let cleaned = response.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```json|```/g, '').trim();
      }
      return JSON.parse(cleaned);
    } catch (error) {
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
      logger.info('Audio transcription requested');
      return {
        text: 'Mock transcription of audio content...',
        confidence: 0.9
      };
    } catch (error) {
      logger.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

export default new AIService();
