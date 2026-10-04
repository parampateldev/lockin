(function () {
  const PATTERNS = {
    box: [
      { phase: "inhale", label: "Breathe in", hint: "Fill your lungs slowly through the nose.", seconds: 4 },
      { phase: "hold", label: "Hold", hint: "Keep the breath soft. No strain.", seconds: 4 },
      { phase: "exhale", label: "Breathe out", hint: "Release through the mouth, unhurried.", seconds: 4 },
      { phase: "rest", label: "Rest", hint: "Empty and still before the next breath.", seconds: 4 },
    ],
    calm: [
      { phase: "inhale", label: "Breathe in", hint: "In through the nose for a quiet four count.", seconds: 4 },
      { phase: "hold", label: "Hold", hint: "Pause. Let the mind loosen.", seconds: 7 },
      { phase: "exhale", label: "Breathe out", hint: "Long exhale. Let the shoulders drop.", seconds: 8 },
    ],
    simple: [
      { phase: "inhale", label: "Breathe in", hint: "Slow and even.", seconds: 4 },
      { phase: "exhale", label: "Breathe out", hint: "Longer than it feels at first.", seconds: 4 },
    ],
  };

  const homeScreen = document.getElementById("homeScreen");
  const sessionScreen = document.getElementById("sessionScreen");
  const doneScreen = document.getElementById("doneScreen");
  const startBtn = document.getElementById("startBtn");
  const skipBtn = document.getElementById("skipBtn");
  const againBtn = document.getElementById("againBtn");
  const homeBtn = document.getElementById("homeBtn");
  const soundToggle = document.getElementById("soundToggle");
  const breathCircle = document.getElementById("breathCircle");
  const phaseText = document.getElementById("phaseText");
  const phaseHint = document.getElementById("phaseHint");
  const sessionTimer = document.getElementById("sessionTimer");

  let audioCtx = null;
  let ambientNodes = null;
  let tickInterval = null;
  let phaseTimeout = null;
  let remaining = 0;
  let patternSteps = PATTERNS.box;
  let stepIndex = 0;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function selectedValue(name, fallback) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : fallback;
  }

  function show(screen) {
    [homeScreen, sessionScreen, doneScreen].forEach((node) => {
      const active = node === screen;
      if (node === homeScreen) {
        node.hidden = !active;
        return;
      }
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-hidden", active ? "false" : "true");
    });
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function startAmbient() {
    if (!soundToggle.checked) return;
    const ctx = ensureAudio();
    if (!ctx || ambientNodes) return;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const makePad = (freq, type, gainValue) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = type;
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 420;
      gain.gain.value = gainValue;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      return { osc, gain, filter };
    };

    const pads = [
      makePad(110, "sine", 0.045),
      makePad(164.81, "sine", 0.028),
      makePad(220, "triangle", 0.012),
    ];

    const now = ctx.currentTime;
    master.gain.exponentialRampToValueAtTime(0.22, now + 2.2);
    ambientNodes = { master, pads };
  }

  function stopAmbient() {
    if (!ambientNodes || !audioCtx) {
      ambientNodes = null;
      return;
    }
    const { master, pads } = ambientNodes;
    const now = audioCtx.currentTime;
    try {
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    } catch (_) {
      /* ignore */
    }
    setTimeout(() => {
      pads.forEach(({ osc }) => {
        try { osc.stop(); } catch (_) { /* ignore */ }
      });
      try { master.disconnect(); } catch (_) { /* ignore */ }
      ambientNodes = null;
    }, 900);
  }

  function clearTimers() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    if (phaseTimeout) {
      clearTimeout(phaseTimeout);
      phaseTimeout = null;
    }
  }

  function setCirclePhase(phase) {
    breathCircle.classList.remove("is-inhale", "is-hold", "is-exhale", "is-rest");
    breathCircle.classList.add(`is-${phase}`);
  }

  function runStep() {
    if (remaining <= 0) {
      finishSession();
      return;
    }
    const step = patternSteps[stepIndex % patternSteps.length];
    phaseText.textContent = step.label;
    phaseHint.textContent = step.hint;
    setCirclePhase(step.phase);
    const holdMs = Math.min(step.seconds, remaining) * 1000;
    phaseTimeout = setTimeout(() => {
      stepIndex += 1;
      runStep();
    }, holdMs);
  }

  function finishSession() {
    clearTimers();
    stopAmbient();
    show(doneScreen);
  }

  function startSession() {
    clearTimers();
    remaining = Number(selectedValue("duration", "120"));
    const patternKey = selectedValue("pattern", "box");
    patternSteps = PATTERNS[patternKey] || PATTERNS.box;
    stepIndex = 0;
    sessionTimer.textContent = formatTime(remaining);
    phaseText.textContent = "Get ready";
    phaseHint.textContent = "Find a comfortable seat. Soften your shoulders.";
    setCirclePhase("rest");
    show(sessionScreen);
    startAmbient();

    setTimeout(() => {
      if (remaining <= 0) return;
      runStep();
    }, 1200);

    tickInterval = setInterval(() => {
      remaining -= 1;
      sessionTimer.textContent = formatTime(Math.max(remaining, 0));
      if (remaining <= 0) {
        finishSession();
      }
    }, 1000);
  }

  function returnHome() {
    clearTimers();
    stopAmbient();
    show(homeScreen);
  }

  startBtn.addEventListener("click", startSession);
  skipBtn.addEventListener("click", finishSession);
  againBtn.addEventListener("click", startSession);
  homeBtn.addEventListener("click", returnHome);
})();
