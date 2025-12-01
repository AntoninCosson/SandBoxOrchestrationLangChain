const express = require("express");
const router = express.Router();
const User = require("../modules/users/models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");
const { signinLimiter, signupLimiter } = require("../middlewares/authRateLimit");
const { validateBody } = require("../middlewares/validateZod");
const { signupSchema, loginSchema, refreshTokenSchema, updateBestScoreSchema } = require("../modules/users/schemas/userSchemas");

// ---- JWT
function signAccess(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role || "user",
      scopes: user.scopes || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}
function signRefresh(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

// ---- SIGNUP
router.post("/signup", signupLimiter, validateBody(signupSchema), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.json({
        success: false,
        error: "Missing fields (username, email, password)",
      });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      const field =
        exists.email === (email || "").toLowerCase() ? "email" : "username";
      return res.json({ success: false, error: `Already used ${field}` });
    }

    const hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ username, email, password: hash });

    if (
      String(user.email).toLowerCase() ===
      String(process.env.ADMIN_EMAIL).toLowerCase()
    ) {
      user.role = "admin";
      user.scopes = Array.from(new Set([...(user.scopes || []), "mcp:all"]));
      await user.save();
    }

    const refresh = signRefresh(user);
    user.refreshTokenHash = bcrypt.hashSync(refresh, 10);
    await user.save();

    return res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        bestScore: user.bestScore ?? 0,
      },
      accessToken: signAccess(user),
      refreshToken: refresh,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ---- LOGIN
router.post("/login", signinLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { username, email, password, identifier } = req.body;
    const query = identifier
      ? {
          $or: [
            { username: identifier },
            { email: (identifier || "").toLowerCase() },
          ],
        }
      : email
      ? { email: (email || "").toLowerCase() }
      : { username };

    const user = await User.findOne(query);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, error: "Invalid credentials" });
    }

    const refresh = signRefresh(user);
    user.refreshTokenHash = bcrypt.hashSync(refresh, 10);
    await user.save();

    return res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        bestScore: user.bestScore ?? 0,
      },
      accessToken: signAccess(user),
      refreshToken: refresh,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ---- REFRESH
router.post("/refresh", validateBody(refreshTokenSchema), async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken)
    return res
      .status(400)
      .json({ success: false, error: "No refresh token provided" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.refreshTokenHash)
      return res.status(401).json({ success: false, error: "User not found" });

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, error: "Invalid refresh token" });

    const newRefresh = signRefresh(user);
    user.refreshTokenHash = bcrypt.hashSync(newRefresh, 10);
    await user.save();

    return res.json({
      success: true,
      accessToken: signAccess(user),
      refreshToken: newRefresh,
    });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid refresh token" });
  }
});

// ---- ME
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user)
    return res.status(404).json({ success: false, error: "User not found" });
  res.json({
    success: true,
    user: {
      username: user.username,
      email: user.email,
      bestScore: user.bestScore ?? 0,
    },
  });
});

// ---- ME LLMUsage
router.get("/me/llm-credits", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { MONTHLY_QUOTA } = require("../mcp/middlewares/llmQuota");
  const used = user.llmUsage.total;
  const remaining = Math.max(0, MONTHLY_QUOTA - used);

  res.json({ used, remaining, quota: MONTHLY_QUOTA });
});

// ---- LOGOUT
router.post("/logout", auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $set: { refreshTokenHash: null },
  });
  res.json({ success: true });
});

// ---- BestScore
router.get("/bestScoreUser", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.json({ success: false, error: "Missing username" });
  const user = await User.findOne({ username });
  if (user) res.json({ success: true, bestScoreUser: user.bestScore ?? 0 });
  else res.json({ success: false, bestScoreUser: 0 });
});

router.patch("/bestScoreUser", validateBody(updateBestScoreSchema), async (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== "number")
    return res.json({ success: false, error: "Missing data" });
  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false, error: "User not found" });
  if (score > (user.bestScore ?? 0)) {
    user.bestScore = score;
    await user.save();
  }
  res.json({ success: true, bestScoreUser: user.bestScore ?? 0 });
});

//

module.exports = router;
