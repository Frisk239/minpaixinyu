// 闽派新语 - 主要JavaScript功能

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// 检查用户登录状态
function checkLoginStatus() {
    fetch('/api/check-login')
        .then(response => response.json())
        .then(data => {
            const authButtons = document.getElementById('auth-buttons');
            const userInfo = document.getElementById('user-info');
            
            if (data.logged_in) {
                // 已登录：隐藏登录注册按钮，显示用户头像
                if (authButtons) authButtons.style.display = 'none';
                if (userInfo) userInfo.style.display = 'flex';
                
                // 刷新头像
                const avatarImg = document.getElementById('avatar-img');
                if (avatarImg) {
                    avatarImg.src = '/get-avatar?t=' + new Date().getTime();
                }
            } else {
                // 未登录：显示登录注册按钮，隐藏用户头像，并移除头像src避免401错误
                if (authButtons) authButtons.style.display = 'flex';
                if (userInfo) userInfo.style.display = 'none';
                
                const avatarImg = document.getElementById('avatar-img');
                if (avatarImg) {
                    avatarImg.removeAttribute('src');
                }
            }
        })
        .catch(error => {
            console.error('检查登录状态失败:', error);
            // 出错时默认显示未登录状态
            const authButtons = document.getElementById('auth-buttons');
            const userInfo = document.getElementById('user-info');
            if (authButtons) authButtons.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        });
}

// 通用模态框控制
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// 为所有关闭按钮添加事件监听
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
});

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});
