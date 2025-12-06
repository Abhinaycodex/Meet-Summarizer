// backend/src/routes/SummaryRoute.js
import express from 'express';
import multer from 'multer';
import summaryController from '../controllers/SummaryController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads (in-memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 70MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain',
      'audio/mpeg', // mp3
      'audio/wav',
      'video/mp4',
      'video/webm'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

// =========================
//   ROUTES
// =========================

// POST /api/upload
// Upload a file (PDF/DOCX/TXT/MP3/WAV) and summarize it
router.post(
  '/upload',
  upload.single('file'),
  summaryController.uploadAndSummarize
);

// POST /api/summaries
// Alternative endpoint to create a summary (e.g., with metadata or existing file ref)
router.post(
  '/summaries',
  authMiddleware,
  summaryController.uploadAndSummarize
);

// POST /api/summaries/text
// Summarize raw text sent in the body
router.post(
  '/summaries/text',
  authMiddleware,
  summaryController.summarizeText
);

// GET /api/summaries/status/:id
// Check async processing status of a summary
router.get(
  '/summaries/status/:id',
  authMiddleware,
  summaryController.getProcessingStatus
);

// GET /api/summaries
// Get all summaries of the authenticated user (or global, depending on your controller)
router.get(
  '/summaries',
  authMiddleware,
  summaryController.getAllSummaries
);

// GET /api/summaries/:id
// Get a specific summary
router.get(
  '/summaries/:id',
  authMiddleware,
  summaryController.getSummaryById
);

// PUT /api/summaries/:id
// Update a summary
router.put(
  '/summaries/:id',
  authMiddleware,
  summaryController.updateSummary
);

// DELETE /api/summaries/:id
// Delete a summary
router.delete(
  '/summaries/:id',
  authMiddleware,
  summaryController.deleteSummary
);

export default router;
