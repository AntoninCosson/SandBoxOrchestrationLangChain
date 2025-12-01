// FrontEnd/lib/behaviorTracker.js

/**
 * BehaviorTracker - Capture tous les signaux comportementaux
 * + ENRICHISSEMENT DES "UNKNOWN" AVEC DÉTAILS
 * + DETECTION DES UNRESPONSIVE BUTTONS (click but no navigation)
 */
class BehaviorTracker {
    constructor(options = {}) {
      this.sessionId = this.getSessionId();
      this.page = typeof window !== "undefined" ? window.location.pathname : "/";
      this.apiUrl = options.apiUrl || "http://localhost:3000";
      this.flushInterval = options.flushInterval || 30000; // 30s
      this.enableLogging = options.enableLogging || false;
  
      // State
      this.state = {
        pageStart: Date.now(),
        clicks: [],
        keystrokes: [],
        scrollEvents: [],
        hoverEvents: [],
        focusEvents: [],
        lastClickedButton: null,  // ← Track for unresponsive detection
      };
  
      this.initialized = false;
    }
  
    /**
     * Get or create anonymous session ID
     */
    getSessionId() {
      if (typeof window === "undefined") return "server";
      let sid = localStorage.getItem("_behavior_session");
      if (!sid) {
        sid = "s_" + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem("_behavior_session", sid);
      }
      return sid;
    }
  
    /**
     * Initialize tracking
     */
    init() {
      if (this.initialized) return;
      if (typeof window === "undefined") return;
      
      const navType = performance.navigation.type;
      if (navType === 1) {  // TYPE_RELOAD
        this.state.isReload = true;
        this.log("⚠️ Page reloaded - user frustration signal");
      }
  
      this.attachListeners();
      this.startFlushTimer();
      this.initialized = true;
      this.log("✓ BehaviorTracker initialized");
    }
  
    /**
     * Attach all event listeners
     */
    attachListeners() {
      // Mouse clicks
      document.addEventListener("click", (e) => this.onClickHandler(e), true);
  
      // Keyboard
      document.addEventListener("keydown", (e) => this.onKeydownHandler(e), true);
      document.addEventListener("keyup", (e) => this.onKeyupHandler(e), true);
  
      // Scroll
      window.addEventListener("scroll", (e) => this.onScrollHandler(e));
  
      // Mouse hover
      document.addEventListener("mouseenter", (e) => this.onMouseEnter(e), true);
      document.addEventListener("mouseleave", (e) => this.onMouseLeave(e), true);
  
      // Form focus
      document.addEventListener("focus", (e) => this.onFocusHandler(e), true);
      document.addEventListener("blur", (e) => this.onBlurHandler(e), true);
  
      // Cleanup on unload
      window.addEventListener("beforeunload", () => this.flush());

    // Detect when user leaves page (Stripe, external links, etc)
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.state.userLeftPage = true;
          this.log("User left page (tab hidden)");
        } else {
          this.state.userLeftPage = false;
        }
      });
      
      // Detect before unload (redirect)
      window.addEventListener("beforeunload", () => {
        this.state.userLeftPage = true;
      });
    }
  
    /**
     * === CLICK HANDLING ===
     */
    onClickHandler(e) {
        const target = e.target;
        const key = this.getElementKey(target);
        
        // Extract component name
        const componentMatch = key?.match(/\[(.+?)\]/);
        const component = componentMatch ? componentMatch[1] : "unknown";
      
        // ⭐ DECLARE currentUrl HERE (before using it!)
        const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      
        const clickData = {
          timestamp: Date.now(),
          target: key || "empty_space",
          component,
          x: e.clientX,
          y: e.clientY,
          page: this.page,
        };
        
        // === TRACK NAMED BUTTONS/LINKS FOR RESPONSIVENESS ===
        if (component !== "unknown" && (target?.tagName === "BUTTON" || target?.tagName === "A")) {
          clickData.isInteractiveElement = true;
          
          // Store the click to detect if navigation happens
          const isFormSubmit = target.type === "submit" || target.closest("form");
          
          this.state.lastClickedButton = {
            component,
            timestamp: Date.now(),
            url: currentUrl,
            target: key,
            isFormSubmit: !!isFormSubmit,
            timeoutMs: isFormSubmit ? 3000 : 1000  // 3s for forms, 1s for nav
          };
        }
        
        // === ENRICH UNKNOWN CLICKS WITH MORE DETAILS ===
        if (component === "unknown") {
          clickData.details = {
            tag: target?.tagName || "UNKNOWN",
            classes: target?.className || "",
            text: (target?.innerText || "").slice(0, 30),
            parentComponent: target?.parentElement?.dataset?.component || "no-parent-component",
            id: target?.id || "",
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            visible: target?.offsetParent !== null,
          };
        }
        
        this.state.clicks.push(clickData);
        this.log(`Click [${component}]: ${key || "empty"} at (${e.clientX}, ${e.clientY})`);
    }
  
    /**
     * === KEYBOARD HANDLING ===
     */
    onKeydownHandler(e) {
      const target = e.target;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
  
      const key = this.getElementKey(target);
      const isBackspace = e.key === "Backspace";
  
      this.state.keystrokes.push({
        timestamp: Date.now(),
        target: key,
        key: e.key,
        isBackspace,
      });
    }
  
    onKeyupHandler(e) {
      // Track au completion pour forms
    }
  
    /**
     * === SCROLL HANDLING ===
     */
    onScrollHandler(e) {
      const now = Date.now();
      const lastScroll = this.state.scrollEvents[this.state.scrollEvents.length - 1];
  
      // Throttle: max 1 event par 500ms
      if (lastScroll && now - lastScroll.timestamp < 500) return;
  
      this.state.scrollEvents.push({
        timestamp: now,
        scrollY: window.scrollY,
      });
    }
  
    /**
     * === HOVER HANDLING ===
     */
    onMouseEnter(e) {
        const target = e.target;
        const key = this.getElementKey(target);
        if (!key) return;
      
        const componentMatch = key?.match(/\[(.+?)\]/);
        const component = componentMatch ? componentMatch[1] : "unknown";
      
        const hoverData = {
          timestamp: Date.now(),
          target: key,
          component,
          x: e.clientX,
          y: e.clientY,
          page: this.page,
          action: "enter",
        };
        
        if (component === "unknown") {
          hoverData.details = {
            tag: target?.tagName || "UNKNOWN",
            classes: target?.className || "",
            text: (target?.innerText || "").slice(0, 30),
            parentComponent: target?.parentElement?.dataset?.component || "no-parent-component",
            id: target?.id || "",
          };
        }
        
        this.state.hoverEvents.push(hoverData);
      }
  
    onMouseLeave(e) {
      const target = e.target;
      const key = this.getElementKey(target);
      if (!key) return;
  
      this.state.hoverEvents.push({
        timestamp: Date.now(),
        target: key,
        action: "leave",
      });
    }
  
    /**
     * === FOCUS HANDLING ===
     */
    onFocusHandler(e) {
      const target = e.target;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
  
      const key = this.getElementKey(target);
      this.state.focusEvents.push({
        timestamp: Date.now(),
        target: key,
        action: "focus",
      });
    }
  
    onBlurHandler(e) {
      const target = e.target;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
  
      const key = this.getElementKey(target);
      this.state.focusEvents.push({
        timestamp: Date.now(),
        target: key,
        action: "blur",
      });
    }
  
    /**
     * === ANALYZE SIGNALS ===
     */
    analyzeSignals() {
        const duration_ms = Date.now() - this.state.pageStart;
      
        const rage_clicks = this.detectRageClicks();
        
        const rageClicksByComponent = {};
        const unknownClickDetails = [];
        
        for (const click of this.state.clicks) {
          if (!rageClicksByComponent[click.component]) {
            rageClicksByComponent[click.component] = 0;
          }
          rageClicksByComponent[click.component]++;
          
          if (click.component === "unknown" && click.details) {
            unknownClickDetails.push({
              x: click.x,
              y: click.y,
              ...click.details
            });
          }
        }
        
        if (unknownClickDetails.length > 0) {
          rageClicksByComponent.unknown_details = this.deduplicateUnknowns(unknownClickDetails)
            .filter(u => u.count >= 3);
        }
        
        // === DETECT UNRESPONSIVE BUTTONS ===
        const unresponsiveButtons = this.detectUnresponsiveButtons();
      
        return {
          duration_ms,
          page: this.page,
          is_reload: this.state.isReload || false,
          rage_clicks,
          rage_clicks_by_component: rageClicksByComponent,
          hesitations: this.detectHesitations(),
          scroll_patterns: this.analyzeScroll(),
          keyboard_metrics: this.analyzeKeyboard(),
          form_interactions: this.analyzeFormInteractions(),
          hover_stats: this.analyzeHovers(),
          unresponsive_buttons: unresponsiveButtons,
        };
      }
      
      /**
       * Detect unresponsive buttons: clicked but no navigation happened
       */
      detectUnresponsiveButtons() {
        if (!this.state.lastClickedButton) return null;
        
        const clicked = this.state.lastClickedButton;
        const now = Date.now();
        const timeSinceClick = now - clicked.timestamp;
        
        // ✅ NEW: Si user a quitté la page (visibilitychange), pas unresponsive!
        if (this.state.userLeftPage) {
          return null;  // User went to Stripe, payment flow, etc.
        }
        
        // Si plus d'1s et URL n'a pas changé = unresponsive
        if (timeSinceClick > clicked.timeoutMs) {
          const currentUrl = typeof window !== "undefined" ? window.location.href : "";
          
          if (currentUrl === clicked.url) {
            return {
              component: clicked.component,
              target: clicked.target,
              originalUrl: clicked.url,
              currentUrl: currentUrl,
              timeSinceClickMs: timeSinceClick,
              severity: timeSinceClick > 3000 ? "HIGH" : "MEDIUM",
              message: `Button "${clicked.component}" clicked but no navigation occurred (${timeSinceClick}ms)`
            };
          }
        }
        
        return null;
      }
      
      /**
       * Deduplicate unknown clicks by grouping by type
       */
      deduplicateUnknowns(unknownClicks) {
        const grouped = {};
        
        for (const click of unknownClicks) {
          const key = `${click.tag}_${click.parentComponent}`;
          
          if (!grouped[key]) {
            grouped[key] = {
              tag: click.tag,
              classes: click.classes,
              text: click.text,
              parentComponent: click.parentComponent,
              id: click.id,
              visible: click.visible,
              locations: [],
              count: 0
            };
          }
          
          grouped[key].locations.push({ x: click.x, y: click.y });
          grouped[key].count++;
        }
        
        return Object.values(grouped);
      }
  
    /**
     * Detect rage clicks: multiple clicks same spot in <1s
     */
    detectRageClicks() {
      if (this.state.clicks.length < 2) {
        return { detected: false, count: 0, locations: [], time_span_ms: 0 };
      }
  
      const threshold = 1000; // 1s
      let rageClicks = 0;
      let locations = [];
  
      for (let i = 1; i < this.state.clicks.length; i++) {
        const curr = this.state.clicks[i];
        const prev = this.state.clicks[i - 1];
  
        if (curr.timestamp - prev.timestamp < threshold && curr.target === prev.target) {
          rageClicks++;
          if (!locations.includes(curr.target)) locations.push(curr.target);
        }
        if (curr.timestamp - prev.timestamp < threshold && 
            (curr.target === prev.target || curr.target === "empty_space")) {
          rageClicks++;
          if (!locations.includes(curr.target)) locations.push(curr.target);
        }
      }
  
      return {
        detected: rageClicks > 2,
        count: rageClicks,
        locations,
        time_span_ms: this.state.clicks.length > 0 
          ? this.state.clicks[this.state.clicks.length - 1].timestamp - this.state.clicks[0].timestamp
          : 0,
      };
    }
  
    /**
     * Detect hesitations: pauses avant actions
     */
    detectHesitations() {
      const allEvents = [
        ...this.state.clicks,
        ...this.state.keystrokes,
        ...this.state.focusEvents,
      ].sort((a, b) => a.timestamp - b.timestamp);
  
      if (allEvents.length < 2) {
        return { count: 0, avg_duration_ms: 0, before_actions: [] };
      }
  
      let hesitations = [];
      const threshold = 2000; // 2s = hesitation
  
      for (let i = 1; i < allEvents.length; i++) {
        const gap = allEvents[i].timestamp - allEvents[i - 1].timestamp;
        if (gap > threshold) {
          hesitations.push({
            duration: gap,
            before: allEvents[i].target,
          });
        }
      }
  
      return {
        count: hesitations.length,
        avg_duration_ms:
          hesitations.length > 0
            ? Math.round(hesitations.reduce((s, h) => s + h.duration, 0) / hesitations.length)
            : 0,
        before_actions: hesitations.map((h) => h.before).slice(0, 5),
      };
    }
  
    /**
     * Analyze scroll patterns
     */
    analyzeScroll() {
      if (this.state.scrollEvents.length === 0) {
        return {
          total_distance: 0,
          speed: "smooth",
          direction_changes: 0,
          erratic_events: 0,
        };
      }
  
      let totalDistance = 0;
      let directionChanges = 0;
      let erraticCount = 0;
      let lastDirection = null;
  
      for (let i = 1; i < this.state.scrollEvents.length; i++) {
        const curr = this.state.scrollEvents[i];
        const prev = this.state.scrollEvents[i - 1];
  
        const distance = Math.abs(curr.scrollY - prev.scrollY);
        const timeDiff = curr.timestamp - prev.timestamp;
        const speed = distance / Math.max(timeDiff, 1);
  
        totalDistance += distance;
  
        const direction = curr.scrollY > prev.scrollY ? "down" : "up";
        if (lastDirection && lastDirection !== direction) {
          directionChanges++;
        }
        lastDirection = direction;
  
        if (speed > 500) {
          erraticCount++;
        }
      }
  
      let speed = "smooth";
      if (erraticCount > 2) speed = "erratic";
      else if (totalDistance > 0 && this.state.scrollEvents.length > 5) {
        const avgDistance = totalDistance / (this.state.scrollEvents.length - 1);
        if (avgDistance < 20) speed = "slow";
      }
  
      return {
        total_distance: totalDistance,
        speed,
        direction_changes: directionChanges,
        erratic_events: erraticCount,
      };
    }
  
    /**
     * Analyze keyboard metrics
     */
    analyzeKeyboard() {
      const total = this.state.keystrokes.length;
      const backspaces = this.state.keystrokes.filter((k) => k.isBackspace).length;
  
      let corrections = 0;
      let correctionTimes = [];
      let fieldsWithBackspace = new Set();
  
      for (let i = 0; i < this.state.keystrokes.length; i++) {
        if (this.state.keystrokes[i].isBackspace) {
          corrections++;
          fieldsWithBackspace.add(this.state.keystrokes[i].target);
  
          if (i > 0) {
            const correctionTime =
              this.state.keystrokes[i].timestamp - this.state.keystrokes[i - 1].timestamp;
            correctionTimes.push(correctionTime);
          }
        }
      }
  
      return {
        total_keystrokes: total,
        backspaces,
        corrections,
        avg_correction_time_ms:
          correctionTimes.length > 0
            ? Math.round(correctionTimes.reduce((a, b) => a + b) / correctionTimes.length)
            : 0,
        fields_with_high_backspace: Array.from(fieldsWithBackspace),
      };
    }
  
    /**
     * Analyze form interactions
     */
    analyzeFormInteractions() {
      const focusGroups = {};
  
      for (const event of this.state.focusEvents) {
        if (!focusGroups[event.target]) {
          focusGroups[event.target] = { focuses: 0, blurs: 0, duration: 0 };
        }
  
        if (event.action === "focus") {
          focusGroups[event.target].focuses++;
          focusGroups[event.target].lastFocus = event.timestamp;
        } else if (event.action === "blur") {
          focusGroups[event.target].blurs++;
          if (focusGroups[event.target].lastFocus) {
            focusGroups[event.target].duration +=
              event.timestamp - focusGroups[event.target].lastFocus;
          }
        }
      }
  
      const fields_focused = Object.keys(focusGroups);
      const fields_completed = fields_focused.filter(
        (f) => focusGroups[f].focuses === focusGroups[f].blurs
      );
      const abandoned_field =
        fields_focused.find(
          (f) => focusGroups[f].focuses > focusGroups[f].blurs
        ) || null;
  
      const time_in_field_ms = {};
      Object.keys(focusGroups).forEach((f) => {
        time_in_field_ms[f] = focusGroups[f].duration;
      });
  
      return {
        fields_focused,
        fields_completed,
        abandoned_field,
        time_in_field_ms,
      };
    }
  
    /**
     * Analyze hover statistics
     */
    analyzeHovers() {
      const hoverDurations = {};
      let totalHovers = 0;
  
      for (let i = 0; i < this.state.hoverEvents.length; i++) {
        const event = this.state.hoverEvents[i];
  
        if (event.action === "enter") {
          totalHovers++;
          if (!hoverDurations[event.target]) {
            hoverDurations[event.target] = { durations: [], count: 0, details: event.details };
          }
  
          for (let j = i + 1; j < this.state.hoverEvents.length; j++) {
            if (
              this.state.hoverEvents[j].target === event.target &&
              this.state.hoverEvents[j].action === "leave"
            ) {
              const duration = this.state.hoverEvents[j].timestamp - event.timestamp;
              hoverDurations[event.target].durations.push(duration);
              hoverDurations[event.target].count++;
              i = j;
              break;
            }
          }
        }
      }
  
      const long_hovers = Object.entries(hoverDurations)
        .filter(([_, data]) => {
          const avg = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
          return avg > 2000;
        })
        .map(([element, data]) => {
          const avg = Math.round(
            data.durations.reduce((a, b) => a + b, 0) / data.durations.length
          );
          const hoverObj = {
            element,
            duration_ms: avg,
            count: data.count,
          };
          
          if (element === "unknown" && data.details) {
            hoverObj.details = data.details;
          }
          
          return hoverObj;
        });
  
      return {
        long_hovers,
      };
    }
  
    /**
     * === SEND TO BACKEND ===
     */
    async flush() {
        if (this.state.clicks.length === 0 && 
            this.state.keystrokes.length === 0 && 
            this.state.scrollEvents.length === 0 &&
            this.state.hoverEvents.length === 0) {
          return;
        }
      
        const signals = this.analyzeSignals();
        
        const payload = {
          sessionId: this.sessionId,
          page: window.location.pathname || "/",
          signals,
        };
      
        try {
          const res = await fetch(`${this.apiUrl}/analytics/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      
          if (!res.ok) {
            console.error("[BehaviorTracker] Track failed:", await res.text());
          }
        } catch (e) {
          this.log("❌ Flush failed:", e.message);
        }
      
        this.resetState();
      }
  
    /**
     * Reset state after flush
     */
    resetState() {
      this.state = {
        pageStart: Date.now(),
        clicks: [],
        keystrokes: [],
        scrollEvents: [],
        hoverEvents: [],
        focusEvents: [],
        lastClickedButton: null,
      };
    }
  
    /**
     * Start periodic flush
     */
    startFlushTimer() {
      setInterval(() => this.flush(), this.flushInterval);
    }
  
    /**
     * Get unique key for element
     */
    getElementKey(element) {
        if (!element) return null;
      
        let component = null;
        let current = element;
        while (current && current !== document.body) {
          if (current.dataset?.component) {
            component = current.dataset.component;
            break;
          }
          current = current.parentElement;
        }
      
        const id = element.id;
        if (id) return `${component ? `[${component}]` : ""} #${id}`;
      
        const name = element.name;
        if (name && (element.tagName === "INPUT" || element.tagName === "TEXTAREA")) {
          return `${component ? `[${component}]` : ""} input[name=${name}]`;
        }
      
        if (typeof element.className === "string") {
          const classes = element.className
            .split(" ")
            .filter((c) => c.startsWith("btn"))[0];
          if (classes) return `${component ? `[${component}]` : ""} .${classes}`;
        }
      
        if (element.tagName === "BUTTON") 
          return `${component ? `[${component}]` : ""} button`;
        if (element.tagName === "A") 
          return `${component ? `[${component}]` : ""} a`;
      
        return component || "unknown";
      }
  
    /**
     * Logging helper
     */
    log(msg) {
      if (this.enableLogging) {
        console.log(`[BehaviorTracker] ${msg}`);
      }
    }
  }
  
  const behaviorTracker = typeof window !== "undefined" ? (() => {
    const tracker = new BehaviorTracker({ enableLogging: false });
    window.behaviorTracker = tracker;
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => tracker.init());
    } else {
      tracker.init();
    }
    
    return tracker;
  })() : null;
  
  export { behaviorTracker };
  export default BehaviorTracker;
