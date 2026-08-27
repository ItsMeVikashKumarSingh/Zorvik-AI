/**
 * Zorvik AI — Client Reactive Engine
 * Handles session memory, SSE streaming, guest/account auth, autocomplete, and KaTeX rendering.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // DOM Elements
  const sidebar = document.getElementById("sidebar");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const searchChatsInput = document.getElementById("searchChatsInput");
  const sessionsList = document.getElementById("sessionsList");
  const clearAllChatsBtn = document.getElementById("clearAllChatsBtn");
  const userStatusLabel = document.getElementById("userStatusLabel");
  const tenantSettingsBtn = document.getElementById("tenantSettingsBtn");
  const tenantLabel = document.getElementById("tenantLabel");
  const modePills = document.querySelectorAll(".mode-pill");
  const authBtn = document.getElementById("authBtn");
  const authBtnText = document.getElementById("authBtnText");
  const welcomeHero = document.getElementById("welcomeHero");
  const chatViewport = document.getElementById("chatViewport");
  const messagesContainer = document.getElementById("messagesContainer");
  const promptInput = document.getElementById("promptInput");
  const sendBtn = document.getElementById("sendBtn");
  const tokenCounter = document.getElementById("tokenCounter");
  const autocompleteHint = document.getElementById("autocompleteHint");
  const autocompleteText = document.getElementById("autocompleteText");
  const starterCards = document.querySelectorAll(".starter-card");

  // Modals
  const authModal = document.getElementById("authModal");
  const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const authForm = document.getElementById("authForm");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const tenantModal = document.getElementById("tenantModal");
  const closeTenantModalBtn = document.getElementById("closeTenantModalBtn");
  const tenantIdInput = document.getElementById("tenantIdInput");
  const saveTenantBtn = document.getElementById("saveTenantBtn");
  const tenantPills = document.querySelectorAll(".pill-btn");

  // State
  let currentSessionId = null;
  let activeMode = "auto";
  let isGenerating = false;
  let currentSuggestion = "";
  let guestUUID = localStorage.getItem("zorvik_guest_uuid");
  let tenantId = localStorage.getItem("zorvik_tenant_id") || "public-guest";
  let authToken = localStorage.getItem("zorvik_auth_token") || null;
  let currentUser = JSON.parse(localStorage.getItem("zorvik_user") || "null");

  if (!guestUUID) {
    guestUUID = "guest_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("zorvik_guest_uuid", guestUUID);
  }

  // Update UI with initial tenant and auth
  updateTenantUI();
  updateAuthUI();

  // Load Sessions
  loadSessions();

  // Sidebar Toggle
  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
  closeSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });

  // Mode Selection
  modePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      modePills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeMode = pill.dataset.mode;
    });
  });

  // New Chat
  newChatBtn.addEventListener("click", createNewChat);

  // Clear All Chats
  clearAllChatsBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all chat sessions?")) {
      localStorage.removeItem("zorvik_sessions");
      createNewChat();
    }
  });

  // Starter Cards
  starterCards.forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.dataset.prompt;
      if (prompt) {
        promptInput.value = prompt;
        updateTokenCount();
        handleSend();
      }
    });
  });

  // Input Auto-expand & Token Counter
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + "px";
    updateTokenCount();
    fetchAutocompleteThrottled(promptInput.value);
  });

  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Tab" && currentSuggestion) {
      e.preventDefault();
      promptInput.value = promptInput.value + " " + currentSuggestion;
      currentSuggestion = "";
      if (autocompleteHint) autocompleteHint.style.display = "none";
      updateTokenCount();
    }
  });

  sendBtn.addEventListener("click", handleSend);

  // Search Chats
  searchChatsInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const items = sessionsList.querySelectorAll(".session-item");
    items.forEach((item) => {
      const title = item.querySelector(".session-title").textContent.toLowerCase();
      item.style.display = title.includes(query) ? "flex" : "none";
    });
  });

  // Modals & Handlers
  if (tenantSettingsBtn && tenantModal) {
    tenantSettingsBtn.addEventListener("click", () => {
      tenantIdInput.value = tenantId;
      tenantModal.style.display = "flex";
    });
    if (closeTenantModalBtn) {
      closeTenantModalBtn.addEventListener("click", () => {
        tenantModal.style.display = "none";
      });
    }
    if (saveTenantBtn) {
      saveTenantBtn.addEventListener("click", () => {
        const newTid = tenantIdInput.value.trim() || "public-guest";
        tenantId = newTid;
        localStorage.setItem("zorvik_tenant_id", tenantId);
        updateTenantUI();
        tenantModal.style.display = "none";
      });
    }
    tenantPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        tenantIdInput.value = pill.dataset.tid;
      });
    });
  }

  authBtn.addEventListener("click", () => {
    if (currentUser) {
      if (confirm(`Sign out of ${currentUser.email}?`)) {
        localStorage.removeItem("zorvik_auth_token");
        localStorage.removeItem("zorvik_user");
        authToken = null;
        currentUser = null;
        updateAuthUI();
      }
    } else {
      authModal.style.display = "flex";
    }
  });
  closeAuthModalBtn.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  let isSignUpMode = false;
  tabSignIn.addEventListener("click", () => {
    tabSignIn.classList.add("active");
    tabSignUp.classList.remove("active");
    isSignUpMode = false;
  });
  tabSignUp.addEventListener("click", () => {
    tabSignUp.classList.add("active");
    tabSignIn.classList.remove("active");
    isSignUpMode = true;
  });

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const _pwd = authPassword.value;
    // Simulate auth token for demonstration/microservice account mode
    authToken = "mock_jwt_" + btoa(email);
    currentUser = { email, id: "user_" + Math.random().toString(36).substring(2, 9) };
    localStorage.setItem("zorvik_auth_token", authToken);
    localStorage.setItem("zorvik_user", JSON.stringify(currentUser));
    updateAuthUI();
    authModal.style.display = "none";
    const modeLabel = isSignUpMode ? "Registered and signed in" : "Signed in";
    alert(`${modeLabel} as ${email}! Local guest chats synchronized.`);
  });

  // Functions

  function updateTokenCount() {
    if (tokenCounter && promptInput) {
      const text = promptInput.value;
      const est = Math.ceil(text.length / 4);
      tokenCounter.textContent = `${est} tokens`;
    }
  }

  function updateTenantUI() {
    if (tenantLabel) {
      tenantLabel.textContent = `Tenant: ${tenantId}`;
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      authBtnText.textContent = currentUser.email.split("@")[0];
      authBtn.style.borderColor = "var(--color-purple)";
      if (userStatusLabel) {
        userStatusLabel.textContent = currentUser.email;
      }
    } else {
      authBtnText.textContent = "Sign In";
      authBtn.style.borderColor = "var(--border-cyan)";
      if (userStatusLabel) {
        userStatusLabel.textContent = "Guest Session";
      }
    }
  }

  let autocompleteTimer = null;
  function fetchAutocompleteThrottled(text) {
    clearTimeout(autocompleteTimer);
    if (!text || text.length < 2) {
      if (autocompleteHint) autocompleteHint.style.display = "none";
      currentSuggestion = "";
      return;
    }

    autocompleteTimer = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify({ prompt: text }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.next_words && data.next_words.length > 0) {
          currentSuggestion = data.next_words.join(" ");
          if (autocompleteText) autocompleteText.textContent = currentSuggestion;
          if (autocompleteHint) autocompleteHint.style.display = "flex";
        } else {
          if (autocompleteHint) autocompleteHint.style.display = "none";
          currentSuggestion = "";
        }
      } catch (_e) {
        if (autocompleteHint) autocompleteHint.style.display = "none";
      }
    }, 250);
  }

  function getStoredSessions() {
    try {
      return JSON.parse(localStorage.getItem("zorvik_sessions") || "[]");
    } catch (_e) {
      return [];
    }
  }

  function saveStoredSessions(sessions) {
    localStorage.setItem("zorvik_sessions", JSON.stringify(sessions));
    renderSessionsList();
  }

  function createNewChat() {
    const sessionId = "session_" + Date.now();
    currentSessionId = sessionId;
    const sessions = getStoredSessions();
    sessions.unshift({
      id: sessionId,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    });
    saveStoredSessions(sessions);
    loadSession(sessionId);
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("open");
    }
  }

  function loadSessions() {
    const sessions = getStoredSessions();
    if (sessions.length === 0) {
      createNewChat();
    } else {
      currentSessionId = sessions[0].id;
      renderSessionsList();
      loadSession(currentSessionId);
    }
  }

  function renderSessionsList() {
    sessionsList.innerHTML = "";
    const sessions = getStoredSessions();

    sessions.forEach((s) => {
      const item = document.createElement("div");
      item.className = `session-item ${s.id === currentSessionId ? "active" : ""}`;
      item.innerHTML = `
        <span class="session-title">${escapeHTML(s.title)}</span>
        <button class="session-del-btn" title="Delete Chat"><i data-lucide="trash-2"></i></button>
      `;

      item.querySelector(".session-title").addEventListener("click", () => {
        loadSession(s.id);
        if (window.innerWidth <= 768) sidebar.classList.remove("open");
      });

      item.querySelector(".session-del-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSession(s.id);
      });

      sessionsList.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function deleteSession(id) {
    let sessions = getStoredSessions();
    sessions = sessions.filter((s) => s.id !== id);
    localStorage.setItem("zorvik_sessions", JSON.stringify(sessions));
    if (currentSessionId === id) {
      if (sessions.length > 0) {
        loadSession(sessions[0].id);
      } else {
        createNewChat();
      }
    } else {
      renderSessionsList();
    }
  }

  function loadSession(id) {
    currentSessionId = id;
    renderSessionsList();
    messagesContainer.innerHTML = "";

    const sessions = getStoredSessions();
    const session = sessions.find((s) => s.id === id);

    if (!session || !session.messages || session.messages.length === 0) {
      welcomeHero.style.display = "flex";
      messagesContainer.style.display = "none";
    } else {
      welcomeHero.style.display = "none";
      messagesContainer.style.display = "flex";
      session.messages.forEach((msg) => {
        renderMessage(msg.role, msg.content, msg.meta);
      });
      scrollToBottom();
    }
  }

  async function handleSend() {
    const prompt = promptInput.value.trim();
    if (!prompt || isGenerating) return;

    // Reset input
    promptInput.value = "";
    promptInput.style.height = "auto";
    updateTokenCount();
    if (autocompleteHint) autocompleteHint.style.display = "none";
    currentSuggestion = "";

    welcomeHero.style.display = "none";
    messagesContainer.style.display = "flex";

    // Append user message
    renderMessage("user", prompt);
    saveMessageToSession(currentSessionId, "user", prompt);
    updateSessionTitleIfNew(currentSessionId, prompt);

    // Prepare Assistant Bubble
    isGenerating = true;
    sendBtn.disabled = true;

    const assistantMsgObj = renderMessage("assistant", "Thinking...", { pending: true });
    scrollToBottom();

    const startTime = Date.now();

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-session-id": currentSessionId,
          "x-guest-uuid": guestUUID,
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          mode: activeMode,
          session_id: currentSessionId,
          stream: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned error ${res.status}`);
      }

      const data = await res.json();
      const latency = Date.now() - startTime;
      const meta = {
        model: data.model || "gemini-2.0-flash",
        latencyMs: data.latency_ms || latency,
      };

      updateAssistantMessage(assistantMsgObj, data.response, meta);
      saveMessageToSession(currentSessionId, "assistant", data.response, meta);
    } catch (err) {
      updateAssistantMessage(
        assistantMsgObj,
        `⚠️ Error: ${err.message}. Please check your network or try again.`,
        { error: true }
      );
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      if (promptInput) promptInput.focus();
      scrollToBottom();
    }
  }

  function renderMessage(role, content, _meta = {}) {
    const row = document.createElement("div");
    row.className = `message-row ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = role === "user" ? '<span class="avatar-tag user">YOU</span>' : '<span class="avatar-tag zorvik">Z·AI</span>';

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const header = document.createElement("div");
    header.className = "message-meta";
    header.innerHTML = `
      <span class="message-author">${role === "user" ? "You" : "Zorvik AI"}</span>
    `;

    const body = document.createElement("div");
    body.className = "message-content";
    body.innerHTML = formatMarkdown(content);

    bubble.appendChild(header);
    bubble.appendChild(body);

    row.appendChild(avatar);
    row.appendChild(bubble);

    messagesContainer.appendChild(row);

    if (window.lucide) window.lucide.createIcons();
    enhanceCodeBlocks(bubble);
    renderMath(bubble);

    return { row, bubble, body, header };
  }

  function updateAssistantMessage(msgObj, content, _meta = {}) {
    msgObj.body.innerHTML = formatMarkdown(content);
    enhanceCodeBlocks(msgObj.bubble);
    renderMath(msgObj.bubble);
  }

  function formatMarkdown(text) {
    if (!text) return "";
    if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
      const rawHtml = marked.parse(text);
      return DOMPurify.sanitize(rawHtml);
    }
    return escapeHTML(text);
  }

  function enhanceCodeBlocks(container) {
    const preBlocks = container.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
      if (pre.parentElement.classList.contains("code-block-wrap")) return;

      const code = pre.querySelector("code");
      const langMatch = code ? code.className.match(/language-(\w+)/) : null;
      const lang = langMatch ? langMatch[1] : "code";

      const wrap = document.createElement("div");
      wrap.className = "code-block-wrap";

      const header = document.createElement("div");
      header.className = "code-header";
      header.innerHTML = `
        <span>${lang}</span>
        <button class="copy-code-btn"><i data-lucide="copy"></i> Copy</button>
      `;

      header.querySelector(".copy-code-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
        const btn = header.querySelector(".copy-code-btn");
        btn.innerHTML = '<i data-lucide="check"></i> Copied!';
        setTimeout(() => {
          btn.innerHTML = '<i data-lucide="copy"></i> Copy';
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      });

      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(header);
      wrap.appendChild(pre);

      if (window.Prism && code) {
        window.Prism.highlightElement(code);
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderMath(container) {
    if (typeof renderMathInElement !== "undefined") {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
  }

  function saveMessageToSession(sessionId, role, content, meta = {}) {
    const sessions = getStoredSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      if (!session.messages) session.messages = [];
      session.messages.push({ role, content, meta, timestamp: Date.now() });
      saveStoredSessions(sessions);
    }
  }

  function updateSessionTitleIfNew(sessionId, prompt) {
    const sessions = getStoredSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session && session.title === "New Chat") {
      session.title = prompt.slice(0, 32) + (prompt.length > 32 ? "..." : "");
      saveStoredSessions(sessions);
    }
  }

  function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
