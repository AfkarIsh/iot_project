// ==========================================
// ESP32 Sensor Dashboard - JavaScript
// Real-time data fetching, UI updates, charts
// ==========================================

const API_BASE = 'api/';
const UPDATE_INTERVAL = 3000; // 3 seconds
const DISCONNECT_TIMEOUT = 10000; // 10 seconds - consider disconnected if no data
let isConnected = false;
let updateTimer = null;
let airQualityChart = null;
let trendChart = null;
let tempMiniChart = null;
let humMiniChart = null;
let soilMiniChart = null;
let historicalData = [];
let lastDataTime = 0;

// DOM Elements
const elements = {
    temperature: document.getElementById('temperature'),
    humidity: document.getElementById('humidity'),
    co2: document.getElementById('co2'),
    co: document.getElementById('co'),
    nh4: document.getElementById('nh4'),
    alcohol: document.getElementById('alcohol'),
    acetone: document.getElementById('acetone'),
    soilMoisture: document.getElementById('soilMoisture'),
    mq135Raw: document.getElementById('mq135Raw'),
    mq135Voltage: document.getElementById('mq135Voltage'),
    motionStatus: document.getElementById('motionStatus'),
    relayStatus: document.getElementById('relayStatus'),
    ledStatus: document.getElementById('ledStatus'),
    connectionStatus: document.getElementById('connectionStatus'),
    lastUpdate: document.getElementById('lastUpdate'),
    relayToggle: document.getElementById('relayToggle'),
    ledToggle: document.getElementById('ledToggle')
};

// Initialize dashboard
function init() {
    console.log('🚀 ESP32 Dashboard initializing...');
    clearAllValues(); // Start with blank display
    setupCharts();
    setupRelayControl();
    setupLEDControl();
    setupUnitConversion();
    setupMouseProximityEffect();
    fetchLatestData();
    fetchHistoricalData();
    startAutoUpdate();
    startDisconnectCheck();
}

// Unit conversion state
let tempUnit = 'C'; // 'C' or 'F'
let soilUnit = 'percent'; // 'percent' or 'raw'
let rawSoilValue = 0;
let celsiusValue = 0;

// Setup unit conversion
function setupUnitConversion() {
    const tempToggle = document.getElementById('tempUnitToggle');
    const soilToggle = document.getElementById('soilUnitToggle');

    if (tempToggle) {
        tempToggle.addEventListener('click', () => {
            tempUnit = tempUnit === 'C' ? 'F' : 'C';
            updateTemperatureDisplay();
        });
    }

    if (soilToggle) {
        soilToggle.addEventListener('click', () => {
            soilUnit = soilUnit === 'percent' ? 'raw' : 'percent';
            updateSoilDisplay();
        });
    }
}

function updateTemperatureDisplay() {
    const tempElement = document.getElementById('temperature');
    const unitElement = document.getElementById('tempUnit');
    if (!tempElement || !unitElement) return;

    if (tempUnit === 'F') {
        const fahrenheit = (celsiusValue * 9 / 5) + 32;
        tempElement.textContent = fahrenheit.toFixed(1);
        unitElement.textContent = '°F';
    } else {
        tempElement.textContent = celsiusValue.toFixed(1);
        unitElement.textContent = '°C';
    }
}

function updateSoilDisplay() {
    const soilElement = document.getElementById('soilMoisture');
    const unitElement = document.getElementById('soilUnit');
    if (!soilElement || !unitElement) return;

    if (soilUnit === 'raw') {
        soilElement.textContent = rawSoilValue;
        unitElement.textContent = 'ADC';
    } else {
        const percent = Math.round(((4095 - rawSoilValue) / 4095) * 100);
        soilElement.textContent = percent;
        unitElement.textContent = '%';
    }
}

// Mouse proximity effect for cards
function setupMouseProximityEffect() {
    const cards = document.querySelectorAll('.sensor-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    });
}

// Check for disconnect
function startDisconnectCheck() {
    setInterval(() => {
        const now = Date.now();
        if (lastDataTime > 0 && (now - lastDataTime) > DISCONNECT_TIMEOUT) {
            // No data for 10 seconds - disconnected
            if (isConnected) {
                console.warn('⚠️ ESP32 disconnected - no data received');
                updateConnectionStatus(false);
                clearAllValues();
            }
        }
    }, 2000); // Check every 2 seconds
}

// Fetch latest data from API
async function fetchLatestData() {
    try {
        const response = await fetch(`${API_BASE}get_latest.php`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            updateUI(result.data);
            updateConnectionStatus(true);
            lastDataTime = Date.now();
        } else {
            // No data available - clear all values
            clearAllValues();
            updateConnectionStatus(false);
        }
    } catch (error) {
        console.error('Error fetching latest data:', error);
        clearAllValues();
        updateConnectionStatus(false);
    }
}

// Clear all values when disconnected
function clearAllValues() {
    if (elements.temperature) elements.temperature.textContent = '';
    if (elements.humidity) elements.humidity.textContent = '';
    if (elements.soilMoisture) elements.soilMoisture.textContent = '';
    if (elements.co2) elements.co2.textContent = '';
    if (elements.co) elements.co.textContent = '';
    if (elements.nh4) elements.nh4.textContent = '';
    if (elements.alcohol) elements.alcohol.textContent = '';
    if (elements.acetone) elements.acetone.textContent = '';
    if (elements.mq135Raw) elements.mq135Raw.textContent = '';
    if (elements.mq135Voltage) elements.mq135Voltage.textContent = '';

    // Clear status labels
    const motionLabel = elements.motionStatus?.querySelector('.status-label');
    const relayLabel = elements.relayStatus?.querySelector('.status-label');
    const ledLabel = elements.ledStatus?.querySelector('.status-label');
    if (motionLabel) motionLabel.textContent = '';
    if (relayLabel) relayLabel.textContent = '';
    if (ledLabel) ledLabel.textContent = '';
    if (elements.lastUpdate) elements.lastUpdate.textContent = 'No data';
}

// Update connection status
function updateConnectionStatus(connected) {
    if (connected === isConnected) return;
    isConnected = connected;

    const statusText = elements.connectionStatus?.querySelector('.status-text');
    const text = connected ? 'Connected' : 'Disconnected';

    if (statusText) statusText.textContent = text;

    if (elements.connectionStatus) {
        if (connected) {
            elements.connectionStatus.classList.remove('disconnected');
        } else {
            elements.connectionStatus.classList.add('disconnected');
        }
    }
}

// Update UI with sensor data
function updateUI(data) {
    // Store raw values for unit conversion
    celsiusValue = parseFloat(data.temperature) || 0;
    rawSoilValue = parseInt(data.soil_raw) || 0;

    // Use unit conversion for temp and soil
    updateTemperatureDisplay();
    updateSoilDisplay();

    // Update other values normally
    updateValue(elements.humidity, data.humidity, 1);
    updateValue(elements.co2, data.co2_ppm, 0);
    updateValue(elements.co, data.co_ppm, 2);
    updateValue(elements.nh4, data.nh4_ppm, 2);
    updateValue(elements.alcohol, data.alcohol_ppm, 2);
    updateValue(elements.acetone, data.acetone_ppm, 2);

    if (elements.mq135Raw) elements.mq135Raw.innerText = data.mq135_raw;
    if (elements.mq135Voltage) elements.mq135Voltage.innerText = parseFloat(data.mq135_voltage).toFixed(2);
    if (elements.lastUpdate) elements.lastUpdate.innerText = `Last Update: ${data.timestamp}`;

    // Update status indicators
    updateMotionStatus(data.motion_detected);
    updateRelayStatus(data.relay_on);
    updateLEDStatus(data.led_on);

    // Update charts
    updateMiniCharts(data);
    if (airQualityChart) {
        airQualityChart.data.datasets[0].data = [
            data.co2_ppm, data.co_ppm, data.nh4_ppm,
            data.alcohol_ppm, data.acetone_ppm
        ];
        airQualityChart.update();
    }
}

function updateValue(element, value, decimals) {
    if (!element || value == null) return;
    element.innerText = parseFloat(value).toFixed(decimals);
}

function updateMotionStatus(detected) {
    if (!elements.motionStatus) return;
    const isMotion = detected === true || detected == 1;
    const label = elements.motionStatus.querySelector('.status-label');
    const dot = elements.motionStatus.querySelector('.status-dot');

    if (label) label.innerText = isMotion ? 'Motion Detected!' : 'No Motion';
    if (dot) {
        dot.style.backgroundColor = isMotion ? '#ff4757' : '#ccc';
        dot.style.boxShadow = isMotion ? '0 0 10px #ff4757' : 'none';
    }
}

function updateRelayStatus(isOn) {
    if (!elements.relayStatus) return;
    const isRelayOn = isOn === true || isOn == 1;
    const label = elements.relayStatus.querySelector('.status-label');
    const dot = elements.relayStatus.querySelector('.status-dot');

    if (label) label.innerText = isRelayOn ? 'ON' : 'OFF';
    if (dot) {
        dot.style.backgroundColor = isRelayOn ? '#2ed573' : '#ccc';
    }
    if (elements.relayToggle) elements.relayToggle.checked = isRelayOn;
}

function updateLEDStatus(isOn) {
    if (!elements.ledStatus) return;
    const isLEDOn = isOn === true || isOn == 1;
    const label = elements.ledStatus.querySelector('.status-label');
    const dot = elements.ledStatus.querySelector('.status-dot');

    if (label) label.innerText = isLEDOn ? 'ON' : 'OFF';
    if (dot) {
        dot.style.backgroundColor = isLEDOn ? '#ffc837' : '#ccc';
        dot.style.boxShadow = isLEDOn ? '0 0 10px #ffc837' : 'none';
    }
    if (elements.ledToggle) elements.ledToggle.checked = isLEDOn;
}

function updateMiniCharts(data) {
    if (tempMiniChart) {
        const temp = parseFloat(data.temperature) || 0;
        tempMiniChart.data.datasets[0].data = [temp, Math.max(0, 50 - temp)];
        tempMiniChart.update();
    }
    if (humMiniChart) {
        const hum = parseFloat(data.humidity) || 0;
        humMiniChart.data.datasets[0].data = [hum, Math.max(0, 100 - hum)];
        humMiniChart.update();
    }
    if (soilMiniChart) {
        const soil = parseFloat(data.soil_percent) || 0;
        soilMiniChart.data.datasets[0].data = [soil, Math.max(0, 100 - soil)];
        soilMiniChart.update();
    }
}

// Setup controls
function setupRelayControl() {
    if (!elements.relayToggle) return;
    elements.relayToggle.addEventListener('change', async (e) => {
        const isOn = e.target.checked;
        try {
            const response = await fetch(`${API_BASE}control_relay.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relay_on: isOn })
            });
            const result = await response.json();
            if (!result.success) {
                console.error('Relay control failed');
                elements.relayToggle.checked = !isOn;
            }
        } catch (error) {
            console.error('Error:', error);
            elements.relayToggle.checked = !isOn;
        }
    });
}

function setupLEDControl() {
    if (!elements.ledToggle) return;
    elements.ledToggle.addEventListener('change', async (e) => {
        const isOn = e.target.checked;
        try {
            const response = await fetch(`${API_BASE}control_led.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ led_on: isOn })
            });
            const result = await response.json();
            if (!result.success) {
                console.error('LED control failed');
                elements.ledToggle.checked = !isOn;
            }
        } catch (error) {
            console.error('Error:', error);
            elements.ledToggle.checked = !isOn;
        }
    });
}

// Fetch historical data
async function fetchHistoricalData() {
    try {
        const response = await fetch(`${API_BASE}get_history.php?limit=20`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            historicalData = result.data.reverse();
            updateTrendChart();
        }
    } catch (error) {
        console.error('History fetch error:', error);
    }
}

function updateTrendChart() {
    if (!trendChart || historicalData.length === 0) return;
    const labels = historicalData.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = historicalData.map(d => d.co2_ppm);
    trendChart.data.datasets[1].data = historicalData.map(d => d.co_ppm);
    trendChart.data.datasets[2].data = historicalData.map(d => d.nh4_ppm);
    trendChart.update();
}

// Setup charts (simplified for this fix)
function setupCharts() {
    const miniOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    };

    const tempCtx = document.getElementById('tempMiniChart');
    if (tempCtx) {
        tempMiniChart = new Chart(tempCtx, {
            type: 'doughnut',
            data: { datasets: [{ data: [0, 100], backgroundColor: ['#a18cd1', 'rgba(255,255,255,0.1)'] }] },
            options: miniOptions
        });
    }

    const humCtx = document.getElementById('humMiniChart');
    if (humCtx) {
        humMiniChart = new Chart(humCtx, {
            type: 'doughnut',
            data: { datasets: [{ data: [0, 100], backgroundColor: ['#66a6ff', 'rgba(255,255,255,0.1)'] }] },
            options: miniOptions
        });
    }

    const soilCtx = document.getElementById('soilMiniChart');
    if (soilCtx) {
        soilMiniChart = new Chart(soilCtx, {
            type: 'doughnut',
            data: { datasets: [{ data: [0, 100], backgroundColor: ['#84fab0', 'rgba(255,255,255,0.1)'] }] },
            options: miniOptions
        });
    }

    const aqCtx = document.getElementById('airQualityChart');
    if (aqCtx) {
        airQualityChart = new Chart(aqCtx, {
            type: 'bar',
            data: {
                labels: ['CO₂', 'CO', 'NH₄', 'Alcohol', 'Acetone'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#9966FF', '#FF6384', '#36A2EB', '#FFCE56', '#FF9F40']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'CO₂', data: [], borderColor: '#6C5DD3', tension: 0.4 },
                    { label: 'CO', data: [], borderColor: '#00D68F', tension: 0.4 },
                    { label: 'NH₄', data: [], borderColor: '#FF5B5B', tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// Auto update
function startAutoUpdate() {
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(() => {
        fetchLatestData();
        fetchHistoricalData();
    }, UPDATE_INTERVAL);
}

// Start on load
document.addEventListener('DOMContentLoaded', init);
console.log('✅ Dashboard script loaded');
