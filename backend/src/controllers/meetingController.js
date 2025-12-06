// backend/src/controllers/meetingController.js
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import OpenAI from "openai";
import https from "https";
import http from "http";
import Meeting from "../models/Meeting.js";
import cloudinary from '../../config/cloudinary.js';
import aiService from '../services/aiService.js';

ffmpeg.setFfmpegPath(ffmpegPath);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: extract action items
function extractActionItems(summary = "") {
  if (!summary) return [];
  const lines = summary.split(/\r?\n/);
  const items = [];
  for (const ln of lines) {
    const t = ln.trim();
    if (!t) continue;
    if (/^[-\*\u2022]\s+/.test(t)) items.push(t.replace(/^[-\*\u2022]\s+/, ""));
    else if (/^Action(s| item)?[:\-]/i.test(t)) {
      const after = t.split(/[:\-]\s*/).slice(1).join(":").trim();
      after.split(/[,;]|\band\b/).map(x => x.trim()).filter(Boolean).forEach(x => items.push(x));
    }
  }
  return items;
}

// Upload video buffer to Cloudinary
export const uploadVideoBufferToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'meetings',
        format: 'mp4'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        console.log('Cloudinary upload success:', result.secure_url);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Download video from Cloudinary URL (handles both http and https)
const downloadVideoFromCloudinary = async (videoUrl, outputPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = videoUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(videoUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(outputPath, () => {});
        return downloadVideoFromCloudinary(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(outputPath, () => {});
        return reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          console.log('✅ Video file downloaded successfully');
          resolve();
        });
      });

      file.on('error', (err) => {
        file.close();
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {});
      reject(err);
    });

    request.setTimeout(60000, () => {
      request.destroy();
      file.close();
      fs.unlink(outputPath, () => {});
      reject(new Error('Download timeout after 60 seconds'));
    });
  });
};

// Extract audio from video file
// backend/src/controllers/meetingController.js
const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    // 0) Ensure video file exists
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found: ${videoPath}`));
    }

    const dir = path.dirname(audioPath);
    // 1) Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 2) Quick sanity check: can we write here?
    try {
      const testPath = path.join(dir, '.ffmpeg_write_test');
      fs.writeFileSync(testPath, 'ok');
      fs.unlinkSync(testPath);
    } catch (e) {
      return reject(
        new Error(
          `Cannot write to directory ${dir}: ${e.message}`
        )
      );
    }

    console.log(`🎵 Starting audio extraction from: ${videoPath}`);
    console.log(`🎵 Target audio path: ${audioPath}`);

    // Use explicit WAV codec and sample rate to avoid platform-specific ffmpeg issues
    try {
      const command = ffmpeg(videoPath)
        .noVideo()
        .audioChannels(1)
        .audioCodec('pcm_s16le') // standard WAV PCM codec
        .audioFrequency(16000) // 16kHz is a good default for speech
        .format('wav')
        .outputOptions('-y'); // overwrite if exists

      command.on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      });

      command.on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}% done`);
        }
      });

      command.on('end', () => {
        console.log('✅ Audio extraction complete');
        resolve();
      });

      command.on('error', (err, stdout, stderr) => {
        console.error('❌ Audio extraction error:', err?.message || err);
        if (stderr) console.error('FFmpeg stderr:', stderr);
        return reject(new Error(`Audio extraction failed: ${err?.message || 'unknown error'}`));
      });

      // Use .save() which is more explicit than .run() for outputs
      command.save(audioPath);
    } catch (err) {
      console.error('❌ Failed to start ffmpeg command:', err);
      return reject(new Error(`Failed to start audio extraction: ${err.message}`));
    }
  });
};



// Transcribe audio using OpenAI Whisper
const transcribeAudio = async (audioPath) => {
  // Check if audio file exists and has content
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const stats = fs.statSync(audioPath);
  if (stats.size === 0) {
    throw new Error('Audio file is empty');
  }

  console.log(`🎤 Transcribing audio file (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

  // If OpenAI key is not configured, fall back to internal aiService mock
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not found - using local mock transcription');
    const buffer = await fsPromises.readFile(audioPath);
    const result = await aiService.transcribeAudio(buffer);
    return typeof result === 'string' ? result : result?.text ?? '';
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "en",
    });

    const transcriptText = transcription?.text?.trim?.() ?? transcription?.data?.text ?? "";

    if (!transcriptText) {
      throw new Error('Transcription returned empty text');
    }

    console.log(`✅ Transcription complete (${transcriptText.length} characters)`);
    return transcriptText;
  } catch (err) {
    console.error('OpenAI transcription failed, falling back to local mock:', err?.message ?? err);
    try {
      const buffer = await fsPromises.readFile(audioPath);
      const result = await aiService.transcribeAudio(buffer);
      return typeof result === 'string' ? result : result?.text ?? '';
    } catch (fallbackErr) {
      console.error('Fallback transcription also failed:', fallbackErr);
      throw new Error('All transcription attempts failed');
    }
  }
};

// Generate summary using GPT
const generateSummary = async (transcript) => {
  const summaryPrompt = `
You are an AI meeting assistant. Given the transcript below, produce structured minutes of meeting with these sections:
- Short Title
- Brief summary (3-5 sentences)
- Key decisions (bullet list)
- Action items (bullet list; include owner and due date if present)
- Attendees (if identifiable)

Transcript:
${transcript}
  `;

  const summaryResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional meeting summarizer." },
      { role: "user", content: summaryPrompt },
    ],
    temperature: 0.2,
  });

  return summaryResponse?.choices?.[0]?.message?.content?.trim() ?? "";
};

// Main handler: upload, extract, transcribe, summarize, save

export const uploadMeeting = async (req, res) => {
  const tmpDir = path.join(process.cwd(), "tmp_meetings");
  let tempVideoPath = null;
  let tempAudioPath = null;

  try {
    await fsPromises.mkdir(tmpDir, { recursive: true });

    tempVideoPath = path.join(tmpDir, `${uuidv4()}.webm`);
    tempAudioPath = path.join(tmpDir, `${uuidv4()}.wav`);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.file.buffer) {
      return res.status(400).json({ error: "File buffer is empty" });
    }

    console.log(
      `📤 Processing file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`
    );

    // 1️⃣ Save buffer to local temp video file
    console.log("💾 Saving uploaded video to temp file...");
    await fsPromises.writeFile(tempVideoPath, req.file.buffer);
    const videoStats = await fsPromises.stat(tempVideoPath);
    console.log(`✅ Video saved locally (${(videoStats.size / 1024 / 1024).toFixed(2)} MB)`);

    // 2️⃣ Extract audio
    console.log("🎵 Extracting audio from video...");
    await extractAudio(tempVideoPath, tempAudioPath);
    const audioStats = await fsPromises.stat(tempAudioPath);
    console.log(`✅ Audio extracted (${(audioStats.size / 1024 / 1024).toFixed(2)} MB)`);

    // 3️⃣ Transcribe
    console.log("🎤 Starting transcription with OpenAI Whisper...");
    const transcript = await transcribeAudio(tempAudioPath);

    // 4️⃣ Summarize
    console.log("📝 Generating AI summary...");
    const summary = await generateSummary(transcript);
    console.log("✅ Summary generated");

    // 5️⃣ Extract action items
    const actionItems = extractActionItems(summary);
    console.log(`✅ Extracted ${actionItems.length} action items`);

    // 6️⃣ Upload final video to Cloudinary (optional)
    console.log("📤 Uploading video to Cloudinary...");
    const cloudinaryResult = await cloudinary.uploader.upload(tempVideoPath, {
      resource_type: "video",
      folder: "meetings",
    });
    console.log("✅ Video uploaded to Cloudinary:", cloudinaryResult.secure_url);

    // 7️⃣ Save DB
    const meeting = new Meeting({
      title:
        req.body.title ||
        req.file.originalname ||
        `Meeting-${new Date().toISOString()}`,
      transcript,
      summary,
      actionItems,
      videoUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      duration: cloudinaryResult.duration,
      uploadedAt: new Date(),
    });
    await meeting.save();

    // 8️⃣ Clean up
    await fsPromises.rm(tempVideoPath, { force: true }).catch(() => {});
    await fsPromises.rm(tempAudioPath, { force: true }).catch(() => {});

    return res.status(200).json({
      message: "Meeting processed successfully",
      meeting: {
        id: meeting._id,
        title: meeting.title,
        videoUrl: meeting.videoUrl,
        summary: meeting.summary,
        actionItems: meeting.actionItems,
        transcript: transcript.substring(0, 500) + "...",
        uploadedAt: meeting.uploadedAt,
      },
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);

    if (tempVideoPath) {
      await fsPromises.rm(tempVideoPath, { force: true }).catch(() => {});
    }
    if (tempAudioPath) {
      await fsPromises.rm(tempAudioPath, { force: true }).catch(() => {});
    }

    return res.status(500).json({
      error: error?.message ?? "Unknown error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};


// Get all meetings
export const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .sort({ uploadedAt: -1 })
      .select('-transcript'); // Exclude large transcript field
    
    res.status(200).json({ meetings });
  } catch (error) {
    console.error("❌ Get meetings error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get single meeting by ID
export const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    res.status(200).json({ meeting });
  } catch (error) {
    console.error("❌ Get meeting error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete meeting
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Delete from Cloudinary if public_id exists
    if (meeting.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(meeting.cloudinaryPublicId, {
        resource_type: 'video'
      });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("❌ Delete meeting error:", error);
    res.status(500).json({ error: error.message });
  }
};