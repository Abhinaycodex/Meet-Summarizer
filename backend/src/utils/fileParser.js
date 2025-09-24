import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import logger from './logger.js';

class FileParser {
  async parseFile(file) {
    try {
      switch (file.mimetype) {
        case 'application/pdf':
          return await this.parsePDF(file.buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseDOCX(file.buffer);
        case 'text/plain':
          return this.parseText(file.buffer);
        case 'audio/mpeg':
        case 'audio/wav':
          return await this.parseAudio(file.buffer);
        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }
    } catch (error) {
      logger.error('File parsing error:', error);
      throw error;
    }
  }

  async parsePDF(buffer) {
    try {
      const data = await pdf(buffer);
      return {
        text: data.text,
        pages: data.numpages,
        metadata: data.info
      };
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  async parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
        messages: result.messages
      };
    } catch (error) {
      logger.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  parseText(buffer) {
    return {
      text: buffer.toString('utf-8')
    };
  }

  async parseAudio(buffer) {
    // This would integrate with speech-to-text service
    logger.info('Audio parsing requested - would integrate with STT service');
    return {
      text: 'Mock transcription of audio file...',
      duration: 120 // mock duration in seconds
    };
  }
}

export default new FileParser();