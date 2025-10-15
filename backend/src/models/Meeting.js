import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  title: String,
  transcript: String,
  summary: String,
  actionItems: [String],
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Meeting", meetingSchema);
