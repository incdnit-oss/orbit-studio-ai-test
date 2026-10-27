const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const themeToggles = document.querySelectorAll(".nav-theme-toggle");
const savedTheme = localStorage.getItem("orbit-theme");

function setTheme(theme) {
  if (theme === "black" || theme === "white") {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
  themeToggles.forEach((toggle) => {
    toggle.setAttribute("aria-pressed", String(toggle.dataset.themeOption === theme));
  });
  localStorage.setItem("orbit-theme", theme);
}

setTheme(savedTheme);

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
  navigation.classList.toggle("is-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    navigation.classList.remove("is-open");
  });
});

themeToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const theme = toggle.dataset.themeOption;
    setTheme(document.documentElement.dataset.theme === theme ? "default" : theme);
  });
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const chatLauncher = document.querySelector(".chat-launcher");
const chatPanel = document.querySelector(".chat-panel");
const chatClose = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector(".chat-messages");
const chatHistory = [];

function setChatOpen(isOpen) {
  chatPanel.classList.toggle("is-open", isOpen);
  chatPanel.setAttribute("aria-hidden", String(!isOpen));
  chatLauncher.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) chatInput.focus();
}

function appendChatMessage(role, content) {
  const message = document.createElement("p");
  message.className = `chat-bubble ${role}-bubble`;
  message.textContent = content;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

chatLauncher.addEventListener("click", () => {
  setChatOpen(chatLauncher.getAttribute("aria-expanded") !== "true");
});
chatClose.addEventListener("click", () => setChatOpen(false));

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  chatInput.value = "";
  chatInput.disabled = true;
  chatForm.querySelector("button").disabled = true;
  appendChatMessage("user", message);
  const pendingMessage = appendChatMessage("assistant", "Thinking");
  pendingMessage.classList.add("is-thinking");

  try {
    const response = await fetch("/api/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1] ?? "",
      },
      body: JSON.stringify({ message, history: chatHistory }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The assistant couldn't respond.");
    pendingMessage.classList.remove("is-thinking");
    pendingMessage.textContent = result.reply;
    chatHistory.push({ role: "user", content: message }, { role: "assistant", content: result.reply });
    if (chatHistory.length > 10) chatHistory.splice(0, chatHistory.length - 10);
  } catch (error) {
    pendingMessage.classList.remove("is-thinking");
    pendingMessage.textContent = error.message || "Couldn't connect to the assistant.";
  } finally {
    chatInput.disabled = false;
    chatForm.querySelector("button").disabled = false;
    chatInput.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
