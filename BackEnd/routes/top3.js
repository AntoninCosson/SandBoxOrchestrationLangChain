const express = require("express");
const router = express.Router();
const Top3 = require("../modules/game/models/Top3");

// GET top 3
router.get("/", async (req, res) => {
  let doc = await Top3.findOne();
  if (!doc) return res.json({ success: true, top3: [] });
  res.json({ success: true, top3: doc.scores });
});

// PATCH TOP 3
router.patch("/", async (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== "number") {
    return res.json({ success: false, error: "Missing data" });
  }

  let doc = await Top3.findOne();
  if (!doc) {
    doc = await Top3.create({ scores: [{ username, score }] });
    return res.json({ success: true, top3: doc.scores });
  }

  let found = false;
  doc.scores = doc.scores.map(entry => {
    if (entry.username === username) {
      found = true;
      return { username, score: Math.max(entry.score, score) };
    }
    return entry;
  });
  if (!found) doc.scores.push({ username, score });

  doc.scores = doc.scores.sort((a, b) => b.score - a.score).slice(0, 3);
  await doc.save();

  res.json({ success: true, top3: doc.scores });
});

module.exports = router;
