// GM Electronics — Cloudinary configuration (used for product photo uploads)
//
// Firebase Storage now requires a linked billing card even for free usage,
// so product photos are uploaded to Cloudinary instead — genuinely free,
// no card required. Get these two values by:
//
// 1. Sign up free at https://cloudinary.com (no credit card asked)
// 2. On your Dashboard, copy the "Cloud name" shown near the top
// 3. Go to Settings (gear icon) → Upload → Upload presets → Add upload preset
//    → set "Signing Mode" to "Unsigned" → Save → copy the preset's name
//
// Paste both values below.

const CLOUDINARY_CLOUD_NAME = "uggqmnay";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
