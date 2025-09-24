import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalText: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  keyPoints: [{
    type: String
  }],
  actionItems: [{
    task: String,
    assignee: String,
    deadline: Date
  }],
  participants: [{
    type: String
  }],
  meetingDate: {
    type: Date,
    default: Date.now
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt', 'audio'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    wordCount: Number,
    duration: Number, // for audio files
    confidence: Number // AI confidence score
  }
}, {
  timestamps: true
});

// Indexes for better query performance
summarySchema.index({ userId: 1, createdAt: -1 });
summarySchema.index({ processingStatus: 1 });

export default mongoose.model('Summary', summarySchema);