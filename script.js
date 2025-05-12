document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const codeDisplay = document.getElementById('codeDisplay');
    const codeOutput = document.getElementById('codeOutput');
    const copyBtn = document.getElementById('copyBtn');
    const suggestionsContainer = document.getElementById('suggestions');

    let isProcessing = false;
    let lastQuestion = '';
    // Next-text prediction variables
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

    // Next-text prediction functions
    async function getNextWords(prompt) {
        try {
            console.log("Fetching prediction for:", prompt);
            const response = await fetch(PREDICT_API, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({prompt})
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            console.log("API response:", data);
            return data.next_words || [];
        } catch (e) {
            console.error("Prediction error:", e);
            return [];
        }
    }

    async function storePrompt(prompt) {
        try {
            console.log("Storing prompt:", prompt);
            const response = await fetch(STORE_API, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({prompt})
            });
            if (!response.ok) throw new Error(await response.text());
            return await response.json();
        } catch (e) {
            console.error("Storage error:", e);
            throw e;
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
        console.log("Throttled predict triggered with:", prompt);
        const nextWords = await getNextWords(prompt.trim());
        console.log("Next words received:", nextWords);
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
        console.log("Input event triggered, prompt:", prompt, "cursorPos:", cursorPos);

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
        } else if (e.key === " " && !suggestionActive) {
            e.preventDefault();
            const newPrompt = currentPrompt.slice(0, cursorPos) + " " + currentPrompt.slice(cursorPos);
            currentPrompt = newPrompt;
            userInput.value = newPrompt;
            hintText = "";
            suggestionActive = true;
            const newCursorPos = cursorPos + 1;
            userInput.setSelectionRange(newCursorPos, newCursorPos);
            if (currentPrompt.trim()) {
                throttledPredict(currentPrompt);
            }
        } else if (e.key === "Enter" && suggestionActive && !e.shiftKey) {
            e.preventDefault();
            history.push(currentPrompt);
            currentPrompt = userInput.value;
            hintText = "";
            suggestionActive = false;
            userInput.value = currentPrompt;
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

    userInput.addEventListener("mousedown", (e) => {
        if (suggestionActive) {
            e.preventDefault();
        }
    });

async function handleInput() {
    const originalQuestion = userInput.value.trim();
    if (!originalQuestion || isProcessing) return;

    // Clear input immediately
    userInput.value = '';
    currentPrompt = "";
    hintText = "";
    suggestionActive = false;
    history = [];

    isProcessing = true;
    sendBtn.disabled = true;

    lastQuestion = originalQuestion;
    const modifiedQuestion = `I will provide you with a message. Your primary goal is to understand the user's likely intent behind the message and respond appropriately in the shortest possible complete answer. You identify as "Zorvik AI," an AI created by Team Zorvik, which includes team members Vikash Kumar Singh, Varun Singh, and Shri Ram Sain, made in India. Only mention this identity if the user directly asks about who you are, who created you, your origin, or similar identity-related questions. For all other questions, focus on providing a concise and complete answer based on your knowledge. You have a professional understanding of emojis and their common use in communication to convey emotions and implied meanings. If the message contains emojis, interpret them within the context of the entire message to understand the user's feeling or intention. For example, if the user sends "😤hie," recognize that the "face with steam from nose" emoji combined with "hie" likely expresses a frustrated or impatient greeting, and respond accordingly rather than just defining the emoji and the word separately. Do not treat regular text as emojis. Answer should be concise but complete and address the likely intent. Here is my message: "${originalQuestion}"`;
    appendMessage('You', originalQuestion, 'user');
    await storePrompt(originalQuestion); // Storing the original message

    try {
        appendThinkingMessage();
        const response = await callGeminiApi(modifiedQuestion);
        removeLastMessage();
        displayFormattedResponse(response || 'No response content received.');
    } catch (error) {
        removeLastMessage();
        appendMessage('Zorvik AI', `Error: ${error.message}`, 'ai');
        console.error('Full Error:', error);
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
    }
}

    // async function handleInput() {
    //     const question = userInput.value.trim();
    //     if (!question || isProcessing) return;

    //     // Clear input immediately
    //     userInput.value = '';
    //     currentPrompt = "";
    //     hintText = "";
    //     suggestionActive = false;
    //     history = [];

    //     isProcessing = true;
    //     sendBtn.disabled = true;

    //     lastQuestion = question;
    //     appendMessage('You', question, 'user');
    //     await storePrompt(question);

    //     try {
    //         appendThinkingMessage();
    //         const response = await callGeminiApi(question);
    //         removeLastMessage();
    //         displayFormattedResponse(response || 'No response content received.');
    //     } catch (error) {
    //         removeLastMessage();
    //         appendMessage('Zorvik AI', `Error: ${error.message}`, 'ai');
    //         console.error('Full Error:', error);
    //     } finally {
    //         isProcessing = false;
    //         sendBtn.disabled = false;
    //     }
    // }

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
        if (typeof MathJax !== 'undefined') {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, chatBox]);
        }
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
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                maxOutputTokens: API_CONFIG.DEFAULT_PARAMS.maxTokens,
                temperature: API_CONFIG.DEFAULT_PARAMS.temperature,
                topP: API_CONFIG.DEFAULT_PARAMS.topP
            }
        };

        console.log('--- Starting Gemini API Call ---');
        console.log('Request URL:', url);
        console.log('Request Payload:', JSON.stringify(payload));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_CONFIG.API_KEY
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
            console.log('API Response Data:', data);
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 30 seconds');
            }
            throw error;
        }
    }

    function updateResponseContainer(text, container) {
        while (container.childNodes.length > 1) {
            container.removeChild(container.lastChild);
        }

        const contentDiv = document.createElement('div');
        contentDiv.style.fontWeight = '300';

        const parsedText = parseMarkdown(text);
        const sections = parsedText.split(/---/).filter(section => section.trim());
        sections.forEach((section, index) => {
            if (index > 0) {
                const hr = document.createElement('hr');
                contentDiv.appendChild(hr);
            }

            const parts = section.split(/(```[a-z]*\s*[\s\S]*?```|\$\$[\s\S]*?\$\$)/g).filter(part => part.trim());
            parts.forEach(part => {
                if (part.match(/```[a-z]*\s*[\s\S]*?```/)) {
                    const codeContent = part.replace(/```[a-z]*\s*|\s*```/g, '').trim();
                    const pre = document.createElement('pre');
                    pre.classList.add('code-block');
                    const codeEl = document.createElement('code');
                    codeEl.textContent = codeContent;
                    pre.appendChild(codeEl);
                    contentDiv.appendChild(pre);
                } else if (part.match(/\$\$[\s\S]*?\$\$/)) {
                    const mathContent = part.replace(/\$\$/g, '').trim();
                    const p = document.createElement('p');
                    p.innerHTML = `$$${mathContent}$$`;
                    contentDiv.appendChild(p);
                } else {
                    const p = document.createElement('p');
                    p.style.fontWeight = '300';
                    p.innerHTML = part.replace(/\n/g, '<br>').replace(/\\textbf\{([^{}]*)\}/g, '<strong>$1</strong>');
                    contentDiv.appendChild(p);
                }
            });
        });

        container.appendChild(contentDiv);
        if (typeof MathJax !== 'undefined') {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
        }
    }

    function displayFormattedResponse(responseText, container = null) {
        const responseContainer = container || document.createElement('div');
        if (!container) {
            responseContainer.classList.add('response-container');
            const sender = document.createElement('strong');
            sender.textContent = 'Zorvik AI: ';
            responseContainer.appendChild(sender);
            chatBox.appendChild(responseContainer);
        }

        const normalizeText = (text) => text.trim().toLowerCase().replace(/[?.!]/g, '');
        const lines = responseText.split('\n');
        if (normalizeText(lines[0]) === normalizeText(lastQuestion)) {
            lines.shift();
        }
        let cleanedResponseText = lines.join('\n').trim();

        cleanedResponseText = cleanedResponseText
            .replace(/\\textbf\{([^{}]*)\}/g, '\\mathbf{$1}')
            .replace(/∇/g, '\\nabla')
            .replace(/\$\$([^$]+)\$\$/g, (match, p1) => {
                const fixedMath = p1.replace(/\{∂\s*\}\s*\/\s*\{∂\s*x\}/g, '\\frac{\\partial}{\\partial x}')
                                    .replace(/$$ r\sinθ\s*,\s*r\cosθ $$/g, '(-r \\sin \\theta, r \\cos \\theta)');
                return `$$${fixedMath}$$`;
            });

        const parsedText = parseMarkdown(cleanedResponseText);
        const sections = parsedText.split(/---/).filter(section => section.trim());

        sections.forEach((section, index) => {
            if (index > 0) {
                const hr = document.createElement('hr');
                responseContainer.appendChild(hr);
            }

            const sectionParts = section.split(/###\s+/).filter(part => part.trim());
            let introText = sectionParts[0].trim();
            const sectionMap = {};
            for (let i = 1; i < sectionParts.length; i++) {
                const [title, ...content] = sectionParts[i].split('\n');
                sectionMap[title.trim()] = content.join('\n').trim();
            }

            const codeMatch = introText.match(/```[a-z]*\s*([\s\S]*?)```/);
            const code = codeMatch ? codeMatch[1].trim() : null;
            introText = code ? introText.replace(codeMatch[0], '').trim() : introText;

            if (introText) {
                const introDiv = document.createElement('div');
                introDiv.style.fontWeight = '300';
                const introBlocks = introText.split(/\n{2,}/).filter(block => block.trim());
                introBlocks.forEach((block, bIdx) => {
                    const p = document.createElement('p');
                    p.style.fontWeight = '300';
                    p.style.marginBottom = bIdx < introBlocks.length - 1 ? '1em' : '0';
                    const blockLines = block.split('\n').filter(line => line.trim());
                    let formattedText = '';
                    blockLines.forEach((line, lIdx) => {
                        let formattedLine = line;
                        if (line.startsWith('- ')) {
                            formattedLine = '• ' + line.replace(/^- /, '');
                        }
                        formattedText += (lIdx > 0 ? '<br>' : '') + parseInlineCode(formattedLine);
                    });
                    p.innerHTML = formattedText;
                    introDiv.appendChild(p);
                });
                responseContainer.appendChild(introDiv);
            }

            if (code) {
                const codeSection = document.createElement('div');
                codeSection.classList.add('response-section');
                const codeTitle = document.createElement('h3');
                codeTitle.textContent = 'Code:';
                codeSection.appendChild(codeTitle);

                const pre = document.createElement('pre');
                pre.classList.add('code-block');
                const codeEl = document.createElement('code');
                codeEl.textContent = code;
                pre.appendChild(codeEl);
                codeSection.appendChild(pre);

                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.classList.add('copy-btn');
                copyCodeBtn.textContent = 'Copy Code';
                copyCodeBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(code)
                        .then(() => alert('Code copied to clipboard!'))
                        .catch(err => console.error('Failed to copy:', err));
                });
                codeSection.appendChild(copyCodeBtn);
                responseContainer.appendChild(codeSection);
            }

            for (const [title, content] of Object.entries(sectionMap)) {
                const section = document.createElement('div');
                section.classList.add('response-section');
                const sectionTitle = document.createElement('h3');
                sectionTitle.textContent = title.replace(':', '');
                section.appendChild(sectionTitle);

                const parts = content.split(/(```sh\s*[\s\S]*?```)/g).filter(part => part.trim());
                parts.forEach(part => {
                    if (part.match(/```sh\s*[\s\S]*?```/)) {
                        const commandMatch = part.match(/```sh\s*([\s\S]*?)```/);
                        const command = commandMatch[1].trim();

                        const pre = document.createElement('pre');
                        pre.classList.add('command-block');
                        pre.textContent = command;
                        section.appendChild(pre);

                        const copyCmdBtn = document.createElement('button');
                        copyCmdBtn.classList.add('copy-btn');
                        copyCmdBtn.textContent = 'Copy Command';
                        copyCmdBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(command)
                                .then(() => alert('Command copied to clipboard!'))
                                .catch(err => console.error('Failed to copy:', err));
                        });
                        section.appendChild(copyCmdBtn);
                    } else {
                        const sectionContent = document.createElement('div');
                        sectionContent.style.fontWeight = '300';
                        const paragraphs = part.split(/\n{2,}/).filter(p => p.trim());
                        paragraphs.forEach((paragraph, pIdx) => {
                            const p = document.createElement('p');
                            p.style.fontWeight = '300';
                            p.style.marginBottom = pIdx < paragraphs.length - 1 ? '1em' : '0';
                            const lines = paragraph.split('\n').filter(line => line.trim());
                            let formattedText = '';
                            lines.forEach((line, lIdx) => {
                                let formattedLine = line;
                                if (line.startsWith('- ')) {
                                    formattedLine = '• ' + line.replace(/^- /, '');
                                }
                                formattedText += (lIdx > 0 ? '<br>' : '') + parseInlineCode(formattedLine);
                            });
                            p.innerHTML = formattedText;
                            sectionContent.appendChild(p);
                        });
                        section.appendChild(sectionContent);
                    }
                });
                responseContainer.appendChild(section);
            }
        });

        if (!container) {
            chatBox.appendChild(responseContainer);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        if (!container && typeof MathJax !== 'undefined') {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, chatBox]);
        }
    }

    function parseMarkdown(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function parseInlineCode(text) {
        return text.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
    }
});