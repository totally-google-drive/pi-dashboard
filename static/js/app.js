// Main application logic
let token = localStorage.getItem('jwt_token');
let containersExpanded = {};

// Check if logged in
function checkAuth() {
    if (!token && window.location.pathname !== '/') {
        window.location.href = '/';
    }
    if (token && window.location.pathname === '/') {
        window.location.href = '/dashboard';
    }
}

// Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format percentage
function formatPercent(value) {
    return value.toFixed(1) + '%';
}

// Get progress bar class
function getProgressClass(value) {
    if (value < 50) return 'low';
    if (value < 80) return 'medium';
    return 'high';
}

// Login function
async function login(password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            token = data.token;
            localStorage.setItem('jwt_token', token);
            window.location.href = '/dashboard';
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        showError('Connection error');
    }
}

// Show error message
function showError(message) {
    const errorEl = document.querySelector('.error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 3000);
    }
}

// Logout
function logout() {
    localStorage.removeItem('jwt_token');
    token = null;
    window.location.href = '/';
}

// API request with auth
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(endpoint, { ...options, headers });

    if (response.status === 401) {
        logout();
        return null;
    }

    return response.json();
}

// Stats update handler
function onStatsUpdate(data) {
    updateStatsUI(data);
}

// Update stats UI
function updateStatsUI(stats) {
    // CPU
    const cpuPercent = document.getElementById('cpu-percent');
    if (cpuPercent) {
        cpuPercent.textContent = formatPercent(stats.cpu.percent);
        const fill = document.querySelector('#cpu-card .progress-bar .fill');
        if (fill) {
            fill.style.width = stats.cpu.percent + '%';
            fill.className = 'fill ' + getProgressClass(stats.cpu.percent);
        }
    }

    // CPU Temperature
    const cpuTemp = document.getElementById('cpu-temp');
    if (cpuTemp && stats.cpu.temperature) {
        cpuTemp.textContent = stats.cpu.temperature.toFixed(1) + '°C';
    }

    // CPU Temperature Card
    const cpuTempCard = document.getElementById('cpu-temp-card');
    if (cpuTempCard) {
        if (stats.cpu.temperature) {
            cpuTempCard.textContent = stats.cpu.temperature.toFixed(1) + '°C';
        } else {
            cpuTempCard.textContent = '--°C';
        }
    }

    // CPU Cores
    const cpuCores = document.getElementById('cpu-cores');
    if (cpuCores) {
        cpuCores.textContent = stats.cpu.count + ' cores';
    }

    // Memory
    const memPercent = document.getElementById('mem-percent');
    if (memPercent) {
        memPercent.textContent = formatPercent(stats.memory.percent);
        const fill = document.querySelector('#mem-card .progress-bar .fill');
        if (fill) {
            fill.style.width = stats.memory.percent + '%';
            fill.className = 'fill ' + getProgressClass(stats.memory.percent);
        }
    }

    // Memory details
    const memUsed = document.getElementById('mem-used');
    if (memUsed) {
        memUsed.textContent = formatBytes(stats.memory.used) + ' / ' + formatBytes(stats.memory.total);
    }

    // Disk
    const diskPercent = document.getElementById('disk-percent');
    if (diskPercent) {
        diskPercent.textContent = formatPercent(stats.disk.percent);
        const fill = document.querySelector('#disk-card .progress-bar .fill');
        if (fill) {
            fill.style.width = stats.disk.percent + '%';
            fill.className = 'fill ' + getProgressClass(stats.disk.percent);
        }
    }

    // Disk details
    const diskUsed = document.getElementById('disk-used');
    if (diskUsed) {
        diskUsed.textContent = formatBytes(stats.disk.used) + ' / ' + formatBytes(stats.disk.total);
    }

    // Network speed (bytes per second)
    const netSent = document.getElementById('net-sent');
    const netRecv = document.getElementById('net-recv');
    if (netSent) netSent.textContent = formatBytes(stats.network.speed_sent || 0) + '/s';
    if (netRecv) netRecv.textContent = formatBytes(stats.network.speed_recv || 0) + '/s';

    // Disk I/O speed
    const diskRead = document.getElementById('disk-read');
    const diskWrite = document.getElementById('disk-write');
    if (diskRead) diskRead.textContent = formatBytes(stats.disk_io.speed_read || 0) + '/s';
    if (diskWrite) diskWrite.textContent = formatBytes(stats.disk_io.speed_write || 0) + '/s';
}

// Container update handler
function onContainerUpdate(data) {
    if (data.error) {
        console.error('Docker error:', data.error);
        return;
    }
    renderContainers(data);
}

// Render containers
function renderContainers(containers) {
    const container = document.getElementById('docker-list');
    if (!container) return;

    container.innerHTML = '';

    if (!containers || containers.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No containers found</p>';
        return;
    }

    // Group Immich containers
    const immichContainers = containers.filter(c => c.name.toLowerCase().includes('immich'));
    const otherContainers = containers.filter(c => !c.name.toLowerCase().includes('immich'));

    // Store immich IDs for group actions
    immichContainerIds = immichContainers.map(c => c.id);

    // Render Immich group if exists
    if (immichContainers.length > 0) {
        const groupCard = document.createElement('div');
        groupCard.className = 'docker-card docker-group-card';

        const totalCpu = immichContainers.reduce((sum, c) => sum + c.cpu_percent, 0);
        const totalMem = immichContainers.reduce((sum, c) => sum + c.memory_percent, 0);
        const runningCount = immichContainers.filter(c => c.status === 'running').length;

        groupCard.innerHTML = `
            <div class="docker-card-header" onclick="toggleContainer('immich-group')">
                <div class="info">
                    <div class="docker-icon immich-icon"><i class="fas fa-images"></i></div>
                    <div>
                        <div class="name">Immich <span class="group-count">(${immichContainers.length} services)</span></div>
                        <div class="image">Photo management stack</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="status-badge ${runningCount === immichContainers.length ? 'running' : runningCount > 0 ? 'paused' : 'exited'}">${runningCount}/${immichContainers.length} running</span>
                    <span class="expand-icon"><i class="fas fa-chevron-down"></i></span>
                </div>
            </div>
            <div class="docker-card-body" id="container-body-immich-group">
                <div class="group-services">
                    ${immichContainers.map(c => `
                        <div class="group-service-item" onclick="event.stopPropagation(); toggleContainer('${c.id}')">
                            <div class="service-info">
                                <span class="service-name">${escapeHtml(c.name.replace(/^immich[-_]/i, ''))}</span>
                                <span class="status-badge ${c.status}" style="font-size: 10px; padding: 2px 8px;">${c.status}</span>
                            </div>
                            <div class="service-stats">
                                <span>CPU: ${formatPercent(c.cpu_percent)}</span>
                                <span>Mem: ${formatPercent(c.memory_percent)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="container-actions">
                    <button class="btn btn-success btn-small" onclick="startAllImmich(event)"><i class="fas fa-play"></i> Start All</button>
                    <button class="btn btn-warning btn-small" onclick="stopAllImmich(event)"><i class="fas fa-stop"></i> Stop All</button>
                    <button class="btn btn-danger btn-small" onclick="restartAllImmich(event)"><i class="fas fa-redo"></i> Restart All</button>
                </div>
            </div>
        `;
        container.appendChild(groupCard);
    }

    // Render other containers
    otherContainers.forEach(containerData => {
        const card = document.createElement('div');
        card.className = 'docker-card';
        card.innerHTML = `
            <div class="docker-card-header" onclick="toggleContainer('${containerData.id}')">
                <div class="info">
                    <div class="docker-icon"><i class="fas fa-box"></i></div>
                    <div>
                        <div class="name">${escapeHtml(containerData.name)}</div>
                        <div class="image">${escapeHtml(containerData.image)}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="status-badge ${containerData.status}">${containerData.status}</span>
                    <span class="expand-icon"><i class="fas fa-chevron-down"></i></span>
                </div>
            </div>
            <div class="docker-card-body" id="container-body-${containerData.id}">
                <div class="container-stats">
                    <div class="container-stat">
                        <div class="label">CPU</div>
                        <div class="value">${formatPercent(containerData.cpu_percent)}</div>
                    </div>
                    <div class="container-stat">
                        <div class="label">Memory</div>
                        <div class="value">${formatPercent(containerData.memory_percent)}</div>
                    </div>
                </div>
                <div class="container-logs" id="logs-${containerData.id}">Loading logs...</div>
                <div class="container-actions">
                    <button class="btn btn-success btn-small" onclick="startContainer('${containerData.id}', event)"><i class="fas fa-play"></i> Start</button>
                    <button class="btn btn-warning btn-small" onclick="stopContainer('${containerData.id}', event)"><i class="fas fa-stop"></i> Stop</button>
                    <button class="btn btn-danger btn-small" onclick="restartContainer('${containerData.id}', event)"><i class="fas fa-redo"></i> Restart</button>
                </div>
            </div>
        `;
        container.appendChild(card);

        // Load logs
        loadContainerLogs(containerData.id);
    });
}

// Store immich container IDs globally
let immichContainerIds = [];

// Immich group actions
async function startAllImmich(event) {
    event.stopPropagation();
    for (const id of immichContainerIds) {
        await containerAction(id, 'start');
    }
}

async function stopAllImmich(event) {
    event.stopPropagation();
    for (const id of immichContainerIds) {
        await containerAction(id, 'stop');
    }
}

async function restartAllImmich(event) {
    event.stopPropagation();
    for (const id of immichContainerIds) {
        await containerAction(id, 'restart');
    }
}

// Group containers by name prefix
function groupContainers(containers) {
    const groups = {};

    containers.forEach(c => {
        const name = c.name.toLowerCase();
        let groupKey = 'other';

        if (name.includes('immich')) {
            groupKey = 'immich';
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(c);
    });

    return groups;
}

// Toggle container details
function toggleContainer(containerId) {
    const body = document.getElementById(`container-body-${containerId}`);
    if (body) {
        body.classList.toggle('open');
    }
}

// Load container logs
async function loadContainerLogs(containerId) {
    const logsEl = document.getElementById(`logs-${containerId}`);
    if (!logsEl) return;

    try {
        const data = await apiRequest(`/api/docker/logs/${containerId}?lines=50`);
        if (data && data.logs) {
            logsEl.textContent = data.logs || 'No logs available';
            logsEl.scrollTop = logsEl.scrollHeight;
        }
    } catch (error) {
        logsEl.textContent = 'Error loading logs';
    }
}

// Container actions
async function startContainer(containerId, event) {
    event.stopPropagation();
    await containerAction(containerId, 'start');
}

async function stopContainer(containerId, event) {
    event.stopPropagation();
    await containerAction(containerId, 'stop');
}

async function restartContainer(containerId, event) {
    event.stopPropagation();
    await containerAction(containerId, 'restart');
}

async function containerAction(containerId, action) {
    try {
        await apiRequest(`/api/docker/${action}/${containerId}`, { method: 'POST' });
    } catch (error) {
        console.error(`Error ${action}ing container:`, error);
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load processes
async function loadProcesses() {
    try {
        const data = await apiRequest('/api/processes');
        if (data) {
            renderProcesses(data);
        }
    } catch (error) {
        console.error('Error loading processes:', error);
    }
}

// Render processes
function renderProcesses(data) {
    const cpuList = document.getElementById('process-cpu-list');
    const memList = document.getElementById('process-mem-list');

    if (cpuList) {
        cpuList.innerHTML = data.by_cpu.map(p => `
            <div class="process-item">
                <span class="name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
                <span class="cpu">${formatPercent(p.cpu)}</span>
            </div>
        `).join('');
    }

    if (memList) {
        memList.innerHTML = data.by_memory.map(p => `
            <div class="process-item">
                <span class="name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
                <span class="mem">${formatPercent(p.memory)}</span>
            </div>
        `).join('');
    }
}

// Socket connected handler
function onSocketConnected() {
    socketHandler.requestStats();
    loadProcesses();
    loadContainers();
}

// Load containers
async function loadContainers() {
    try {
        const data = await apiRequest('/api/docker/containers');
        if (data && !data.error) {
            renderContainers(data);
        }
    } catch (error) {
        console.error('Error loading containers:', error);
    }
}

// Initialize dashboard
function initDashboard() {
    checkAuth();
    socketHandler.connect();

    // Refresh processes every 5 seconds
    setInterval(loadProcesses, 5000);
}

// Initialize login page
function initLogin() {
    checkAuth();

    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const password = passwordInput.value;
            if (password) {
                login(password);
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const password = passwordInput.value;
                if (password) {
                    login(password);
                }
            }
        });
    }
}

// Auto-refresh processes when socket gets stats
const originalOnStatsUpdate = onStatsUpdate;
onStatsUpdate = function(data) {
    originalOnStatsUpdate(data);
    // Refresh processes less frequently via socket to avoid too much load
    if (Math.random() < 0.1) { // ~10% chance every 2 seconds = every 20 seconds
        loadProcesses();
    }
};