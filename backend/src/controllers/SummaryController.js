

import summaryService from '../services/SummaryService.js';
import logger from '../utils/logger.js';
import { validationResult } from 'express-validator';

class SummaryController {
  async uploadAndSummarize(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title, participants } = req.body;
      const userId = req.user.id;

      const result = await summaryService.processFileUpload({
        file: req.file,
        title,
        participants: participants ? JSON.parse(participants) : [],
        userIdoi
      });

      res.status(202).json({
        message: 'File uploaded successfully, processing started',
        summaryId: result.summaryId,
        status: 'processing'
      });
    } catch (error) {
      logger.error('Upload error:', error);
      next(error);
    }
  }

  async summarizeText(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text, title, participants } = req.body;
      const userId = req.user.id;

      const result = await summaryService.summarizeText({
        text,
        title,
        participants,
        userId
      });

      res.json(result);
    } catch (error) {
      logger.erro('Text summarization error:', error);
      next(error);
    }
  }

  async getAllSummaries(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const userId = req.user.id;

      const summaries = await summaryService.getUserSummaries({
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json(summaries);
    } catch (error) {
      logger.error('Get summaries error:', error);
      next(error);
    }
  }

  async getSummaryById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const summary = await summaryService.getSummaryById(id, userId);

      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }

      res.json(summary);
    } catch (error) {
      logger.error('Get summary error:', error);
      next(error);
    }
  }

  async updateSummary(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      const summary = await summaryService.updateSummary(id, updates, userId);

      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }

      res.json(summary);
    } catch (error) {
      logger.error('Update summary error:', error);
      next(error);
    }
  }

  async deleteSummary(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await summaryService.deleteSummary(id, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Summary not found' });
      }

      res.json({ message: 'Summary deleted successfully' });
    } catch (error) {
      logger.error('Delete summary error:', error);
      next(error);
    }
  }

  async getProcessingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const status = await summaryService.getProcessingStatus(id, userId);

      if (!status) {
        return res.status(404).json({ error: 'Summary not found' });
      }

      res.json(status);
    } catch (error) {
      logger.error('Get status error:', error);
      next(error);
    }
  }
}

export default new SummaryController();