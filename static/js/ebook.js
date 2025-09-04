// 学习日志电子书页面交互功能

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.2;
let canvas = null;
let ctx = null;

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
    // 初始化PDF阅读器
    initPDFControls();
});

// 初始化PDF阅读器
function initPDFViewer(pdfUrl) {
    canvas = document.getElementById('pdf-canvas');
    ctx = canvas.getContext('2d');
    
    // 显示加载状态
    showLoading();
    
    // 加载PDF文档
    pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
        pdfDoc = pdf;
        document.getElementById('page-count').textContent = pdf.numPages;
        
        // 隐藏加载状态
        hideLoading();
        
        // 渲染第一页
        renderPage(pageNum);
        
        // 初始化缩略图
        initThumbnails();
        
    }).catch(function(error) {
        console.error('加载PDF失败:', error);
        hideLoading();
        showError();
    });
}

// 初始化控制按钮
function initPDFControls() {
    // 上一页按钮
    document.getElementById('prev-page').addEventListener('click', function() {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });
    
    // 下一页按钮
    document.getElementById('next-page').addEventListener('click', function() {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });
    
    // 缩放控制
    document.getElementById('zoom-in').addEventListener('click', function() {
        scale += 0.1;
        queueRenderPage(pageNum);
        updateZoomIndicator();
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        if (scale > 0.5) {
            scale -= 0.1;
            queueRenderPage(pageNum);
            updateZoomIndicator();
        }
    });
    
    document.getElementById('zoom-reset').addEventListener('click', function() {
        scale = 1.2;
        queueRenderPage(pageNum);
        updateZoomIndicator();
    });
    
    // 视图模式
    document.getElementById('single-page').addEventListener('click', function() {
        setViewMode('single');
    });
    
    document.getElementById('spread-view').addEventListener('click', function() {
        setViewMode('spread');
    });
    
    // 键盘导航
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // 触摸滑动
    initTouchSwipe();
}

// 渲染页面
function renderPage(num) {
    pageRendering = true;
    
    // 显示加载状态
    showPageLoading();
    
    // 获取页面
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        
        // 调整canvas大小
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // 渲染PDF页面到canvas
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            pageRendering = false;
            
            // 隐藏加载状态
            hidePageLoading();
            
            // 更新页面信息
            updatePageInfo();
            
            // 更新进度条
            updateProgressBar();
            
            // 更新缩略图
            updateThumbnails();
            
            // 如果有等待的页面，渲染它
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // 添加翻页动画
            addPageTurnAnimation();
            
        }).catch(function(error) {
            console.error('渲染页面失败:', error);
            pageRendering = false;
            hidePageLoading();
        });
        
    }).catch(function(error) {
        console.error('获取页面失败:', error);
        pageRendering = false;
        hidePageLoading();
    });
}

// 队列渲染页面（如果正在渲染，则等待）
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// 更新页面信息
function updatePageInfo() {
    document.getElementById('page-num').textContent = `第 ${pageNum} 页`;
    document.getElementById('current-question').textContent = pageNum;
}

// 更新进度条
function updateProgressBar() {
    const progress = (pageNum / pdfDoc.numPages) * 100;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

// 更新缩放指示器
function updateZoomIndicator() {
    const zoomLevel = Math.round(scale * 100);
    // 可以在这里添加缩放级别显示
}

// 设置视图模式
function setViewMode(mode) {
    const pdfViewer = document.getElementById('pdf-viewer');
    const singleBtn = document.getElementById('single-page');
    const spreadBtn = document.getElementById('spread-view');
    
    if (mode === 'spread') {
        pdfViewer.classList.add('spread-view');
        singleBtn.classList.remove('active');
        spreadBtn.classList.add('active');
    } else {
        pdfViewer.classList.remove('spread-view');
        singleBtn.classList.add('active');
        spreadBtn.classList.remove('active');
    }
    
    // 重新渲染当前页面
    queueRenderPage(pageNum);
}

// 键盘导航
function handleKeyboardNavigation(e) {
    // 左箭头：上一页
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (pageNum > 1) {
            pageNum--;
            queueRenderPage(pageNum);
        }
    }
    
    // 右箭头：下一页
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (pageNum < pdfDoc.numPages) {
            pageNum++;
            queueRenderPage(pageNum);
        }
    }
    
    // Home键：第一页
    if (e.key === 'Home') {
        e.preventDefault();
        pageNum = 1;
        queueRenderPage(pageNum);
    }
    
    // End键：最后一页
    if (e.key === 'End') {
        e.preventDefault();
        pageNum = pdfDoc.numPages;
        queueRenderPage(pageNum);
    }
    
    // +/- 键：缩放
    if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        scale += 0.1;
        queueRenderPage(pageNum);
        updateZoomIndicator();
    }
    
    if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (scale > 0.5) {
            scale -= 0.1;
            queueRenderPage(pageNum);
            updateZoomIndicator();
        }
    }
    
    // 0键：重置缩放
    if (e.key === '0') {
        e.preventDefault();
        scale = 1.2;
        queueRenderPage(pageNum);
        updateZoomIndicator();
    }
}

// 初始化触摸滑动
function initTouchSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    canvas.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 水平滑动距离大于垂直滑动距离，且大于50px才触发翻页
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // 向右滑动：上一页
                if (pageNum > 1) {
                    pageNum--;
                    queueRenderPage(pageNum);
                }
            } else {
                // 向左滑动：下一页
                if (pageNum < pdfDoc.numPages) {
                    pageNum++;
                    queueRenderPage(pageNum);
                }
            }
        }
    }, { passive: true });
}

// 显示加载状态
function showLoading() {
    document.getElementById('loading-pdf').style.display = 'block';
    document.getElementById('pdf-error').style.display = 'none';
    document.getElementById('pdf-viewer').style.display = 'none';
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('loading-pdf').style.display = 'none';
    document.getElementById('pdf-viewer').style.display = 'flex';
}

// 显示页面加载状态
function showPageLoading() {
    canvas.style.opacity = '0.5';
}

// 隐藏页面加载状态
function hidePageLoading() {
    canvas.style.opacity = '1';
}

// 显示错误状态
function showError() {
    document.getElementById('loading-pdf').style.display = 'none';
    document.getElementById('pdf-error').style.display = 'block';
    document.getElementById('pdf-viewer').style.display = 'none';
}

// 添加翻页动画
function addPageTurnAnimation() {
    canvas.classList.add('page-turn');
    setTimeout(() => {
        canvas.classList.remove('page-turn');
    }, 600);
}

// 初始化缩略图
function initThumbnails() {
    // 这里可以添加缩略图功能
    // 由于性能考虑，可以延迟加载缩略图
}

// 更新缩略图
function updateThumbnails() {
    // 更新当前激活的缩略图
}

// 跳转到指定页面
function goToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
        pageNum = pageNumber;
        queueRenderPage(pageNum);
    }
}

// 搜索文本
function searchText(query) {
    // PDF文本搜索功能
    // 这里可以实现文本搜索高亮
}

// 下载PDF
function downloadPDF() {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = '学习日志.pdf';
    a.click();
}

// 打印PDF
function printPDF() {
    window.print();
}

// 全屏模式
function toggleFullscreen() {
    const elem = document.getElementById('pdf-container');
    
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.error('全屏模式错误:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// 添加书签
function addBookmark() {
    const bookmarks = JSON.parse(localStorage.getItem('pdfBookmarks') || '{}');
    bookmarks[pdfUrl] = pageNum;
    localStorage.setItem('pdfBookmarks', JSON.stringify(bookmarks));
    
    alert(`已添加书签：第 ${pageNum} 页`);
}

// 跳转到书签
function goToBookmark() {
    const bookmarks = JSON.parse(localStorage.getItem('pdfBookmarks') || '{}');
    const bookmarkedPage = bookmarks[pdfUrl];
    
    if (bookmarkedPage) {
        goToPage(bookmarkedPage);
    } else {
        alert('没有找到书签');
    }
}

// 页面可见性变化时重新渲染
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && pdfDoc) {
        queueRenderPage(pageNum);
    }
});

// 窗口大小变化时重新调整
window.addEventListener('resize', function() {
    if (pdfDoc) {
        queueRenderPage(pageNum);
    }
});

// 导出功能
window.initPDFViewer = initPDFViewer;
window.goToPage = goToPage;
window.downloadPDF = downloadPDF;
window.printPDF = printPDF;
window.toggleFullscreen = toggleFullscreen;
window.addBookmark = addBookmark;
window.goToBookmark = goToBookmark;
