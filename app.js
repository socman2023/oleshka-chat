const CONFIG = {
  characterId: "oleshka",
  apiUrl: "https://oleshka-chat-api.boysinger2008.workers.dev/api/chat",
  useMock: false,
};

const messagesEl = document.getElementById("messages");
const composerEl = document.getElementById("composer");
const inputEl = document.getElementById("message-input");
const sendButtonEl = document.getElementById("send-button");
const statusEl = document.getElementById("connection-status");

const sessionId = getOrCreateSessionId();

initVkBridge();
resizeInput();

composerEl.addEventListener("submit", handleSubmit);
inputEl.addEventListener("input", resizeInput);
inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    composerEl.requestSubmit();
  }
});

async function handleSubmit(event) {
  event.preventDefault();

  const text = inputEl.value.trim();
  if (!text || sendButtonEl.disabled) return;

  addMessage("user", text);
  inputEl.value = "";
  resizeInput();
  setBusy(true);

  const typingEl = addTyping();

  try {
    const reply = CONFIG.useMock
      ? await mockReply(text)
      : await requestReply(text);

    typingEl.remove();
    addMessage("assistant", reply);
  } catch (error) {
    console.error(error);
    typingEl.remove();
    addMessage(
      "assistant",
      "Не получилось ответить. Попробуй ещё раз через несколько секунд."
    );
  } finally {
    setBusy(false);
    inputEl.focus();
  }
}

function addMessage(role, text) {
  const article = document.createElement("article");
  article.className = `message message--${role}`;

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";
  bubble.textContent = text;

  article.appendChild(bubble);
  messagesEl.appendChild(article);
  scrollToLatest();

  return article;
}

function addTyping() {
  const article = document.createElement("article");
  article.className = "message message--assistant message--typing";

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";
  bubble.setAttribute("aria-label", "Олешка думает");

  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("span");
    dot.className = "typing-dot";
    bubble.appendChild(dot);
  }

  article.appendChild(bubble);
  messagesEl.appendChild(article);
  scrollToLatest();

  return article;
}

function setBusy(isBusy) {
  sendButtonEl.disabled = isBusy;
  inputEl.disabled = isBusy;
}

function resizeInput() {
  inputEl.style.height = "auto";
  inputEl.style.height = `${Math.min(inputEl.scrollHeight, 160)}px`;
}

function scrollToLatest() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

async function requestReply(message) {
  const response = await fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      character: CONFIG.characterId,
      session_id: sessionId,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API returned ${response.status}`);
  }

  const data = await response.json();

  if (!data || typeof data.reply !== "string") {
    throw new Error("Chat API returned an invalid response");
  }

  return data.reply;
}

function mockReply() {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(
        "Тестовый ответ: новый интерфейс работает. Сервер и настоящий Олешка будут подключены следующим этапом."
      );
    }, 650);
  });
}

async function initVkBridge() {
  if (!window.vkBridge || typeof window.vkBridge.send !== "function") {
    document.documentElement.dataset.platform = "web";
    return;
  }

  try {
    await window.vkBridge.send("VKWebAppInit");
    document.documentElement.dataset.platform = "vk";
  } catch (error) {
    console.warn("VK Bridge init failed; continuing in regular web mode.", error);
    document.documentElement.dataset.platform = "web";
  }
}

function getOrCreateSessionId() {
  const key = "oleshka-chat-session";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const created = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, created);
  return created;
}
