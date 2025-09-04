// 地市详情页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    // 标签切换功能
    initTabs();
    
    // 图片预览功能
    initImagePreview();
    
    // 模态框控制
    initModals();
    
    // 标记探索按钮事件
    initMarkExploredButton();
});

// 初始化标签切换
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有active类
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加active类到当前标签和内容
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// 初始化图片预览
function initImagePreview() {
    const images = document.querySelectorAll('.culture-image img, .attraction-image img, .food-image img');
    
    images.forEach(img => {
        img.addEventListener('click', function() {
            showImagePreview(this.src, this.alt);
        });
    });
}

// 显示图片预览
function showImagePreview(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <img src="${src}" alt="${alt}" class="preview-image">
            <p class="image-caption">${alt}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 初始化模态框
function initModals() {
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
}

// 图片懒加载
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // 不支持IntersectionObserver的回退方案
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// 平滑滚动到锚点
function smoothScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 分享功能
function shareCity() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            text: '来看看这个美丽的福建城市！',
            url: window.location.href
        })
        .catch(error => {
            console.log('分享失败:', error);
        });
    } else {
        // 复制链接到剪贴板
        const url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => {
                alert('链接已复制到剪贴板！');
            })
            .catch(err => {
                console.error('复制失败:', err);
                prompt('请手动复制链接：', url);
            });
    }
}

// 添加到收藏功能
function addToFavorites() {
    if (window.sidebar && window.sidebar.addPanel) {
        // Firefox
        window.sidebar.addPanel(document.title, window.location.href, '');
    } else if (window.external && ('AddFavorite' in window.external)) {
        // IE
        window.external.AddFavorite(window.location.href, document.title);
    } else if (window.opera && window.print) {
        // Opera
        const elem = document.createElement('a');
        elem.setAttribute('href', window.location.href);
        elem.setAttribute('title', document.title);
        elem.setAttribute('rel', 'sidebar');
        elem.click();
    } else {
        // 其他浏览器
        alert('请使用 Ctrl+D (Windows) 或 Cmd+D (Mac) 添加到收藏夹');
    }
}

// 页面加载时初始化
window.addEventListener('load', function() {
    initLazyLoading();
    
    // 添加分享按钮（如果需要）
    addShareButton();
});

// 添加分享按钮
function addShareButton() {
    const shareButton = document.createElement('button');
    shareButton.className = 'btn share-btn';
    shareButton.innerHTML = '<i class="fas fa-share-alt"></i> 分享';
    shareButton.addEventListener('click', shareCity);
    
    const actionsContainer = document.querySelector('.explore-actions');
    if (actionsContainer) {
        actionsContainer.appendChild(shareButton);
    }
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键关闭所有模态框
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    // 数字键切换标签
    if (e.key >= '1' && e.key <= '4') {
        const tabIndex = parseInt(e.key) - 1;
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons[tabIndex]) {
            tabButtons[tabIndex].click();
        }
    }
});

// 初始化标记探索按钮
function initMarkExploredButton() {
    const markButton = document.getElementById('mark-explored-btn');
    if (markButton) {
        markButton.addEventListener('click', function() {
            // 从页面标题获取城市名称
            const pageTitle = document.title;
            let cityName = '';
            
            // 从标题中提取城市名称（移除"详情"后缀）
            if (pageTitle.includes('详情')) {
                cityName = pageTitle.replace('详情', '').trim();
            } else {
                // 如果标题格式不符合预期，使用默认值
                cityName = '福州'; // 默认值，可以根据需要修改
            }
            
            // 首先检查是否已经探索过
            fetch('/api/check-explored?city_name=' + encodeURIComponent(cityName))
                .then(response => response.json())
                .then(checkData => {
                    if (checkData.explored) {
                        // 已经探索过，直接更新UI
                        alert('该城市已经探索过了！');
                        markButton.disabled = true;
                        markButton.innerHTML = '<i class="fas fa-check"></i> 已探索';
                        markButton.classList.add('btn-success');
                        markButton.classList.remove('btn-primary');
                        return;
                    }
                    
                    // 使用AJAX提交标记探索请求
                    fetch('/api/mark-explored', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ city_name: cityName })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // 显示成功消息
                            alert('标记为已探索成功！');
                            
                            // 禁用按钮，防止重复点击
                            markButton.disabled = true;
                            markButton.innerHTML = '<i class="fas fa-check"></i> 已探索';
                            markButton.classList.add('btn-success');
                            markButton.classList.remove('btn-primary');
                            
                            // 尝试调用主页面的reloadExploredCities函数来更新地图
                            if (window.parent && window.parent.reloadExploredCities) {
                                window.parent.reloadExploredCities();
                            }
                        } else {
                            alert('标记失败：' + (data.error || '未知错误'));
                        }
                    })
                    .catch(error => {
                        console.error('标记探索失败:', error);
                        alert('标记失败，请检查网络连接');
                    });
                })
                .catch(error => {
                    console.error('检查探索状态失败:', error);
                    alert('检查探索状态失败，请刷新页面重试');
                });
        });
    }
}
