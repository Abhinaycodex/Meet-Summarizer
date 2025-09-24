import express from 'express';
import multer from 'multer';
import summaryController from '../controllers/summaryController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'audio/mpeg', 'audio/wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});


router.post('/upload', authMiddleware, upload.single('file'), summaryController.uploadAndSummarize);
router.post('/text', authMiddleware, summaryController.summarizeText);
router.get('/', authMiddleware, summaryController.getAllSummaries);
router.get('/:id', authMiddleware, summaryController.getSummaryById);
router.put('/:id', authMiddleware, summaryController.updateSummary);
router.delete('/:id', authMiddleware, summaryController.deleteSummary);
router.get('/status/:id', authMiddleware, summaryController.getProcessingStatus);

export default router;