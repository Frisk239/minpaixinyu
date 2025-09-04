// AI问答页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    // 初始化聊天功能
    initChat();
    
    // 初始化建议问题按钮
    initSuggestionButtons();
    
    // 初始化表单提交
    initChatForm();
});

// 初始化聊天功能
function initChat() {
    const chatMessages = document.getElementById('chat-messages');
    
    // 确保聊天区域滚动到底部
    scrollToBottom();
    
    // 添加消息事件监听
    window.addEventListener('messageSent', function(e) {
        addMessage(e.detail.message, 'user');
        scrollToBottom();
    });
    
    window.addEventListener('aiResponse', function(e) {
        addMessage(e.detail.message, 'ai');
        scrollToBottom();
    });
}

// 初始化建议问题按钮
function initSuggestionButtons() {
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    suggestionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            document.getElementById('user-input').value = question;
            document.getElementById('chat-form').dispatchEvent(new Event('submit'));
        });
    });
}

// 初始化聊天表单
function initChatForm() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // 禁用输入和按钮
        userInput.disabled = true;
        sendBtn.disabled = true;
        
        try {
            // 发送用户消息
            sendUserMessage(message);
            
            // 显示加载状态
            showLoading();
            
            // 发送到后端API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message })
            });
            
            if (!response.ok) {
                throw new Error('网络响应不正常');
            }
            
            const data = await response.json();
            
            // 隐藏加载状态
            hideLoading();
            
            // 添加AI回复
            if (data.answer) {
                addAIMessage(data.answer);
            } else {
                addAIMessage('抱歉，我暂时无法回答这个问题。请尝试其他问题。');
            }
            
        } catch (error) {
            console.error('发送消息失败:', error);
            hideLoading();
            addAIMessage('抱歉，发生了错误。请稍后重试。');
        } finally {
            // 重新启用输入和按钮
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.value = '';
            userInput.focus();
        }
    });
    
    // 输入框回车发送
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
}

// 发送用户消息
function sendUserMessage(message) {
    const event = new CustomEvent('messageSent', {
        detail: { message: message }
    });
    window.dispatchEvent(event);
}

// 添加用户消息
function addMessage(message, type) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${type === 'ai' ? 'fa-robot' : 'fa-user'}"></i>
        </div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
            ${type === 'ai' ? '<button class="copy-btn" title="复制回复"><i class="fas fa-copy"></i></button>' : ''}
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // 添加复制功能
    if (type === 'ai') {
        const copyBtn = messageDiv.querySelector('.copy-btn');
        copyBtn.addEventListener('click', function() {
            copyToClipboard(message);
            showCopySuccess(this);
        });
    }
    
    scrollToBottom();
}

// 添加AI消息（带打字机效果）
function addAIMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div id="typing-content"></div>
            <button class="copy-btn" title="复制回复" style="display: none;">
                <i class="fas fa-copy"></i>
            </button>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // 打字机效果
    typeWriter(message, messageDiv);
    
    scrollToBottom();
}

// 打字机效果
function typeWriter(text, messageDiv, speed = 20) {
    const contentDiv = messageDiv.querySelector('#typing-content');
    const copyBtn = messageDiv.querySelector('.copy-btn');
    let i = 0;
    
    contentDiv.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            contentDiv.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
            scrollToBottom();
        } else {
            // 打字完成后显示复制按钮
            copyBtn.style.display = 'block';
            copyBtn.addEventListener('click', function() {
                copyToClipboard(text);
                showCopySuccess(this);
            });
        }
    }
    
    type();
}

// 显示加载状态
function showLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
}

// 隐藏加载状态
function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
}

// 滚动到底部
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('复制失败:', err);
        // 备用复制方法
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

// 显示复制成功提示
function showCopySuccess(button) {
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.style.color = '#2ed573';
    
    setTimeout(() => {
        button.innerHTML = originalHtml;
        button.style.color = '';
    }, 2000);
}

// 获取当前时间
function getCurrentTime() {
    return new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 清除聊天记录
function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>您好！我是闽派新语AI助手，很高兴为您服务。我可以为您解答关于福建文化、历史、旅游、美食等方面的问题。请问有什么可以帮您的吗？</p>
            </div>
        </div>
    `;
}

// 导出聊天记录
function exportChat() {
    const messages = document.querySelectorAll('.message-content p');
    let chatText = '闽派新语AI聊天记录\n\n';
    
    messages.forEach((message, index) => {
        const isAI = message.closest('.ai-message');
        const prefix = isAI ? 'AI: ' : '用户: ';
        chatText += `${prefix}${message.textContent}\n\n`;
    });
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `闽派新语聊天记录_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter 发送消息
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('chat-form').dispatchEvent(new Event('submit'));
    }
    
    // Ctrl+L 清除聊天
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (confirm('确定要清除聊天记录吗？')) {
            clearChat();
        }
    }
    
    // Ctrl+E 导出聊天
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportChat();
    }
});

// 页面可见性变化时重新聚焦输入框
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        document.getElementById('user-input').focus();
    }
});

// 初始化页面时聚焦输入框
window.addEventListener('load', function() {
    document.getElementById('user-input').focus();
});
