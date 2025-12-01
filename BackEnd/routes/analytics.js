// BackEnd/routes/analytics.js
const express = require("express");
const router = express.Router();
const AnalyticsEvent = require("../modules/analytics/models/AnalyticsEvent");
const { analyzeSignalsAndEmotions } = require("../modules/analytics/services/emotionalAnalyzer");
const ComponentReportService = require("../modules/analytics/services/componentReportService");
const { ANALYTICS_PAGES, validatePage } = require("../config/analytics.config");

// POST /analytics/track
router.post("/track", async (req, res) => {
  try {
    const { sessionId, page, signals } = req.body;

    if (!sessionId || !validatePage(page)) {
      return res.status(400).json({ 
        error: `Invalid page. Allowed: ${ANALYTICS_PAGES.join(", ")}` 
      });
    }

    const emotionalState = analyzeSignalsAndEmotions(signals);

    const event = new AnalyticsEvent({
      sessionId,
      page,
      duration_ms: signals.duration_ms,
      rage_clicks: signals.rage_clicks,
      rage_clicks_by_component: signals.rage_clicks_by_component,
      hesitations: signals.hesitations,
      scroll_patterns: signals.scroll_patterns,
      keyboard_metrics: signals.keyboard_metrics,
      form_interactions: signals.form_interactions,
      hover_stats: signals.hover_stats,
      emotional_state: emotionalState,
    });

    await event.save();

    // ⭐ UPDATE COMPONENT REPORTS
    await ComponentReportService.updateComponentReports({
      sessionId,
      signals,
      ui_bug_detected: emotionalState.ui_bug_detected,
      ui_bug_details: emotionalState.ui_bug_details,
    });

    res.json({ success: true, event: event._id });
  } catch (e) {
    console.error("[Analytics] Track error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET /analytics/page/:page
router.get("/page/:page", async (req, res) => {
  try {
    const { page } = req.params;
    const { days = 7 } = req.query;

    if (!validatePage(page)) {
      return res.status(400).json({ 
        error: `Invalid page. Allowed: ${ANALYTICS_PAGES.join(", ")}` 
      });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await AnalyticsEvent.aggregate([
      {
        $match: {
          page,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: "$emotional_state.primary",
          count: { $sum: 1 },
          avg_confidence: { $avg: "$emotional_state.confidence" },
          avg_duration: { $avg: "$duration_ms" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const frictions = await AnalyticsEvent.find({
      page,
      "emotional_state.primary": { $in: ["frustrated", "confused"] },
      createdAt: { $gte: since },
    })
      .select("sessionId emotional_state rage_clicks hesitations scroll_patterns")
      .limit(50)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      page,
      days,
      emotional_distribution: stats,
      frictions,
      total_sessions: stats.reduce((s, x) => s + x.count, 0),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /analytics/pages (list available pages)
router.get("/pages", (req, res) => {
  res.json({
    success: true,
    pages: ANALYTICS_PAGES,
  });
});

// GET /analytics/comparison
router.get("/comparison", async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const comparison = await AnalyticsEvent.aggregate([
      {
        $match: { createdAt: { $gte: since } },
      },
      {
        $group: {
          _id: "$page",
          total_sessions: { $sum: 1 },
          frustrated: {
            $sum: {
              $cond: [{ $eq: ["$emotional_state.primary", "frustrated"] }, 1, 0],
            },
          },
          confused: {
            $sum: {
              $cond: [{ $eq: ["$emotional_state.primary", "confused"] }, 1, 0],
            },
          },
          engaged: {
            $sum: {
              $cond: [{ $eq: ["$emotional_state.primary", "engaged"] }, 1, 0],
            },
          },
          hesitant: {
            $sum: {
              $cond: [{ $eq: ["$emotional_state.primary", "hesitant"] }, 1, 0],
            },
          },
          avg_duration: { $avg: "$duration_ms" },
        },
      },
      { $sort: { total_sessions: -1 } },
    ]);

    const enriched = comparison.map((page) => ({
      ...page,
      friction_rate: (
        ((page.frustrated + page.confused) / page.total_sessions) *
        100
      ).toFixed(1),
    }));

    res.json({
      success: true,
      comparison: enriched,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /analytics/page/:page/components
router.get("/page/:page/components", async (req, res) => {
  try {
    const { page } = req.params;
    const { days = 7 } = req.query;

    if (!validatePage(page)) {
      return res.status(400).json({ error: "Invalid page" });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await AnalyticsEvent.find({
      page,
      "rage_clicks_by_component": { $exists: true, $ne: {} },
      createdAt: { $gte: since },
    }).select("rage_clicks_by_component");

    const componentMetrics = {};
    events.forEach((ev) => {
      Object.entries(ev.rage_clicks_by_component || {}).forEach(([comp, count]) => {
        if (!componentMetrics[comp]) {
          componentMetrics[comp] = { rage_clicks: 0, occurrences: 0 };
        }
        componentMetrics[comp].rage_clicks += count;
        componentMetrics[comp].occurrences += 1;
      });
    });

    const sorted = Object.entries(componentMetrics)
      .map(([comp, data]) => ({
        component: comp,
        rage_clicks: data.rage_clicks,
        sessions_affected: data.occurrences,
        avg_rage_clicks: (data.rage_clicks / data.occurrences).toFixed(1),
      }))
      .sort((a, b) => b.rage_clicks - a.rage_clicks);

    res.json({
      success: true,
      page,
      components: sorted,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
