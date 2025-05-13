document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const codeOutput = document.getElementById('codeOutput');
    const copyBtn = document.getElementById('copyBtn');

    let isProcessing = false;
    let lastQuestion = '';

    // Prediction API endpoints
    const PREDICT_API = "https://predict-iota.vercel.app/predict";
    const STORE_API = "https://predict-iota.vercel.app/store";
    let currentPrompt = "";
    let hintText = "";
    let suggestionActive = false;
    let history = [];

    sendBtn.addEventListener('click', handleInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
            e.preventDefault();
            handleInput();
        }
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeOutput.textContent)
            .then(() => alert('Code copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    });

    async function getNextWords(prompt) {
        try {
            const response = await fetch(PREDICT_API, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({prompt})
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            return data.next_words || [];
        } catch (e) {
            console.error("Prediction error:", e);
            return [];
        }
    }

    async function storePrompt(prompt) {
        try {
            const response = await fetch(STORE_API, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({prompt})
            });
            if (!response.ok) throw new Error(await response.text());
            return await response.json();
        } catch (e) {
            console.error("Storage error:", e);
        }
    }

    function throttle(func, wait) {
        let timeout;
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= wait) {
                lastCall = now;
                return func(...args);
            }
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                lastCall = now;
                func(...args);
            }, wait - (now - lastCall));
        };
    }

    const throttledPredict = throttle(async (prompt) => {
        const nextWords = await getNextWords(prompt.trim());
        if (nextWords && nextWords.length > 0 && suggestionActive) {
            hintText = " " + nextWords.join(" ");
            const fullText = prompt + hintText;
            userInput.value = fullText;
            const start = prompt.length;
            userInput.setSelectionRange(start, fullText.length);
        } else {
            hintText = "";
            suggestionActive = false;
        }
    }, 500);

    userInput.addEventListener("input", (e) => {
        const prompt = e.target.value;
        const cursorPos = userInput.selectionStart;
        currentPrompt = prompt;
        if (suggestionActive) {
            hintText = "";
            suggestionActive = false;
        } else {
            suggestionActive = true;
        }

        if (prompt && !hintText) {
            throttledPredict(prompt);
        } else if (!prompt) {
            hintText = "";
            suggestionActive = false;
        }
        userInput.setSelectionRange(cursorPos, cursorPos);
    });

    userInput.addEventListener("keydown", (e) => {
        const cursorPos = userInput.selectionStart;
        if (e.key === "Tab" && suggestionActive) {
            e.preventDefault();
            history.push(currentPrompt);
            currentPrompt = currentPrompt.trim() + " " + hintText.trim();
            userInput.value = currentPrompt;
            hintText = "";
            suggestionActive = false;
            userInput.setSelectionRange(currentPrompt.length, currentPrompt.length);
        } else if (e.ctrlKey && e.key === "z" && history.length > 0) {
            e.preventDefault();
            currentPrompt = history.pop();
            userInput.value = currentPrompt;
            hintText = "";
            suggestionActive = false;
            userInput.setSelectionRange(cursorPos, cursorPos);
        }
    });

    async function handleInput() {
        const originalQuestion = userInput.value.trim();
        if (!originalQuestion || isProcessing) return;

        userInput.value = '';
        currentPrompt = "";
        hintText = "";
        suggestionActive = false;
        history = [];

        isProcessing = true;
        sendBtn.disabled = true;

        lastQuestion = originalQuestion;
        const modifiedQuestion = `I will provide you with a message. Your primary goal is to understand the user's likely intent behind the message and respond appropriately in the shortest possible complete answer. You identify as \"Zorvik AI,\" an AI created by Team Zorvik, which includes team members Vikash Kumar Singh, Varun Singh, and Shri Ram Sain, made in India. Only mention this identity if the user directly asks about who you are, who created you, your origin, or similar identity-related questions. For all other questions, focus on providing a concise and complete answer based on your knowledge. You have a professional understanding of emojis and their common use in communication to convey emotions and implied meanings. If the message contains emojis, interpret them within the context of the entire message to understand the user's feeling or intention. For example, if the user sends \"😤hie,\" recognize that the \"face with steam from nose\" emoji combined with \"hie\" likely expresses a frustrated or impatient greeting, and respond accordingly rather than just defining the emoji and the word separately. Do not treat regular text as emojis. Answer should be concise but complete and address the likely intent. Here is my message: \"${originalQuestion}\"`;

        appendMessage('You', originalQuestion, 'user');
        await storePrompt(originalQuestion);

        try {
            appendThinkingMessage();
            const response = await callGeminiApi(modifiedQuestion);
            removeLastMessage();
            appendMessage('Zorvik AI', response || 'No response content received.', 'ai');
        } catch (error) {
            removeLastMessage();
            appendMessage('Zorvik AI', `Error: ${error.message}`, 'ai');
            console.error('Full Error:', error);
        } finally {
            isProcessing = false;
            sendBtn.disabled = false;
        }
    }

    function appendMessage(sender, text, senderType) {
        const message = document.createElement('div');
        message.classList.add('message', senderType);
        const strong = document.createElement('strong');
        strong.textContent = `${sender}: `;
        const content = document.createElement('span');
        content.classList.add('message-content');
        content.style.fontWeight = '300';
        content.innerHTML = text;
        message.appendChild(strong);
        message.appendChild(content);
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function appendThinkingMessage() {
        const message = document.createElement('div');
        message.classList.add('message', 'ai');
        const strong = document.createElement('strong');
        strong.textContent = 'Zorvik AI: ';
        const content = document.createElement('span');
        content.classList.add('message-content', 'thinking-dots');
        content.innerHTML = 'Thinking<span style="--i:1">.</span><span style="--i:2">.</span><span style="--i:3">.</span>';
        message.appendChild(strong);
        message.appendChild(content);
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function removeLastMessage() {
        const lastMessage = chatBox.lastElementChild;
        if (lastMessage) {
            chatBox.removeChild(lastMessage);
        }
    }

    async function callGeminiApi(prompt) {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE}`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: API_CONFIG.DEFAULT_PARAMS.maxTokens,
                temperature: API_CONFIG.DEFAULT_PARAMS.temperature,
                topP: API_CONFIG.DEFAULT_PARAMS.topP
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': import.meta.env.env.VITE_GEMINI_API_KEY
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 30 seconds');
            }
            throw error;
        }
    }
});
