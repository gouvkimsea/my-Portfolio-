const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Page loader
window.addEventListener("load", () => setTimeout(() => $("#loader")?.classList.add("done"), 400));

// Header scroll state
const header = $(".site-header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

// Mobile navigation menu
const menuToggle = $("#menuToggle");
const menu = $("#mainMenu");
const closeMenu = () => {
  menu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
};
menuToggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  playSound("click");
});
$$(".nav-link").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("click", event => {
  if (menu.classList.contains("open") && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
    closeModal();
  }
});

// Theme Controller (Light & Sleek Dark Mode with persistence)
const savedTheme = localStorage.getItem("portfolio-theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

const setTheme = (theme, persist = true) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) localStorage.setItem("portfolio-theme", theme);
  const textEl = $("#themeToggle .theme-mode-text");
  if (textEl) textEl.textContent = theme === "dark" ? "Light" : "Dark";
};

setTheme(initialTheme, false);

const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next, true);
  playSound("click");
  return next;
};

$("#themeToggle")?.addEventListener("click", toggleTheme);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (!localStorage.getItem("portfolio-theme")) {
    setTheme(e.matches ? "dark" : "light", false);
  }
});

// ==========================================================================
// Sound FX Synthesizer (Zero-latency Web Audio API)
// ==========================================================================
let audioCtx = null;
let soundEnabled = localStorage.getItem("portfolio-sound") === "true";

const initAudio = () => {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};

const playSound = type => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === "key") {
    // Mechanical keyboard keypress thock
    osc.type = "sine";
    const freq = 170 + Math.random() * 60;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (type === "click") {
    // Crisp tactile button click
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.start(now);
    osc.stop(now + 0.035);
  } else if (type === "modal") {
    // Subtle acoustic swoosh
    osc.type = "sine";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (type === "success") {
    // Melodic two-tone chime
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.28);
  }
};

const updateSoundUI = () => {
  const btn = $("#soundToggle");
  const icon = $("#soundToggle .sound-icon");
  if (btn && icon) {
    btn.classList.toggle("is-active", soundEnabled);
    icon.textContent = soundEnabled ? "🔊" : "🔇";
  }
};

const toggleSound = () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("portfolio-sound", String(soundEnabled));
  updateSoundUI();
  if (soundEnabled) {
    initAudio();
    playSound("click");
  }
  return soundEnabled ? "enabled" : "muted";
};

$("#soundToggle")?.addEventListener("click", toggleSound);
updateSoundUI();

// Scroll spy & reveal animations
const sections = $$("main section[id]");
const navLinks = $$(".nav-link");
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  }
}), { rootMargin: "-35% 0px -55% 0px" });
sections.forEach(section => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  }
}), { threshold: .12 });
$$(".reveal").forEach(item => revealObserver.observe(item));

// 1. Fluid Custom Cursor with Momentum & Centering
const dot = $("#cursorDot"), ring = $("#cursorRing");
let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;
let isCursorActive = false;

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (!isCursorActive) {
      ringX = mouseX;
      ringY = mouseY;
      isCursorActive = true;
      document.body.classList.add("cursor-visible");
    }
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  }, { passive: true });

  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-visible"));
  document.addEventListener("mouseenter", () => {
    if (isCursorActive) document.body.classList.add("cursor-visible");
  });

  const renderCursor = () => {
    if (isCursorActive) {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(renderCursor);
  };
  requestAnimationFrame(renderCursor);

  document.addEventListener("pointerdown", () => document.body.classList.add("cursor-press"));
  document.addEventListener("pointerup", () => document.body.classList.remove("cursor-press"));

  const registerHoverListeners = () => {
    $$("a, button, input, textarea, .project-card, .terminal-chip").forEach(item => {
      item.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      item.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  };
  registerHoverListeners();
}

// 2. Magnetic Elements Interaction
const magneticElements = $$(".magnetic");
magneticElements.forEach(el => {
  el.addEventListener("pointermove", event => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (event.clientX - centerX) * 0.35;
    const deltaY = (event.clientY - centerY) * 0.35;
    el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });
  el.addEventListener("pointerleave", () => {
    el.style.transform = "translate(0px, 0px)";
  });
});

// 3. Hero Code Card 3D Perspective Tilt & Dynamic Glare
const heroVisual = $("#heroVisual");
const codeCard = $(".code-card");
if (heroVisual && codeCard) {
  heroVisual.addEventListener("pointermove", event => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = -y * 18;
    const rotateY = x * 22;
    codeCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px)`;
    codeCard.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    codeCard.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
  });
  heroVisual.addEventListener("pointerleave", () => {
    codeCard.style.transform = "perspective(1000px) rotate(3deg)";
  });
}

// 4. Project Filters with Smooth Transition
$$(".filter").forEach(filter => filter.addEventListener("click", () => {
  playSound("click");
  $$(".filter").forEach(item => item.classList.remove("active"));
  filter.classList.add("active");
  const selected = filter.dataset.filter;
  const cards = $$(".project-card");

  cards.forEach(card => {
    const matches = selected === "all" || card.dataset.category.includes(selected);
    if (!matches) {
      card.classList.add("fade-out");
      setTimeout(() => {
        if (card.classList.contains("fade-out")) card.classList.add("hidden");
      }, 250);
    } else {
      card.classList.remove("hidden");
      requestAnimationFrame(() => card.classList.remove("fade-out"));
    }
  });
}));

// 5. Project Modal with Rich Actions & Accessible Focus Restoration
const projectData = {
  pinit: {
    title: "Pinit",
    overview: "An AI-powered concept for helping people identify potentially suspicious online content, phishing attempts, and scams.",
    problem: "Online content and links can be difficult to evaluate quickly. Pinit explores how a calmer, intuitive signal could help users pause before trusting a suspicious link.",
    learned: "Designing trustworthy digital guardrails, clear explainability, and making AI-assisted security feel approachable.",
    tech: ["AI concept", "Web Security", "Frontend"],
    actions: [
      { label: "GitHub Profile ↗", url: "https://github.com/gouvkimsea", primary: true },
      { label: "Portfolio Source ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: false }
    ]
  },
  portfolio: {
    title: "This Portfolio",
    overview: "A personal corner of the internet built to document the journey, experiments, and technical evolution.",
    problem: "Developer portfolios often feel cookie-cutter. This site was designed to make learning tangible with rich tactile micro-interactions.",
    learned: "Mastering fluid vanilla JavaScript physics, accessible dialog modals, and high-performance CSS animations.",
    tech: ["HTML5", "CSS3", "JavaScript", "GitHub Pages"],
    actions: [
      { label: "GitHub Repository ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: true },
      { label: "Live Deployment ↗", url: "https://gouvkimsea.github.io/my-Portfolio-/", primary: false }
    ]
  }
};

const modal = $("#projectModal");
let previousActiveElement = null;

const openModal = projectKey => {
  const data = projectData[projectKey];
  if (!data) return;
  previousActiveElement = document.activeElement;
  $("#modalTitle").textContent = data.title;
  $("#modalOverview").textContent = data.overview;
  $("#modalProblem").textContent = data.problem;
  $("#modalLearned").textContent = data.learned;
  $("#modalTech").innerHTML = data.tech.map(item => `<span>${item}</span>`).join("");
  $("#modalActions").innerHTML = data.actions.map(act =>
    `<a class="modal-btn ${act.primary ? '' : 'secondary'}" href="${act.url}" target="_blank" rel="noreferrer">${act.label}</a>`
  ).join("");
  playSound("modal");
  modal.showModal();
  $("#modalClose")?.focus();
};

const closeModal = () => {
  if (modal?.open) {
    playSound("modal");
    modal.close();
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }
  }
};

$$(".project-open").forEach(button => button.addEventListener("click", () => {
  const card = button.closest(".project-card");
  if (card) openModal(card.dataset.project);
}));
$("#modalClose")?.addEventListener("click", closeModal);
modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });

// 6. Interactive Terminal with History, Tab Autocomplete & Quick Chips
const terminal = $("#terminal");
const terminalOutput = $("#terminalOutput");
const terminalInput = $("#terminalInput");
const commandHistory = [];
let historyIndex = -1;

const terminalCommands = {
  help: "Available commands: <b>about</b>, <b>skills</b>, <b>projects</b>, <b>theme</b>, <b>sound</b>, <b>contact</b>, <b>whoami</b>, <b>github</b>, <b>date</b>, <b>cat about-me.js</b>, <b>clear</b>",
  about: "Gouv Kimsea — University student exploring software development, business, and technology by building real projects.",
  skills: "JavaScript · C++ · Python · HTML5 / CSS3 · React · REST APIs · Node.js · SQL · Databases",
  projects: "1. <b>Pinit</b> — AI scam and suspicious link detector concept\n2. <b>Portfolio</b> — Personal portfolio built with vanilla CSS & JS\nType 'projects' or click a project card to view details.",
  theme: () => {
    const next = toggleTheme();
    return `Theme switched to <b>${next}</b> mode.`;
  },
  sound: () => {
    const status = toggleSound();
    return `Sound FX ${status}.`;
  },
  contact: "Email: <a href='mailto:gouvkimsea@gmail.com' style='color:var(--lime)'>gouvkimsea@gmail.com</a> | GitHub: <a href='https://github.com/gouvkimsea' target='_blank' style='color:var(--lime)'>github.com/gouvkimsea</a>",
  whoami: "guest@gouvkimsea.dev — welcome, curious visitor!",
  github: "Opening GitHub profile in a new tab...",
  date: () => new Date().toLocaleString(),
  sudo: "Permission denied: You are already in full control of this portfolio.",
  "cat about-me.js": "const developer = {\n  name: 'Gouv Kimsea',\n  focus: 'building & learning',\n  status: 'curious',\n  coffee: true\n};"
};

const executeCommand = rawCommand => {
  const command = rawCommand.trim();
  if (!command) return;
  commandHistory.push(command);
  historyIndex = commandHistory.length;

  const lower = command.toLowerCase();
  if (lower === "clear") {
    terminalOutput.innerHTML = "";
    return;
  }

  if (lower === "github") {
    window.open("https://github.com/gouvkimsea", "_blank", "noreferrer");
  }

  let response;
  if (typeof terminalCommands[lower] === "function") {
    response = terminalCommands[lower]();
  } else if (terminalCommands[lower]) {
    response = terminalCommands[lower];
  } else if (lower.startsWith("echo ")) {
    response = command.slice(5);
  } else {
    response = `Command not found: <b>${command}</b>. Type <b>help</b> to see options.`;
  }

  terminalOutput.insertAdjacentHTML("beforeend", `<p><span class="command">$ ${command}</span></p><p>${response.replace(/\n/g, "<br/>")}</p>`);
  terminal.scrollTop = terminal.scrollHeight;
};

$("#terminalForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const val = terminalInput.value;
  terminalInput.value = "";
  executeCommand(val);
});

terminal?.addEventListener("click", event => {
  if (!event.target.closest("button") && !event.target.closest("a")) {
    terminalInput?.focus();
  }
});

$$(".terminal-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    playSound("click");
    const cmd = chip.dataset.cmd;
    if (cmd) {
      terminalInput.value = cmd;
      terminalInput.focus();
      executeCommand(cmd);
      terminalInput.value = "";
    }
  });
});

terminalInput?.addEventListener("keydown", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    }
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = "";
    }
  } else if (event.key === "Tab") {
    event.preventDefault();
    const current = terminalInput.value.trim().toLowerCase();
    if (current) {
      const match = Object.keys(terminalCommands).find(k => k.startsWith(current));
      if (match) terminalInput.value = match;
    }
  } else if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
    playSound("key");
  }
});

// 7. Contact Form Real-time Validation & Interactive Feedback
const contactForm = $("#contactForm");
const submitBtn = $("#submitBtn");
const formStatus = $(".form-status");

const formRules = [
  [$("#name"), "Please add your name.", value => value.trim().length > 0],
  [$("#email"), "Please enter a valid email.", value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())],
  [$("#message"), "Please write at least 20 characters.", value => value.trim().length >= 20]
];

const validateField = (input, message, test) => {
  const row = input.closest(".form-row");
  const error = $(".error-message", row);
  const ok = test(input.value);
  row.classList.toggle("invalid", !ok);
  row.classList.toggle("valid", ok && input.value.trim().length > 0);
  error.textContent = ok ? "" : message;
  return ok;
};

formRules.forEach(([input, message, test]) => {
  input?.addEventListener("input", () => {
    if (input.closest(".form-row").classList.contains("invalid")) {
      validateField(input, message, test);
    }
  });
  input?.addEventListener("blur", () => {
    if (input.value.trim()) {
      validateField(input, message, test);
    }
  });
});

contactForm?.addEventListener("submit", event => {
  event.preventDefault();
  let allValid = true;
  formRules.forEach(([input, message, test]) => {
    const ok = validateField(input, message, test);
    allValid = allValid && ok;
  });

  if (allValid) {
    submitBtn.classList.add("is-sending");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Sending... <span>↻</span>";
    formStatus.textContent = "";

    setTimeout(() => {
      submitBtn.classList.remove("is-sending");
      submitBtn.innerHTML = originalText;
      playSound("success");
      formStatus.textContent = "✓ Thanks, Gouv received your note!";
      formStatus.style.color = "#648b4a";
      contactForm.reset();
      $$(".form-row", contactForm).forEach(row => {
        row.classList.remove("valid", "invalid");
        $(".error-message", row).textContent = "";
      });
      setTimeout(() => { formStatus.textContent = ""; }, 5000);
    }, 700);
  } else {
    formStatus.textContent = "Please check the highlighted fields.";
    formStatus.style.color = "#b34834";
  }
});
