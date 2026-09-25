const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

window.addEventListener("load", () => setTimeout(() => $("#loader")?.classList.add("done"), 450));

const header = $(".site-header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

const menuToggle = $("#menuToggle");
const menu = $("#mainMenu");
const closeMenu = () => { menu.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); };
menuToggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
$$(".nav-link").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("click", event => {
  if (menu.classList.contains("open") && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeMenu(); $("#projectModal")?.close(); } });

const sections = $$("main section[id]");
const navLinks = $$(".nav-link");
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
}), { rootMargin: "-35% 0px -55% 0px" });
sections.forEach(section => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add("visible"); revealObserver.unobserve(entry.target); }
}), { threshold: .12 });
$$(".reveal").forEach(item => revealObserver.observe(item));

const dot = $("#cursorDot"), ring = $("#cursorRing");
window.addEventListener("pointermove", event => {
  dot.style.transform = `translate(${event.clientX - 3}px, ${event.clientY - 3}px)`;
  ring.style.transform = `translate(${event.clientX - 15}px, ${event.clientY - 15}px)`;
}, { passive: true });
$$("a, button, input, textarea").forEach(item => {
  item.addEventListener("mouseenter", () => { ring.style.width = "44px"; ring.style.height = "44px"; });
  item.addEventListener("mouseleave", () => { ring.style.width = "30px"; ring.style.height = "30px"; });
});

const heroVisual = $("#heroVisual");
heroVisual.addEventListener("pointermove", event => {
  const rect = heroVisual.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - .5;
  const y = (event.clientY - rect.top) / rect.height - .5;
  $(".code-card").style.transform = `rotate(3deg) translate(${x * 10}px, ${y * 10}px)`;
});
heroVisual.addEventListener("pointerleave", () => { $(".code-card").style.transform = "rotate(3deg)"; });

$$(".filter").forEach(filter => filter.addEventListener("click", () => {
  $$(".filter").forEach(item => item.classList.remove("active")); filter.classList.add("active");
  const selected = filter.dataset.filter;
  $$(".project-card").forEach(card => card.classList.toggle("hidden", selected !== "all" && !card.dataset.category.includes(selected)));
}));

const projectData = {
  pinit: { title: "Pinit", overview: "An early AI-powered concept for helping people identify potentially suspicious online content and scams.", problem: "Online content can be difficult to evaluate quickly. Pinit explores how a calmer, more understandable signal could help someone pause before trusting a link.", learned: "Thinking about trust, user experience, and how to make technical ideas feel approachable.", tech: ["AI concept", "Web", "Security"] },
  portfolio: { title: "This portfolio", overview: "A small personal site for showing the process behind the projects, not just polished outcomes.", problem: "A portfolio can become a list of claims. This one aims to make the learning journey visible instead.", learned: "Designing for clarity, building small interactions, and keeping content honest.", tech: ["HTML", "CSS", "JavaScript"] }
};
const modal = $("#projectModal");
$$(".project-open").forEach(button => button.addEventListener("click", () => {
  const data = projectData[button.closest(".project-card").dataset.project];
  $("#modalTitle").textContent = data.title; $("#modalOverview").textContent = data.overview;
  $("#modalProblem").textContent = data.problem; $("#modalLearned").textContent = data.learned;
  $("#modalTech").innerHTML = data.tech.map(item => `<span>${item}</span>`).join("");
  modal.showModal();
}));
$("#modalClose").addEventListener("click", () => modal.close());
modal.addEventListener("click", event => { if (event.target === modal) modal.close(); });

const terminalOutput = $("#terminalOutput");
const terminalCommands = {
  help: "Available commands: about, skills, projects, contact, clear",
  about: "Student developer building projects and learning through experimentation.",
  skills: "JavaScript · C++ · HTML/CSS · React · APIs · Databases",
  projects: "Pinit · This portfolio · more in progress",
  contact: "Email: gouvkimsea@gmail.com",
};
$("#terminalForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#terminalInput"); const command = input.value.trim().toLowerCase();
  if (!command) return;
  if (command === "clear") terminalOutput.innerHTML = "";
  else terminalOutput.insertAdjacentHTML("beforeend", `<p><span class="command">$ ${command}</span></p><p>${terminalCommands[command] || `Command not found: ${command}. Type 'help' for options.`}</p>`);
  input.value = ""; terminalOutput.parentElement.scrollTop = terminalOutput.parentElement.scrollHeight;
});

$("#contactForm").addEventListener("submit", event => {
  event.preventDefault();
  let valid = true;
  const fields = [
    [$("#name"), "Please add your name."],
    [$("#email"), "Please enter a valid email.", value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)],
    [$("#message"), "Please write at least 20 characters.", value => value.trim().length >= 20]
  ];
  fields.forEach(([input, message, test = value => value.trim()]) => {
    const row = input.closest(".form-row"); const error = $(".error-message", row); const ok = test(input.value);
    row.classList.toggle("invalid", !ok); error.textContent = ok ? "" : message; valid &&= ok;
  });
  const status = $(".form-status");
  if (valid) { status.textContent = "Thanks — your note is ready to connect to an email service."; status.style.color = "#648b4a"; event.target.reset(); }
  else { status.textContent = "Please check the highlighted fields."; status.style.color = "#b34834"; }
});
