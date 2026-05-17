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
