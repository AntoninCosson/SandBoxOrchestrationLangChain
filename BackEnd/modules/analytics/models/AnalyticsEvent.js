// BackEnd/modules/analytics/models/AnalyticsEvent.js
const mongoose = require("mongoose");
const { ANALYTICS_PAGES } = require("../../../config/analytics.config");

const analyticsEventSchema = new mongoose.Schema(
  {
    // Session anonyme
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // Page et contexte
    page: {
      type: String,
      required: true,
      enum: ANALYTICS_PAGES,
    },

    // Durée totale sur la page
    duration_ms: Number,

    // Rage clicks
    rage_clicks: {
      detected: Boolean,
      count: Number,
      locations: [String],
      time_span_ms: Number,
    },

    // Rage clicks par component (count only, no positions)
    rage_clicks_by_component: mongoose.Schema.Types.Mixed,

    // Hesitation
    hesitations: {
      count: Number,
      avg_duration_ms: Number,
      before_actions: [String],
    },

    // Scroll behavior
    scroll_patterns: {
      total_distance: Number,
      speed: {
        type: String,
        enum: ["erratic", "smooth", "slow"],
      },
      direction_changes: Number,
      erratic_events: Number,
    },

    // Keyboard behavior
    keyboard_metrics: {
      total_keystrokes: Number,
      backspaces: Number,
      corrections: Number,
      avg_correction_time_ms: Number,
      fields_with_high_backspace: [String],
    },

    // Form interactions
    form_interactions: {
      fields_focused: [String],
      fields_completed: [String],
      abandoned_field: String,
      time_in_field_ms: mongoose.Schema.Types.Mixed,
    },

    // Hover behavior (long hovers only for indecision signal)
    hover_stats: {
      long_hovers: [
        {
          element: String,
          duration_ms: Number,
          count: Number,
        },
      ],
    },

    // Emotional state
    emotional_state: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: "analytics_events",
  }
);

// Indices critiques
analyticsEventSchema.index({ sessionId: 1, page: 1 });
analyticsEventSchema.index({ page: 1, "emotional_state.primary": 1 });
analyticsEventSchema.index({ page: 1, createdAt: -1 });
analyticsEventSchema.index({ "emotional_state.primary": 1, createdAt: -1 });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);