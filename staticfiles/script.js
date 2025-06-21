document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const botAvatar = "/static/data/bot.png"; // Use direct static path
    const userAvatar = "/static/data/user.png"; // Use direct static path

    // Function to add a message to the chat window
    function addMessage(sender, text, avatarUrl) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        const avatarImg = document.createElement('img');
        avatarImg.src = avatarUrl;
        avatarImg.alt = sender + " avatar";
        avatarImg.classList.add('avatar');

        const messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('message-content');
        const paragraph = document.createElement('p');
        paragraph.textContent = text; // Use textContent for security
        messageContentDiv.appendChild(paragraph);

        if (sender === 'user') {
            messageDiv.appendChild(messageContentDiv); // Content first for user
            messageDiv.appendChild(avatarImg);
        } else {
            messageDiv.appendChild(avatarImg); // Avatar first for bot
            messageDiv.appendChild(messageContentDiv);
            // Removed scrollToBottom();
        }
        chatWindow.appendChild(messageDiv);
        scrollToBottom(); // Always scroll to bottom after adding a message
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot-message', 'typing-indicator-container'); // Use bot-message for alignment
        typingDiv.id = 'typing-indicator'; // For easy removal

        const avatarImg = document.createElement('img');
        avatarImg.src = botAvatar;
        avatarImg.alt = "Bot avatar";
        avatarImg.classList.add('avatar');
        const indicatorContent = document.createElement('div');
        indicatorContent.classList.add('message-content'); // To match styling
        indicatorContent.style.backgroundColor = 'transparent'; // No bubble for indicator itself
        const typingDots = document.createElement('div');
        typingDots.classList.add('typing-indicator');
        typingDots.innerHTML = '<span></span><span></span><span></span>';
        indicatorContent.appendChild(typingDots);
        typingDiv.appendChild(avatarImg);
        typingDiv.appendChild(indicatorContent);
        chatWindow.appendChild(typingDiv);
        // Removed scrollToBottom();
    }

    // Function to hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Function to simulate bot response
    function getBotResponse(userMessage) {
        showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator();
            
            let botText = "I received: " + userMessage;
            if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
                botText = "Hello there! How can I assist you?";
            } else if (userMessage.toLowerCase().includes("how are you")) {
                botText = "I'm just a bunch of code, but I'm doing great! Thanks for asking.";
            } else if (userMessage.toLowerCase().includes("bye")) {
                botText = "Goodbye! Have a great day!";
            } else if (userMessage.toLowerCase().includes("name")) {
                botText = "I am a Simple Chatbot. You can call me Sim.";
            }
            addMessage('bot', botText, botAvatar);
            // Removed scrollToBottom();
        }, Math.random() * 1500 + 500); // Simulate network delay
    }

    // Function to scroll to the bottom of the chat window
    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto'; // Reset height
        messageInput.style.height = (messageInput.scrollHeight) + 'px'; // Set to scroll height
         // Prevent excessive growth
        if (messageInput.scrollHeight > 100) {
            messageInput.style.overflowY = 'auto';
        } else {
            messageInput.style.overflowY = 'hidden';
        }
    });
    
    // Function to add a bot message with typing effect
    async function addBotMessageTyping(text, avatarUrl) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');

        const avatarImg = document.createElement('img');
        avatarImg.src = avatarUrl;
        avatarImg.alt = 'bot avatar';
        avatarImg.classList.add('avatar');

        const messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('message-content');
        const paragraph = document.createElement('p');
        messageContentDiv.appendChild(paragraph);

        messageDiv.appendChild(avatarImg);
        messageDiv.appendChild(messageContentDiv);
        chatWindow.appendChild(messageDiv);
        scrollToBottom();

        // Format text: convert line breaks to <br> and bullet points to <ul><li>
        function formatBotText(str) {
            // Bullet points
            if (str.includes('\n- ')) {
                const lines = str.split(/\n/);
                let html = '';
                let inList = false;
                for (let line of lines) {
                    if (line.startsWith('- ')) {
                        if (!inList) { html += '<ul>'; inList = true; }
                        html += '<li>' + line.slice(2) + '</li>';
                    } else {
                        if (inList) { html += '</ul>'; inList = false; }
                        html += line + '<br>';
                    }
                }
                if (inList) html += '</ul>';
                return html;
            }
            // Otherwise, just line breaks
            return str.replace(/\n/g, '<br>');
        }

        const words = text.split(' ');
        let current = '';
        for (let i = 0; i < words.length; i++) {
            current += (i > 0 ? ' ' : '') + words[i];
            paragraph.innerHTML = formatBotText(current);
            scrollToBottom();
            await new Promise(res => setTimeout(res, 50));
        }
    }

    // Function to handle sending a message
    async function handleSendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText !== "") {
            addMessage('user', messageText, userAvatar);
            messageInput.value = "";
            messageInput.style.height = 'auto'; // Reset height after sending
            messageInput.focus();
            showTypingIndicator();
            try {
                console.log('Sending to backend:', messageText); // Debug log
                const response = await fetch('/callbot/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken(),
                    },
                    body: JSON.stringify({ userMessage: messageText })
                });
                const data = await response.json();
                console.log('Received from backend:', data); // Debug log
                hideTypingIndicator();
                await addBotMessageTyping(data.botText, botAvatar);
            } catch (error) {
                console.error('Error in fetch:', error); // Debug log
                hideTypingIndicator();
                addMessage('bot', 'Sorry, there was an error. Please try again.', botAvatar);
            }
        }
    }

    // Helper to get CSRF token for Django
    function getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === ('csrftoken=')) {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Event listeners
    sendButton.addEventListener('click', handleSendMessage);

    messageInput.addEventListener('keypress', (event) => {
        // Send message on Enter key, but allow Shift+Enter for newline
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevents adding a newline in the textarea
            handleSendMessage();
        }
    });
});