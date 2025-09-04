// 福建地图交互功能 - 使用Leaflet

let fujianMap = null;
let exploredCities = new Set();
let cityLayers = {};

// 城市坐标配置
const cityCoordinates = {
    '福州': [26.0742, 119.3062],
    '南平': [26.6415, 118.1777],
    '龙岩': [25.0911, 117.0178],
    '泉州': [24.8739, 118.6759],
    '莆田': [25.4310, 119.0078],
    '厦门': [24.4798, 118.0894],
    '漳州': [24.5130, 117.6471],
    '三明': [26.2639, 117.6305],
    '宁德': [26.6657, 119.5479]
};

document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    initMap();
    
    // 加载用户探索记录
    loadExploredCities();
    
    // 初始化模态框事件
    initModalEvents();
});

// 初始化地图
function initMap() {
    const mapContainer = document.getElementById('fujian-map');
    if (!mapContainer) return;
    
    // 初始化Leaflet地图
    fujianMap = L.map('fujian-map').setView([26.0, 118.0], 7);
    
    // 添加地图瓦片图层 - 使用无国界样式
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(fujianMap);
    
    // 加载福建地图GeoJSON数据
    fetch('/static/fujian.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(fujianData => {
            // 绘制福建省轮廓
            const fujianLayer = L.geoJSON(fujianData, {
                style: function(feature) {
                    const cityName = feature.properties.name;
                    return {
                        fillColor: exploredCities.has(cityName) ? '#2ed573' : '#D2B48C',
                        weight: 2,
                        opacity: 1,
                        color: '#8B7355',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function(feature, layer) {
                    const cityName = feature.properties.name;
                    cityLayers[cityName] = layer;
                    
                    // 添加点击事件
                    layer.on('click', function() {
                        handleCityClick(cityName);
                    });
                    
                    // 添加鼠标悬停效果
                    layer.on('mouseover', function() {
                        layer.setStyle({
                            weight: 3,
                            color: '#DAA520',
                            fillOpacity: 0.8
                        });
                    });
                    
                    layer.on('mouseout', function() {
                        layer.setStyle({
                            weight: 2,
                            color: '#8B7355',
                            fillOpacity: 0.7
                        });
                    });
                }
            }).addTo(fujianMap);
            
            // 添加城市标记
            addCityMarkers();
            
            // 调整地图大小
            window.addEventListener('resize', function() {
                fujianMap.invalidateSize();
            });
        })
        .catch(error => {
            console.error('加载地图数据失败:', error);
            showMapError();
        });
}

// 添加城市标记
function addCityMarkers() {
    // 可交互的城市列表
    const interactiveCities = ['福州', '南平', '龙岩', '泉州', '莆田'];
    
    Object.entries(cityCoordinates).forEach(([cityName, coords]) => {
        // 只为可交互的城市添加标记
        if (interactiveCities.includes(cityName)) {
            const marker = L.marker(coords, {
                icon: L.divIcon({
                    html: `<div class="city-marker">${cityName}</div>`,
                    className: 'city-marker-container',
                    iconSize: [60, 30]
                })
            }).addTo(fujianMap);
            
            marker.on('click', function() {
                handleCityClick(cityName);
            });
        }
    });
}

// 处理城市点击事件
function handleCityClick(cityName) {
    // 可交互的城市列表
    const interactiveCities = ['福州', '南平', '龙岩', '泉州', '莆田'];
    
    // 只对可交互的城市显示弹窗
    if (interactiveCities.includes(cityName)) {
        const cityInfo = getCityInfo(cityName);
        if (cityInfo) {
            showCityModal(cityInfo);
        }
    }
    // 不可交互的城市不显示任何弹窗，只显示色块
}

// 显示简单城市信息
function showSimpleCityInfo(cityName) {
    const modal = document.getElementById('city-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const exploreBtn = document.getElementById('explore-btn');
    
    if (modal && modalTitle && modalDescription) {
        modalTitle.textContent = cityName;
        modalDescription.textContent = `该城市暂无详细信息，请探索其他城市。`;
        
        // 隐藏探索按钮
        if (exploreBtn) {
            exploreBtn.style.display = 'none';
        }
        
        modal.classList.add('show');
    }
}

// 获取城市信息
function getCityInfo(cityName) {
    const citiesInfo = {
        '福州': {
            name: '福州',
            en_name: 'fuzhou',
            subtitle: '福建省会，榕城',
            description: '福州是福建省的省会城市，有着2200多年的建城史，是国家历史文化名城。因城内遍植榕树，别称"榕城"。福州是中国东南沿海重要的贸易港口和海上丝绸之路的门户。'
        },
        '南平': {
            name: '南平',
            en_name: 'nanping',
            subtitle: '闽北重镇，武夷胜地',
            description: '南平市位于福建省北部，武夷山脉北段东南侧，闽江上游，是福建通往内地的咽喉要道。南平是福建重要的林业基地和旅游城市，以武夷山风景区闻名于世。'
        },
        '龙岩': {
            name: '龙岩',
            en_name: 'longyan',
            subtitle: '客家祖地，红色圣地',
            description: '龙岩市位于福建省西部，地处闽粤赣三省交界，是重要的客家聚居地和革命老区。龙岩是客家人的重要祖籍地，也是原中央苏区的重要组成部分。'
        },
        '泉州': {
            name: '泉州',
            en_name: 'quanzhou',
            subtitle: '海上丝绸之路起点',
            description: '泉州市位于福建省东南沿海，是联合国教科文组织认定的海上丝绸之路起点，宋元时期的世界海洋贸易中心。泉州是著名的侨乡和台湾同胞的主要祖籍地。'
        },
        '莆田': {
            name: '莆田',
            en_name: 'putian',
            subtitle: '妈祖故乡，鞋都',
            description: '莆田市位于福建省东部沿海，是妈祖文化的发祥地，也是著名的侨乡。莆田以制鞋业闻名，是中国重要的鞋业生产基地，同时医疗产业也十分发达。'
        }
    };
    
    return citiesInfo[cityName] || null;
}

// 显示城市详情模态框
function showCityModal(cityInfo) {
    const modal = document.getElementById('city-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    
    if (modal && modalTitle && modalDescription) {
        modalTitle.textContent = cityInfo.name;
        modalDescription.textContent = cityInfo.description;
        
        // 更新探索按钮
        const exploreBtn = document.getElementById('explore-btn');
        if (exploreBtn) {
            exploreBtn.onclick = function() {
                window.location.href = `/city/${cityInfo.en_name}`;
            };
        }
        
        modal.classList.add('show');
    }
}

// 初始化模态框事件
function initModalEvents() {
    const modal = document.getElementById('city-modal');
    const closeBtn = document.querySelector('.close-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
    }
    
    // 点击模态框外部关闭
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modal.classList.remove('show');
        }
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

// 加载用户探索记录
function loadExploredCities() {
    // 首先检查用户是否登录
    fetch('/api/check-login')
        .then(response => response.json())
        .then(loginData => {
            if (loginData.logged_in) {
                // 用户已登录，加载个人探索记录
                fetch('/api/get-explorations')
                    .then(response => response.json())
                    .then(data => {
                        // 直接使用API返回的城市名称（后端已经处理过格式转换）
                        exploredCities = new Set(data.explorations);
                        updateMapStyle();
                    })
                    .catch(error => {
                        console.error('加载探索记录失败:', error);
                        // 如果加载失败，使用空集合
                        exploredCities = new Set();
                        updateMapStyle();
                    });
            } else {
                // 用户未登录，使用空集合
                exploredCities = new Set();
                updateMapStyle();
            }
        })
        .catch(error => {
            console.error('检查登录状态失败:', error);
            // 如果检查登录状态失败，使用空集合
            exploredCities = new Set();
            updateMapStyle();
        });
}

// 重新加载探索记录并更新地图
function reloadExploredCities() {
    fetch('/api/get-explorations')
        .then(response => response.json())
        .then(data => {
            exploredCities = new Set(data.explorations);
            updateMapStyle();
        })
        .catch(error => {
            console.error('重新加载探索记录失败:', error);
        });
}

// 更新地图样式
function updateMapStyle() {
    if (fujianMap && cityLayers) {
        Object.entries(cityLayers).forEach(([cityName, layer]) => {
            layer.setStyle({
                fillColor: exploredCities.has(cityName) ? '#2ed573' : '#D2B48C'
            });
        });
    }
}

// 标记城市为已探索
function markCityExplored(cityName) {
    exploredCities.add(cityName);
    updateMapStyle();
    
    // 保存到服务器
    fetch('/api/mark-explored', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city_name: cityName })
    }).catch(error => {
        console.error('保存探索记录失败:', error);
    });
}

// 显示地图错误
function showMapError() {
    const mapContainer = document.getElementById('fujian-map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #8B7355;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>地图加载失败，请刷新页面重试</p>
                <button onclick="location.reload()" class="btn" style="margin-top: 15px;">
                    <i class="fas fa-redo"></i> 刷新页面
                </button>
            </div>
        `;
    }
}

// 地图控制函数
function resetMapView() {
    if (fujianMap) {
        fujianMap.setView([26.0, 118.0], 7);
    }
}

function zoomIn() {
    if (fujianMap) {
        fujianMap.zoomIn();
    }
}

function zoomOut() {
    if (fujianMap) {
        fujianMap.zoomOut();
    }
}

// 导出功能
window.markCityExplored = markCityExplored;
window.resetMapView = resetMapView;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键关闭所有模态框
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    // F5刷新地图
    if (e.key === 'F5') {
        e.preventDefault();
        location.reload();
    }
});

// 页面可见性变化时重新调整地图大小
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && fujianMap) {
        setTimeout(() => {
            fujianMap.invalidateSize();
        }, 100);
    }
});

// 窗口大小变化时调整地图
window.addEventListener('resize', function() {
    if (fujianMap) {
        fujianMap.invalidateSize();
    }
});

// 页面加载完成后初始化
window.addEventListener('load', function() {
    if (fujianMap) {
        fujianMap.invalidateSize();
    }
});
