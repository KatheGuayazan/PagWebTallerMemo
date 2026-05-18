// ============================================
// Sistema de Partidas Firestore (Cliente)
// Estructura real:
// Sections/{IDPartida}
//   - Comportamiento: map
//   - Estadistica: array de maps
// ============================================

import { FirestoreService } from '../../Modules/firebase.service.js';

let currentPartidaId = '';
let currentPartidaData = null;
const firestoreService = new FirestoreService('Sections');

// ============================================
// Funciones Auxiliares
// ============================================

async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const cleanEndpoint = endpoint.replace(/^\//, '');
        const parts = cleanEndpoint.split('/').filter(Boolean);

        if (parts[0] === 'partidas' && method === 'GET') {
            return { success: true, data: await firestoreService.getPartidas() };
        }

        if (parts[0] === 'partida' && parts.length === 2 && method === 'GET') {
            const partida = await firestoreService.getPartidaById(parts[1]);

            if (!partida) {
                return null;
            }

            return { success: true, data: partida };
        }

        if (parts[0] === 'partida' && parts.length === 1 && method === 'POST') {
            const { partidaId, data: partidaData } = data || {};

            if (!partidaId || !partidaData) {
                throw new Error('partidaId y data son requeridos');
            }

            await firestoreService.createOrUpdatePartida(partidaId, partidaData);
            return { success: true, message: 'Partida guardada' };
        }

        throw new Error(`Endpoint no soportado: ${method} ${endpoint}`);
    } catch (error) {
        console.error('Error en Firestore:', error);
        alert(`Error: ${error.message}`);
        return null;
    }
}

function createResultsContainer() {
    const existing = document.getElementById('results');
    if (existing) return existing;

    const container = document.createElement('div');
    container.id = 'results';
    container.style.marginTop = '20px';
    container.style.padding = '15px';
    document.body.appendChild(container);
    return container;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatCellValue(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    if (typeof value === 'object') {
        return `<pre style="margin:0;white-space:pre-wrap;">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    }

    return escapeHtml(value);
}

function renderMapTable(title, data) {
    const entries = Object.entries(data || {});

    if (entries.length === 0) {
        return `<h3>${escapeHtml(title)}</h3><p>Sin datos</p>`;
    }

    const rows = entries
        .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${formatCellValue(value)}</td></tr>`)
        .join('');

    return `
        <h3>${escapeHtml(title)}</h3>
        <table>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function renderArrayOfMaps(title, data) {
    if (!Array.isArray(data) || data.length === 0) {
        return `<h3>${escapeHtml(title)}</h3><p>Lista vacía</p>`;
    }

    const headers = new Set();
    data.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            Object.keys(item).forEach(key => headers.add(key));
        }
    });

    const headerList = Array.from(headers);

    if (headerList.length === 0) {
        return `<h3>${escapeHtml(title)}</h3><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    const head = headerList.map(header => `<th>${escapeHtml(header)}</th>`).join('');
    const body = data.map((item, index) => {
        const row = headerList.map(header => `<td>${formatCellValue(item?.[header])}</td>`).join('');
        return `<tr><td style="font-weight:700;">${index}</td>${row}</tr>`;
    }).join('');

    return `
        <h3>${escapeHtml(title)}</h3>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    ${head}
                </tr>
            </thead>
            <tbody>${body}</tbody>
        </table>
    `;
}

function displayResults(data, title = 'Resultados') {
    const resultContainer = document.getElementById('results') || createResultsContainer();

    if (data === null || data === undefined) {
        resultContainer.innerHTML = `<p style="color:red;">${escapeHtml(title)}: No hay datos</p>`;
        return;
    }

    if (Array.isArray(data)) {
        resultContainer.innerHTML = renderArrayOfMaps(title, data);
        return;
    }

    if (typeof data === 'object') {
        resultContainer.innerHTML = renderMapTable(title, data);
        return;
    }

    resultContainer.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(data)}</p>`;
}

function parseNumber(value, integer = false) {
    if (value === '') return null;
    const parsed = integer ? parseInt(value, 10) : parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
}

async function loadCurrentPartida() {
    if (!currentPartidaId) {
        alert('Selecciona una partida primero');
        return null;
    }

    const result = await apiCall(`/partida/${currentPartidaId}`);
    if (!result?.data) {
        return null;
    }

    currentPartidaData = result.data;
    return result.data;
}

function getComportamientoFormData() {
    const numeroSecciones = document.getElementById('numeroSecciones').value.trim();
    const tiempoInstruccionesSeg = document.getElementById('tiempoInstruccionesSeg').value.trim();

    const currentValue = (currentPartidaData && typeof currentPartidaData.Comportamiento === 'object' && !Array.isArray(currentPartidaData.Comportamiento))
        ? { ...currentPartidaData.Comportamiento }
        : {};

    const updates = {};
    const secciones = parseNumber(numeroSecciones, true);
    const tiempo = parseNumber(tiempoInstruccionesSeg, false);

    if (secciones !== null) updates.NumeroSecciones = secciones;
    if (tiempo !== null) updates.TiempoInstruccionesSeg = tiempo;

    return { ...currentValue, ...updates };
}

function getEstadisticaFormData() {
    const arduinosPerdidos = document.getElementById('arduinosPerdidos').value.trim();
    const arduinosRecolectados = document.getElementById('arduinosRecolectados').value.trim();
    const toxicosEsquivados = document.getElementById('toxicosEsquivados').value.trim();
    const nombre = document.getElementById('estadisticaNombre').value.trim();
    const horaInicio = document.getElementById('horaInicio').value.trim();
    const horaFinal = document.getElementById('horaFinal').value.trim();

    const data = {};

    const perdidos = parseNumber(arduinosPerdidos, true);
    const recolectados = parseNumber(arduinosRecolectados, true);
    const toxicos = parseNumber(toxicosEsquivados, true);

    if (perdidos !== null) data.ArduinosPerdidos = perdidos;
    if (recolectados !== null) data.ArduinosRecolectados = recolectados;
    if (toxicos !== null) data.ToxicosEsquivados = toxicos;
    if (nombre) data.Nombre = nombre;
    if (horaInicio) data.HoraInicio = new Date(horaInicio).toISOString();
    data.HoraFinal = horaFinal ? new Date(horaFinal).toISOString() : new Date().toISOString();

    return data;
}

let estadisticaChart = null;
let mejorasChart = null;
let tiempoChart = null;
let radarChart = null;

function getLatestEstadisticaEntry() {
    const estadistica = Array.isArray(currentPartidaData?.Estadistica)
        ? currentPartidaData.Estadistica
        : [];

    if (estadistica.length === 0) {
        return null;
    }

    return estadistica[estadistica.length - 1];
}

function getTotalScore(entry) {
    const recolectados = parseNumber(String(entry?.ArduinosRecolectados ?? '0'), true) || 0;
    const toxicos = parseNumber(String(entry?.ToxicosEsquivados ?? '0'), true) || 0;
    const perdidos = parseNumber(String(entry?.ArduinosPerdidos ?? '0'), true) || 0;
    return recolectados + toxicos - perdidos;
}

function getMejorasData() {
    const estadistica = Array.isArray(currentPartidaData?.Estadistica)
        ? currentPartidaData.Estadistica
        : [];

    return estadistica.map((entry, index) => {
        const total = getTotalScore(entry);
        return {
            label: `Intento ${index + 1}`,
            value: Math.max(0, total),
            raw: total
        };
    });
}

function renderEstadisticaChart(entry) {
    const recolectados = parseNumber(String(entry?.ArduinosRecolectados ?? '0'), true) || 0;
    const toxicos = parseNumber(String(entry?.ToxicosEsquivados ?? '0'), true) || 0;
    const perdidos = parseNumber(String(entry?.ArduinosPerdidos ?? '0'), true) || 0;
    const total = recolectados + toxicos - perdidos;

    const ctx = document.getElementById('estadisticaChart');
    if (!ctx) {
        console.error('No se encontró el canvas del gráfico');
        return;
    }

    if (estadisticaChart) {
        estadisticaChart.destroy();
    }

    estadisticaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Recolectados', 'Tóxicos', 'Perdidos', 'Total'],
            datasets: [{
                label: 'Comparativa de Arduinos',
                data: [recolectados, toxicos, perdidos, total],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de Arduinos'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.parsed.y}`
                    }
                }
            }
        }
    });
}

function renderMejorasDonutChart() {
    const mejorasData = getMejorasData();
    if (mejorasData.length === 0) {
        alert('No hay datos de estadística para mostrar las mejoras.');
        return;
    }

    const labels = mejorasData.map(item => item.label);
    const dataValues = mejorasData.map(item => item.value);

    if (dataValues.every(value => value === 0)) {
        alert('No hay valores válidos para mostrar en el gráfico de mejoras. Asegúrate de que los datos de estadística contengan puntuaciones positivas.');
        return;
    }

    const ctx = document.getElementById('mejorasChart');
    if (!ctx) {
        console.error('No se encontró el canvas de mejoras');
        return;
    }

    if (mejorasChart) {
        mejorasChart.destroy();
    }

    mejorasChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                label: 'Puntuación final por intento',
                data: dataValues,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            cutout: '40%',
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = context.parsed;
                            const rawValue = mejorasData[context.dataIndex]?.raw ?? value;
                            return `${context.label}: ${rawValue} puntos`;
                        }
                    }
                }
            }
        }
    });
}

function getPlayTimes() {
    const estadistica = Array.isArray(currentPartidaData?.Estadistica)
        ? currentPartidaData.Estadistica
        : [];

    return estadistica
        .map((entry, index) => {
            let horaInicio = entry?.HoraInicio;
            let horaFinal = entry?.HoraFinal;

            // Convertir timestamps de Firestore a milisegundos
            if (typeof horaInicio === 'object' && horaInicio !== null && 'seconds' in horaInicio) {
                horaInicio = horaInicio.seconds * 1000 + horaInicio.nanoseconds / 1000000;
            } else if (typeof horaInicio === 'number') {
                horaInicio = horaInicio;
            } else if (typeof horaInicio === 'string') {
                horaInicio = new Date(horaInicio).getTime();
            } else {
                horaInicio = NaN;
            }

            if (typeof horaFinal === 'object' && horaFinal !== null && 'seconds' in horaFinal) {
                horaFinal = horaFinal.seconds * 1000 + horaFinal.nanoseconds / 1000000;
            } else if (typeof horaFinal === 'number') {
                horaFinal = horaFinal;
            } else if (typeof horaFinal === 'string') {
                horaFinal = new Date(horaFinal).getTime();
            } else {
                horaFinal = NaN;
            }

            if (Number.isNaN(horaInicio) || Number.isNaN(horaFinal) || horaFinal <= horaInicio) {
                return null;
            }

            const tiempoSegundos = Math.round((horaFinal - horaInicio) / 1000);
            return {
                intentoIndex: index,
                intento: `Intento ${index + 1}`,
                tiempoSegundos,
                x: index + 1,
                y: tiempoSegundos,
                r: 8
            };
        })
        .filter(item => item !== null);
}

function renderTiempoLineChart() {
    const playTimes = getPlayTimes();

    if (playTimes.length === 0) {
        alert('No hay datos válidos de tiempo de juego para mostrar.');
        return;
    }

    const ctx = document.getElementById('tiempoChart');
    if (!ctx) {
        console.error('No se encontró el canvas del gráfico de tiempo');
        return;
    }

    if (tiempoChart) {
        tiempoChart.destroy();
    }

    const labels = playTimes.map(p => p.intento);
    const dataValues = playTimes.map(p => p.tiempoSegundos);

    tiempoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Tiempo de Juego (segundos)',
                data: dataValues,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tiempo (segundos)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.parsed.y} segundos`;
                        }
                    }
                }
            }
        }
    });
}

function renderPuntajesRadarChart() {
    const estadistica = Array.isArray(currentPartidaData?.Estadistica)
        ? currentPartidaData.Estadistica
        : [];

    if (estadistica.length === 0) {
        alert('No hay datos de estadística para mostrar los puntajes.');
        return;
    }

    const labels = estadistica.map((_, index) => `Intento ${index + 1}`);
    const puntajes = estadistica.map((entry, index) => getTotalScore(entry));

    const ctx = document.getElementById('puntajesRadarChart');
    if (!ctx) {
        console.error('No se encontró el canvas del gráfico radar');
        return;
    }

    if (radarChart) {
        radarChart.destroy();
    }

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: 'Puntaje por Intento',
                data: puntajes,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `${value}`
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.label}: ${context.parsed.r} puntos`;
                        }
                    }
                }
            }
        }
    });
}

async function showEstadisticaChart() {
    if (!currentPartidaId) {
        alert('Selecciona una partida primero para mostrar el gráfico');
        return;
    }

    if (!currentPartidaData) {
        await loadCurrentPartida();
    }

    const latest = getLatestEstadisticaEntry();
    if (!latest) {
        alert('No hay datos de estadística disponibles para esta partida');
        return;
    }

    renderEstadisticaChart(latest);
}

// ============================================
// Event Listeners - Partidas
// ============================================

const loadPartidasBtn = document.getElementById('loadPartidasBtn');
if (loadPartidasBtn) {
    loadPartidasBtn.addEventListener('click', async () => {
        const result = await apiCall('/partidas');
        if (result) {
            displayResults(result.data, '📋 Lista de Partidas');
        }
    });
}

const selectPartidaBtn = document.getElementById('selectPartidaBtn');
if (selectPartidaBtn) {
    selectPartidaBtn.addEventListener('click', async () => {
        const input = document.getElementById('partidaIdInput');
        currentPartidaId = input.value.trim();

        if (!currentPartidaId) {
            alert('Ingresa un ID de partida');
            return;
        }

        const partida = await loadCurrentPartida();
        if (partida) {
            console.log('✅ Partida seleccionada:', currentPartidaId);
            alert(`✅ Partida seleccionada: ${currentPartidaId}`);
            displayResults(partida, `📂 Datos de Partida: ${currentPartidaId}`);
        }
    });
}

const createPartidaBtn = document.getElementById('createPartidaBtn');
if (createPartidaBtn) {
    createPartidaBtn.addEventListener('click', async () => {
        const partidaId = document.getElementById('newPartidaId').value.trim();
        const nombre = document.getElementById('newPartidaNombre').value.trim();

        if (!partidaId || !nombre) {
            alert('Ingresa ID y nombre de la partida');
            return;
        }

        const result = await apiCall('/partida', 'POST', {
            partidaId,
            data: {
                Nombre: nombre,
                FechaCreacion: new Date().toISOString(),
                Comportamiento: {},
                Estadistica: []
            }
        });

        if (result) {
            alert(`✅ Partida creada: ${partidaId}`);
        }
    });
}

// ============================================
// Event Listeners - Comportamiento
// ============================================

const loadComportamientoBtn = document.getElementById('loadComportamientoBtn');
if (loadComportamientoBtn) {
    loadComportamientoBtn.addEventListener('click', async () => {
        const comportamiento = await firestoreService.getComportamiento(currentPartidaId);
        displayResults(comportamiento, `🎮 Comportamiento de ${currentPartidaId}`);
    });
}

const updateComportamientoBtn = document.getElementById('updateComportamientoBtn');
if (updateComportamientoBtn) {
    updateComportamientoBtn.addEventListener('click', async () => {
        const comportamiento = getComportamientoFormData();

        if (Object.keys(comportamiento).length === 0) {
            alert('Ingresa al menos un campo para Comportamiento');
            return;
        }

        const result = await firestoreService.updateComportamiento(currentPartidaId, comportamiento);

        if (result) {
            currentPartidaData = { ...(currentPartidaData || {}), Comportamiento: comportamiento };
            alert('✅ Comportamiento guardado');
        }
    });
}

// ============================================
// Event Listeners - Estadistica
// ============================================

const loadEstadisticaBtn = document.getElementById('loadEstadisticaBtn');
if (loadEstadisticaBtn) {
    loadEstadisticaBtn.addEventListener('click', async () => {
        const estadistica = await firestoreService.getEstadistica(currentPartidaId);
        displayResults(estadistica, `📊 Estadística de ${currentPartidaId}`);
    });
}

const showEstadisticaChartBtn = document.getElementById('showEstadisticaChartBtn');
if (showEstadisticaChartBtn) {
    showEstadisticaChartBtn.addEventListener('click', async () => {
        await showEstadisticaChart();
    });
}

const showMejorasChartBtn = document.getElementById('showMejorasChartBtn');
if (showMejorasChartBtn) {
    showMejorasChartBtn.addEventListener('click', async () => {
        if (!currentPartidaId) {
            alert('Selecciona una partida primero para mostrar el gráfico de mejoras');
            return;
        }

        if (!currentPartidaData) {
            await loadCurrentPartida();
        }

        renderMejorasDonutChart();
    });
}

const showTiempoChartBtn = document.getElementById('showTiempoChartBtn');
if (showTiempoChartBtn) {
    showTiempoChartBtn.addEventListener('click', async () => {
        if (!currentPartidaId) {
            alert('Selecciona una partida primero para mostrar el gráfico de tiempo');
            return;
        }

        if (!currentPartidaData) {
            await loadCurrentPartida();
        }

        renderTiempoLineChart();
    });
}

const showPuntajesRadarBtn = document.getElementById('showPuntajesRadarBtn');
if (showPuntajesRadarBtn) {
    showPuntajesRadarBtn.addEventListener('click', async () => {
        if (!currentPartidaId) {
            alert('Selecciona una partida primero para mostrar el gráfico de puntajes');
            return;
        }

        if (!currentPartidaData) {
            await loadCurrentPartida();
        }

        renderPuntajesRadarChart();
    });
}

const updateEstadisticaBtn = document.getElementById('updateEstadisticaBtn');
if (updateEstadisticaBtn) {
    updateEstadisticaBtn.addEventListener('click', async () => {
        const estadisticaNueva = getEstadisticaFormData();
        const estadisticaActual = Array.isArray(currentPartidaData?.Estadistica)
            ? currentPartidaData.Estadistica.map(item => (item && typeof item === 'object' && !Array.isArray(item) ? { ...item } : item))
            : [];

        const indexValue = document.getElementById('estadisticaIndex').value.trim();

        if (indexValue === '') {
            estadisticaActual.push(estadisticaNueva);
        } else {
            const index = parseInt(indexValue, 10);
            if (Number.isNaN(index) || index < 0) {
                alert('El índice de estadística debe ser un número válido o dejarse vacío');
                return;
            }

            estadisticaActual[index] = {
                ...(estadisticaActual[index] && typeof estadisticaActual[index] === 'object' && !Array.isArray(estadisticaActual[index]) ? estadisticaActual[index] : {}),
                ...estadisticaNueva
            };
        }

        const result = await firestoreService.updateEstadistica(currentPartidaId, estadisticaActual);

        if (result) {
            currentPartidaData = { ...(currentPartidaData || {}), Estadistica: estadisticaActual };
            alert('✅ Estadística guardada');
        }
    });
}

// ============================================
// Inicialización
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Aplicación lista');
    createResultsContainer();
});
