// ChatUs - Frontend Logic
// Socket.io client for real-time chat functionality

class ChatApp {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.currentUser = null;
        
        // Typing indicator state
        this.typingTimer = null;
        this.isCurrentlyTyping = false;
        this.typingThrottleTimer = null;
        this.activeTypingUsers = new Set();
        this.typingDisplayTimer = null;
        
        this.init();
    }

    init() {
        // Initialize socket connection
        this.socket = io();
        this.setupSocketListeners();
        this.setupEventListeners();
        this.showScreen('landing');
    }

    setupSocketListeners() {
        // Room creation success
        this.socket.on('room-created', (data) => {
            this.hideLoading();
            this.currentRoom = data.key;
            document.getElementById('generated-key').textContent = data.key;
            this.showScreen('create-chat');
        });

        // Room join success
        this.socket.on('room-joined', (data) => {
            this.hideLoading();
            this.currentRoom = data.key;
            this.currentUser = data.name;
            document.getElementById('current-room-key').textContent = data.key;
            document.getElementById('current-user-name').textContent = data.name;
            this.showScreen('chat-room');
            this.focusMessageInput();
        });

        // Receive chat messages
        this.socket.on('chat-message', (data) => {
            this.addMessage(data.name, data.message, data.timestamp, 'user');
        });

        // Receive system messages
        this.socket.on('system-message', (data) => {
            this.addMessage(null, data.message, data.timestamp, 'system');
        });

        // Handle errors
        this.socket.on('room-error', (data) => {
            this.hideLoading();
            this.showError(data.message);
            this.updateConnectionStatus(false, data.message);
        });

        // Handle connection status
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true, 'Connected');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false, 'Disconnected');
        });

        this.socket.on('connect_error', () => {
            this.updateConnectionStatus(false, 'Connection Error');
        });

        // Handle room user count updates
        this.socket.on('room-users-update', (data) => {
            this.updateUserCount(data.count, data.users);
        });

        // Handle typing indicator updates
        this.socket.on('user-typing', (data) => {
            this.handleTypingUpdate(data);
        });
    }

    setupEventListeners() {
        // Landing screen buttons
        document.getElementById('start-chat-btn').addEventListener('click', () => {
            this.startChat();
        });

        document.getElementById('join-chat-btn').addEventListener('click', () => {
            this.showScreen('join-chat');
        });

        // Back buttons
        document.getElementById('back-from-create').addEventListener('click', () => {
            this.showScreen('landing');
        });

        document.getElementById('back-from-join').addEventListener('click', () => {
            this.showScreen('landing');
        });

        // Create chat flow
        document.getElementById('creator-name').addEventListener('input', () => {
            this.validateCreatorForm();
        });

        document.getElementById('creator-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('enter-chat-btn').disabled) {
                this.enterChatAsCreator();
            }
        });

        document.getElementById('enter-chat-btn').addEventListener('click', () => {
            this.enterChatAsCreator();
        });

        // Join chat flow
        document.getElementById('chat-key').addEventListener('input', () => {
            this.formatChatKey();
            this.validateJoinForm();
        });

        document.getElementById('joiner-name').addEventListener('input', () => {
            this.validateJoinForm();
        });

        document.getElementById('joiner-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('join-room-btn').disabled) {
                this.joinChatRoom();
            }
        });

        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinChatRoom();
        });

        // Chat room
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            } else {
                this.handleTyping();
            }
        });

        document.getElementById('message-input').addEventListener('input', () => {
            this.handleTyping();
        });

        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('leave-chat-btn').addEventListener('click', () => {
            this.leaveChat();
        });

        // Clear error when user types
        document.getElementById('chat-key').addEventListener('input', () => {
            this.hideError();
        });

        document.getElementById('joiner-name').addEventListener('input', () => {
            this.hideError();
        });
    }

    startChat() {
        this.showLoading();
        this.socket.emit('create-room');
    }

    enterChatAsCreator() {
        const name = document.getElementById('creator-name').value.trim();
        if (!name || !this.currentRoom) return;

        this.showLoading();
        this.socket.emit('join-room', {
            key: this.currentRoom,
            name: name
        });
    }

    joinChatRoom() {
        const key = document.getElementById('chat-key').value.trim();
        const name = document.getElementById('joiner-name').value.trim();
        
        if (!key || !name) return;

        this.showLoading();
        this.socket.emit('join-room', { key, name });
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || !this.currentRoom || !this.currentUser) return;

        this.socket.emit('send-message', {
            key: this.currentRoom,
            message: message,
            name: this.currentUser
        });

        input.value = '';
        this.focusMessageInput();
        
        // Stop typing indicator when message is sent
        this.stopTyping();
    }

    leaveChat() {
        // Stop typing and clear state
        this.stopTyping();
        this.activeTypingUsers.clear();
        
        // Clear timers
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        if (this.typingThrottleTimer) {
            clearTimeout(this.typingThrottleTimer);
            this.typingThrottleTimer = null;
        }
        if (this.typingDisplayTimer) {
            clearTimeout(this.typingDisplayTimer);
            this.typingDisplayTimer = null;
        }
        
        this.socket.disconnect();
        this.socket.connect();
        this.currentRoom = null;
        this.currentUser = null;
        this.clearMessages();
        
        // Reset user count display
        const userCountElement = document.getElementById('user-count');
        if (userCountElement) {
            userCountElement.textContent = '0 users';
            userCountElement.title = '';
        }
        
        // Hide typing indicator
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
            typingIndicator.classList.remove('show');
        }
        
        this.showScreen('landing');
    }

    addMessage(userName, message, timestamp, type) {
        const messagesContainer = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        const time = new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (type === 'system') {
            messageDiv.className = 'message system-message';
            messageDiv.innerHTML = `
                <div class="message-content">
                    <span class="system-text">${this.escapeHtml(message)}</span>
                    <span class="message-time">${time}</span>
                </div>
            `;
        } else {
            const isOwnMessage = userName === this.currentUser;
            messageDiv.className = `message ${isOwnMessage ? 'own-message' : 'other-message'}`;
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${this.escapeHtml(userName)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(message)}</div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    clearMessages() {
        document.getElementById('messages-container').innerHTML = '';
    }

    validateCreatorForm() {
        const name = document.getElementById('creator-name').value.trim();
        document.getElementById('enter-chat-btn').disabled = !name;
    }

    validateJoinForm() {
        const key = document.getElementById('chat-key').value.trim();
        const name = document.getElementById('joiner-name').value.trim();
        document.getElementById('join-room-btn').disabled = !(key.length === 10 && name);
    }

    formatChatKey() {
        const input = document.getElementById('chat-key');
        let value = input.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
        if (value.length > 10) value = value.substring(0, 10);
        input.value = value;
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('join-error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('join-error').style.display = 'none';
    }

    updateConnectionStatus(connected, message) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (indicator && text) {
            indicator.className = connected ? 'status-connected' : 'status-disconnected';
            text.textContent = message;
        }
    }

    updateUserCount(count, users) {
        const userCountElement = document.getElementById('user-count');
        if (userCountElement) {
            userCountElement.textContent = count === 1 ? '1 user' : `${count} users`;
            userCountElement.title = `Users online: ${users.join(', ')}`;
        }
    }

    // Typing indicator methods
    handleTyping() {
        if (!this.currentRoom || !this.currentUser) return;
        
        const input = document.getElementById('message-input');
        const isEmpty = !input || input.value.trim() === '';
        
        if (isEmpty) {
            this.stopTyping();
            return;
        }
        
        // Start typing if not already typing
        if (!this.isCurrentlyTyping) {
            this.startTyping();
        }
        
        // Reset the typing timeout
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        
        // Auto-stop typing after 2 seconds of inactivity
        this.typingTimer = setTimeout(() => {
            this.stopTyping();
        }, 2000);
    }

    startTyping() {
        if (this.isCurrentlyTyping || !this.currentRoom || !this.currentUser) return;
        
        // Throttle typing start events - don't send more than once every 2 seconds
        if (this.typingThrottleTimer) {
            return;
        }
        
        this.isCurrentlyTyping = true;
        
        // Emit typing-start event
        this.socket.emit('typing-start', {
            key: this.currentRoom,
            name: this.currentUser
        });
        
        // Set throttle timer
        this.typingThrottleTimer = setTimeout(() => {
            this.typingThrottleTimer = null;
        }, 2000);
    }

    stopTyping() {
        if (!this.isCurrentlyTyping || !this.currentRoom || !this.currentUser) return;
        
        this.isCurrentlyTyping = false;
        
        // Clear timers
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        
        // Emit typing-stop event
        this.socket.emit('typing-stop', {
            key: this.currentRoom,
            name: this.currentUser
        });
    }

    handleTypingUpdate(data) {
        const { name, isTyping } = data;
        
        if (isTyping) {
            this.activeTypingUsers.add(name);
        } else {
            this.activeTypingUsers.delete(name);
        }
        
        this.updateTypingDisplay();
    }

    updateTypingDisplay() {
        const typingIndicator = document.getElementById('typing-indicator');
        const typingText = document.getElementById('typing-text');
        
        if (!typingIndicator || !typingText) return;
        
        // Clear existing display timer
        if (this.typingDisplayTimer) {
            clearTimeout(this.typingDisplayTimer);
        }
        
        if (this.activeTypingUsers.size === 0) {
            // Hide typing indicator
            typingIndicator.classList.remove('show');
            setTimeout(() => {
                if (this.activeTypingUsers.size === 0) {
                    typingIndicator.style.display = 'none';
                }
            }, 200);
        } else {
            // Show typing indicator
            const users = Array.from(this.activeTypingUsers);
            let message;
            
            if (users.length === 1) {
                message = `${users[0]} is typing...`;
            } else if (users.length === 2) {
                message = `${users[0]} and ${users[1]} are typing...`;
            } else {
                message = `${users[0]} and ${users.length - 1} others are typing...`;
            }
            
            typingText.textContent = message;
            typingIndicator.style.display = 'block';
            // Use setTimeout to trigger transition after display change
            setTimeout(() => {
                typingIndicator.classList.add('show');
            }, 10);
            
            // Auto-hide after 3 seconds in case of missed stop events
            this.typingDisplayTimer = setTimeout(() => {
                this.activeTypingUsers.clear();
                this.updateTypingDisplay();
            }, 3000);
        }
    }

    focusMessageInput() {
        setTimeout(() => {
            const input = document.getElementById('message-input');
            if (input) input.focus();
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.chat-section').forEach(screen => {
            screen.style.display = 'none';
        });

        // Show requested screen
        const screenMap = {
            'landing': 'landing-screen',
            'create-chat': 'create-chat-screen',
            'join-chat': 'join-chat-screen',
            'chat-room': 'chat-room-screen'
        };

        const targetScreen = document.getElementById(screenMap[screenId]);
        if (targetScreen) {
            targetScreen.style.display = 'block';
        }

        // Clear forms when switching screens
        if (screenId === 'landing') {
            document.getElementById('creator-name').value = '';
            document.getElementById('chat-key').value = '';
            document.getElementById('joiner-name').value = '';
            this.hideError();
        }

        // Focus appropriate inputs
        if (screenId === 'create-chat') {
            setTimeout(() => document.getElementById('creator-name').focus(), 100);
        } else if (screenId === 'join-chat') {
            setTimeout(() => document.getElementById('chat-key').focus(), 100);
        }
    }
}

// Initialize the chat app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});