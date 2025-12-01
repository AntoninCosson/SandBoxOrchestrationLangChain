// BackEnd/modules/analytics/services/emotionalAnalyzer.js
/**
 * Analyse les signaux comportementaux et détermine l'état émotionnel
 * + DÉTECTION DE BUGS UI:
 *   - Unresponsive buttons (clicked but no navigation!)
 *   - Unknown rage clicks
 *   - Unknown long hovers  
 */
class EmotionalAnalyzer {
    /**
     * Calcule l'état émotionnel à partir des signaux bruts
     * @param {Object} signals - Les signaux captés du frontend
     * @returns {Object} { primary, confidence, signals_detected, score, ui_bug_detected, ui_bug_details }
     */
    static analyze(signals) {
      if (!signals) return this.defaultState();
  
      const scores = {
        frustrated: 0,
        confused: 0,
        hesitant: 0,
        engaged: 0,
      };
  
      const detectedSignals = [];
      let uiBugDetected = false;
      let uiBugDetails = null;
  
      // === UNRESPONSIVE BUTTON DETECTION (THE CLEAR BUG!) ===
      // Quand user clique sur un button taggé mais rien ne se passe!
      if (signals.unresponsive_buttons) {
        // C'est un BUG CLAIR - button was clicked but no navigation happened
        scores.frustrated += 60; // Poids TRÈS élevé!
        uiBugDetected = true;
        uiBugDetails = {
          type: "unresponsive_button",
          component: signals.unresponsive_buttons.component,
          target: signals.unresponsive_buttons.target,
          severity: signals.unresponsive_buttons.severity,
          timeSinceClickMs: signals.unresponsive_buttons.timeSinceClickMs,
          message: signals.unresponsive_buttons.message
        };
        detectedSignals.push(`UI_BUG_unresponsive_button_${signals.unresponsive_buttons.component}`);
      }
  
      // === UI BUG DETECTION (unknown component clicks/hovers) ===
      // Les "unknown" ne sont PAS du bruit!
      // User clique sur "unknown" = clique sur du vide/non-réactif = BUG D'UI 🔴
      
      const unknownRageClicks = signals.rage_clicks_by_component?.unknown || 0;
      if (unknownRageClicks > 5) {
        // Plus de 5 clics sur du vide en 30s = PROBLÈME D'UI SÉRIEUX!
        scores.frustrated += 50; // Poids TRÈS élevé
        uiBugDetected = true;
        if (!uiBugDetails) {  // Don't override unresponsive_button if it exists
          uiBugDetails = {
            type: "unknown_rage_clicks",
            count: unknownRageClicks,
            severity: "HIGH",
            message: `User clique ${unknownRageClicks}x sur des composants non-taggés (éléments non-réactifs)`
          };
        }
        detectedSignals.push(`UI_BUG_unknown_rage_clicks_${unknownRageClicks}`);
      }
      
      // Hovers longs sur "unknown" = user cherche quelque chose, UI confuse
      const unknownLongHovers = signals.hover_stats?.long_hovers?.filter(h => h.element === "unknown") || [];
      if (unknownLongHovers.length > 0) {
        const totalUnknownHoverTime = unknownLongHovers.reduce((sum, h) => sum + h.duration_ms, 0);
        if (totalUnknownHoverTime > 8000) {
          // User hover plus de 8s sur du "unknown" = confusion UI
          scores.confused += 30;
          uiBugDetected = true;
          if (!uiBugDetails) {
            uiBugDetails = {
              type: "unknown_long_hover",
              duration_ms: totalUnknownHoverTime,
              severity: "MEDIUM",
              message: `User hover ${(totalUnknownHoverTime / 1000).toFixed(1)}s sur des éléments non-identifiés`
            };
          }
          detectedSignals.push(`UI_BUG_unknown_long_hover_${totalUnknownHoverTime}ms`);
        }
      }
  
      // === PAGE RELOAD (major frustration signal) ===
      if (signals.is_reload) {
        scores.frustrated += 35;
        detectedSignals.push("page_reload");
      }
  
      // === RAGE CLICKS (frustration majeure) ===
      if (signals.rage_clicks?.detected && signals.rage_clicks?.count > 0) {
        scores.frustrated += 40; // poids fort
        detectedSignals.push("rage_clicks");
      }
  
      // === EXCESSIVE BACKSPACE (frustration/confusion) ===
      if (signals.keyboard_metrics?.backspaces > 10) {
        scores.frustrated += 20;
        detectedSignals.push("excessive_backspace");
      }
  
      if (
        signals.keyboard_metrics?.corrections > 5 &&
        signals.keyboard_metrics?.avg_correction_time_ms > 1500
      ) {
        scores.confused += 15;
        detectedSignals.push("excessive_corrections");
      }
  
      // === HESITATIONS (confusion/indécision) ===
      if (signals.hesitations?.count > 4) {
        scores.confused += 25;
        detectedSignals.push("multiple_hesitations");
      }
  
      if (signals.hesitations?.avg_duration_ms > 3000) {
        scores.confused += 15;
        scores.hesitant += 10;
        detectedSignals.push("long_hesitations");
      }
  
      // === SCROLL ERRATIQUE (frustration/confusion) ===
      if (signals.scroll_patterns?.erratic_events > 2) {
        scores.frustrated += 15;
        scores.confused += 10;
        detectedSignals.push("erratic_scroll");
      }
  
      if (signals.scroll_patterns?.direction_changes > 8) {
        scores.confused += 20;
        detectedSignals.push("excessive_backtracking");
      }
  
      // === LONG HOVER (indécision/incompréhension) ===
      if (
        signals.hover_stats?.long_hovers &&
        signals.hover_stats.long_hovers.length > 0
      ) {
        const longHoverCount = signals.hover_stats.long_hovers.length;
        scores.hesitant += longHoverCount * 10;
        scores.confused += longHoverCount * 5;
        detectedSignals.push(
          `long_hover_${longHoverCount}_elements`
        );
      }
  
      // === FORM ABANDONMENT (confusion/intimidation) ===
      if (signals.form_interactions?.abandoned_field) {
        scores.hesitant += 25;
        scores.confused += 15;
        detectedSignals.push("form_abandonment");
      }
  
      const completedFields = signals.form_interactions?.fields_completed?.length || 0;
      const totalFields = signals.form_interactions?.fields_focused?.length || 0;
      if (totalFields > 0 && completedFields < totalFields * 0.5) {
        scores.confused += 20;
        detectedSignals.push("incomplete_form_ratio");
      }
  
      // === ENGAGED BEHAVIOR (positif) ===
      if (
        signals.keyboard_metrics?.corrections === 0 &&
        signals.scroll_patterns?.erratic_events === 0 &&
        !signals.rage_clicks?.detected &&
        signals.hesitations?.count < 2
      ) {
        scores.engaged += 50;
        detectedSignals.push("smooth_behavior");
      }
  
      // === SLOW PACE (hesitant mais pas forcément mauvais) ===
      if (signals.scroll_patterns?.speed === "slow" && signals.duration_ms > 300000) {
        scores.hesitant += 10;
        detectedSignals.push("slow_pace");
      }
  
      // === Normalize scores (0-100) ===
      const maxScore = 100;
      Object.keys(scores).forEach((key) => {
        scores[key] = Math.min(scores[key], maxScore);
      });
  
      // === Determine primary state ===
      const primary = Object.keys(scores).reduce((a, b) =>
        scores[a] > scores[b] ? a : b
      );
  
      const primaryScore = scores[primary];
      const confidence = Math.min(primaryScore / maxScore, 0.99);
  
      // === If scores are too low, default to engaged ===
      if (primaryScore < 20) {
        return {
          primary: "engaged",
          confidence: 0.6,
          signals_detected: detectedSignals.length > 0 ? detectedSignals : ["no_friction"],
          score: 0.1,
          ui_bug_detected: uiBugDetected,
          ui_bug_details: uiBugDetails,
        };
      }
  
      return {
        primary,
        confidence,
        signals_detected: detectedSignals,
        score: primaryScore / maxScore,
        ui_bug_detected: uiBugDetected,
        ui_bug_details: uiBugDetails,
      };
    }
  
    static defaultState() {
      return {
        primary: "engaged",
        confidence: 0.0,
        signals_detected: [],
        score: 0,
        ui_bug_detected: false,
        ui_bug_details: null,
      };
    }
  }
  
  /**
   * Export pour utilisation directe
   */
  function analyzeSignalsAndEmotions(signals) {
    return EmotionalAnalyzer.analyze(signals);
  }
  
  module.exports = EmotionalAnalyzer;
  module.exports.analyzeSignalsAndEmotions = analyzeSignalsAndEmotions;
