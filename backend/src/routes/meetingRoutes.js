import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadMeeting } from "../controllers/meetingController.js";

const router = express.Router();

// POST /api/meetings/upload
router.post("/api/meetings/upload", upload.single("file"), uploadMeeting);

export default router;
