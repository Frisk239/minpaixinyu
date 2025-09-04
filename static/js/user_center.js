// 用户中心页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    // 加载用户探索记录
    loadExploredCities();
    
    // 初始化模态框事件
    initModalEvents();
});

// 加载用户探索记录
function loadExploredCities() {
    fetch('/api/get-explorations')
        .then(response => response.json())
        .then(data => {
            const exploredCities = new Set(data.explorations);
            updateCitiesList(exploredCities);
        })
        .catch(error => {
            console.error('加载探索记录失败:', error);
        });
}

// 城市名称映射（数据库名称 -> 显示名称）
const cityNameMap = {
    '闽派新语 - 福州': '福州',
    '闽派新语 - 南平': '南平',
    '闽派新语 - 龙岩': '龙岩', 
    '闽派新语 - 泉州': '泉州',
    '闽派新语 - 莆田': '莆田'
};

// 更新城市列表显示
function updateCitiesList(exploredCities) {
    const citiesList = document.querySelector('.cities-list');
    if (!citiesList) return;
    
    const cityItems = citiesList.querySelectorAll('.city-item');
    
    cityItems.forEach(item => {
        const displayName = item.querySelector('.city-name').textContent.trim();
        const statusSpan = item.querySelector('.city-status');
        
        // 查找对应的数据库名称
        const dbName = Object.keys(cityNameMap).find(key => cityNameMap[key] === displayName);
        
        if (dbName && exploredCities.has(dbName)) {
            // 已探索
            statusSpan.innerHTML = '<i class="fas fa-check-circle"></i> 已探索';
            statusSpan.style.color = '#2ed573';
        } else {
            // 未探索
            statusSpan.innerHTML = '<i class="fas fa-times-circle"></i> 未探索';
            statusSpan.style.color = '#ff4757';
        }
    });
}

// 初始化模态框事件
function initModalEvents() {
    // 更换头像按钮
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarModal = document.getElementById('avatar-modal');
    
    if (changeAvatarBtn && avatarModal) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarModal.classList.add('show');
        });
    }
    
    // 修改密码按钮
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    
    if (changePasswordBtn && passwordModal) {
        changePasswordBtn.addEventListener('click', function() {
            passwordModal.classList.add('show');
        });
    }
    
    // 注销账户按钮
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteModal = document.getElementById('delete-modal');
    
    if (deleteAccountBtn && deleteModal) {
        deleteAccountBtn.addEventListener('click', function() {
            deleteModal.classList.add('show');
        });
    }
    
    // 取消注销按钮
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn && deleteModal) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.classList.remove('show');
        });
    }
    
    // 头像预览
    const avatarFile = document.getElementById('avatar-file');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (avatarFile && avatarPreview) {
        avatarFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.querySelector('img').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 头像表单提交
    const avatarForm = document.getElementById('avatar-form');
    if (avatarForm) {
        avatarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('头像上传成功！');
                    location.reload();
                } else {
                    alert('头像上传失败：' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('头像上传失败:', error);
                alert('头像上传失败，请检查网络连接');
            });
        });
    }
    
    // 密码表单提交
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            fetch('/api/change-password', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('密码修改成功！');
                    passwordModal.classList.remove('show');
                    passwordForm.reset();
                } else {
                    alert('密码修改失败：' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('密码修改失败:', error);
                alert('密码修改失败，请检查网络连接');
            });
        });
    }
    
    // 注销表单提交
    const deleteForm = document.getElementById('delete-form');
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            fetch('/api/delete-account', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('账户注销成功！');
                    window.location.href = '/';
                } else {
                    alert('账户注销失败：' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                console.error('账户注销失败:', error);
                alert('账户注销失败，请检查网络连接');
            });
        });
    }
    
    // 为所有关闭按钮添加事件
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
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
}
