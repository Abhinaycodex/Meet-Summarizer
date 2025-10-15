import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import OpenAI from "openai";
import Meeting from "../models/Meeting.js";

ffmpeg.setFfmpegPath(ffmpegPath);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🧩 Upload, transcribe, and summarize meeting
export const uploadMeeting = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const videoPath = req.file.path;
    const audioPath = `uploads/${Date.now()}.mp3`;

    // 🎧 Step 1: Extract Audio using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .noVideo()
        .on("end", resolve)
        .on("error", reject)      
        .run();
    });

    // 🎙️ Step 2: Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    const transcript = transcription.text;
    console.log("✅ Transcription done!");

    // 🧠 Step 3: Summarize using GPT
    const summaryPrompt = `
      You are an AI meeting assistant.
      Given this transcript, create structured minutes of meeting:
      - Summary of discussion
      - Key decisions
      - Action items
      Transcript:
      ${transcript}
    `;

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional meeting summarizer." },
        { role: "user", content: summaryPrompt },
      ],
    });

    const summary = summaryResponse.choices[0].message.content;
    console.log("✅ Summary generated!");

    // 💾 Step 4: Save to MongoDB
    const meeting = new Meeting({
      title: req.file.originalname,
      transcript,
      summary,
      actionItems: extractActionItems(summary),
    });
    await meeting.save();

    // 🧹 Step 5: Clean up temporary files
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);

    res.status(200).json({
      message: "Meeting processed successfully",
      meeting,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🧠 Helper function to extract action items from summary
function extractActionItems(summary) {
  const matches = summary.match(/- (.*?)(?=\n|$)/g);
  return matches ? matches.map(item => item.replace("- ", "").trim()) : [];
}
