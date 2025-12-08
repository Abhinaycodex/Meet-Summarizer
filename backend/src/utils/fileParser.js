import fs from 'fs';
import mammoth from 'mammoth';
import logger from './logger.js';
import { PDFParse } from 'pdf-parse'; // ✅ new v2 class-based API

class FileParser {
  async parseFile(file) {
    try {
      const mime = file.mimetype || '';

      switch (mime) {
        case 'application/pdf':
          return await this.parsePDF(file);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseDOCX(file);
        case 'text/plain':
          return this.parseText(file);
        case 'audio/mpeg':
        case 'audio/wav':
          return await this.parseAudio(file);
        default:
          throw new Error(`Unsupported file type: ${mime}`);
      }
    } catch (error) {
      logger.error('File parsing error:', error);
      throw error;
    }
  }

  // 🔹 PDF using NEW v2 syntax
  async parsePDF(file) {
    try {
      const buffer = file.buffer ?? fs.readFileSync(file.path);

      // ✅ create parser instance with data
      const parser = new PDFParse({ data: buffer });

      // getText() returns text + pages array
      const result = await parser.getText();

      return {
        text: result.text,
        pages: result.pages.length,   // v2 returns pages[] instead of numpages
        metadata: {
          // You can extract more, but v2 doesn't expose PDF info the same way
          pageCount: result.pages.length
        }
      };
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  // 🔹 DOCX (same)
  async parseDOCX(file) {
    try {
      const buffer = file.buffer ?? fs.readFileSync(file.path);

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

  // 🔹 Plain text
  parseText(file) {
    const buffer = file.buffer ?? fs.readFileSync(file.path);
    return {
      text: buffer.toString('utf-8')
    };
  }

  // 🔹 Audio mock
  async parseAudio(file) {
    const size = file.buffer ? file.buffer.length : 0;

    logger.info('Audio parsing requested - STT pending integration');
    return {
      text: 'Mock transcription of audio file...',
      duration: Math.floor(size / 16000) || 120
    };
  }
}

export default new FileParser();
