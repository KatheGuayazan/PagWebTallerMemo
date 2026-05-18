// Sistema de Partidas Firestore (Cliente) - Modo sólo lectura
import { FirestoreService } from '../../Modules/firebase.service.js';

let currentPartidaId = '';
let currentPartidaData = null;
const firestoreService = new FirestoreService('Sections');

// Charts
let estadisticaChart = null;
let mejorasChart = null;
let tiempoChart = null;
let radarChart = null;
let generalEstadisticaChart = null;
let generalMejorasChart = null;
let generalTiempoChart = null;
let generalInstruccionesChart = null;
let generalPuntajesPolarChart = null;

// ============================================
// API (solo lectura)
// ============================================
async function apiCall(endpoint, method = 'GET') {
    try {
        const cleanEndpoint = endpoint.replace(/^[\\/]+/, '');
        const parts = cleanEndpoint.split('/').filter(Boolean);

        if (parts[0] === 'partidas' && method === 'GET') {
            return { success: true, data: await firestoreService.getPartidas() };
        }

        if (parts[0] === 'partida' && parts.length === 2 && method === 'GET') {
            const partida = await firestoreService.getPartidaById(parts[1]);
            if (!partida) return null;
            return { success: true, data: partida };
        }

        throw new Error('Operación no soportada en modo solo lectura');
    } catch (err) {
        console.error(err);
        alert(err.message);
        return null;
    }
}

// ============================================
// Helpers
// ============================================
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function createResultsContainer() {
    const existing = document.getElementById('results');
    if (existing) return existing;
    const container = document.createElement('div');
    container.id = 'results';
    document.body.appendChild(container);
    return container;
}

function parseNumber(value, integer = false) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = integer ? parseInt(value, 10) : parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function getScoreBreakdown(entry) {
    const recolectados = parseNumber(String(entry?.ArduinosRecolectados ?? '0'), true) || 0;
    const toxicos = parseNumber(String(entry?.ToxicosEsquivados ?? '0'), true) || 0;
    const perdidos = parseNumber(String(entry?.ArduinosPerdidos ?? '0'), true) || 0;
    const total = recolectados + toxicos - perdidos;

    return { recolectados, toxicos, perdidos, total };
}

function getTotalScore(entry) {
    return getScoreBreakdown(entry).total;
}

function getPlayTimesFromPartida(partida) {
    const estadistica = Array.isArray(partida?.Estadistica) ? partida.Estadistica : [];
    return estadistica.map(entry => {
        let hi = entry?.HoraInicio; let hf = entry?.HoraFinal;
        if (typeof hi === 'object' && hi !== null && 'seconds' in hi) hi = hi.seconds * 1000 + (hi.nanoseconds||0)/1000000;
        else if (typeof hi === 'string') hi = new Date(hi).getTime();
        if (typeof hf === 'object' && hf !== null && 'seconds' in hf) hf = hf.seconds * 1000 + (hf.nanoseconds||0)/1000000;
        else if (typeof hf === 'string') hf = new Date(hf).getTime();
        if (Number.isNaN(hi) || Number.isNaN(hf) || hf <= hi) return null;
        return Math.round((hf - hi) / 1000);
    }).filter(v => v !== null);
}

function getPartidaLabel(partida, idx) {
    return partida?.id || partida?.Id || partida?.Nombre || `Partida ${idx+1}`;
}

function getPartidaPlayerName(partida) {
    return (
        partida?.NombreJugador ||
        partida?.Jugador ||
        partida?.Usuario ||
        partida?.Comportamiento?.NombreJugador ||
        partida?.Comportamiento?.Jugador ||
        partida?.Comportamiento?.Usuario ||
        partida?.Nombre ||
        'Sin nombre'
    );
}

function getGeneralBestScores(partidas) {
    const labels = partidas.map(getPartidaLabel);
    const dataValues = partidas.map(p => {
        const estad = Array.isArray(p?.Estadistica) ? p.Estadistica : [];
        if (!estad.length) return 0;
        return estad.reduce((max, entry) => Math.max(max, getTotalScore(entry)), -Infinity) || 0;
    });
    return { labels, dataValues };
}

function getInstructionTimeFromPartida(partida) {
    const value = partida?.Comportamiento?.TiempoInstruccionesSeg;
    const parsed = parseNumber(String(value ?? '0'));
    return parsed === null ? 0 : parsed;
}

// ============================================
// Gráficos por partida (específica)
// ============================================
function renderEstadisticaChart(entry) {
    const { recolectados, toxicos, perdidos, total } = getScoreBreakdown(entry);

    const ctx = document.getElementById('estadisticaChart');
    if (!ctx) return;
    if (estadisticaChart) estadisticaChart.destroy();

    estadisticaChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Recolectados','Tóxicos','Perdidos','Total'], datasets: [{ label: 'Estadísticas por Usuario', data: [recolectados,toxicos,perdidos,total], backgroundColor: ['rgba(54,162,235,0.7)','rgba(255,206,86,0.7)','rgba(255,99,132,0.7)','rgba(75,192,192,0.7)'] }] },
        options: { responsive: true }
    });
}

function renderMejorasDonutChartForCurrent() {
    const mejorasData = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica.map((entry, i) => ({ label: `Intento ${i+1}`, value: getTotalScore(entry) })) : [];
    if (!mejorasData.length) return;
    const labels = mejorasData.map(d => d.label);
    const dataValues = mejorasData.map(d => Math.max(0, d.value));

    const ctx = document.getElementById('mejorasChart'); if (!ctx) return; if (mejorasChart) mejorasChart.destroy();
    mejorasChart = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: dataValues }] }, options: { responsive: true } });
}

function renderTiempoLineChartForCurrent() {
    const playTimes = getPlayTimesFromPartida(currentPartidaData);
    if (!playTimes.length) return;
    const labels = playTimes.map((_,i) => `Intento ${i+1}`);
    const ctx = document.getElementById('tiempoChart'); if (!ctx) return; if (tiempoChart) tiempoChart.destroy();
    tiempoChart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Tiempo (s)', data: playTimes }] }, options: { responsive: true } });
}

function renderPuntajesRadarChartForCurrent() {
    const estadistica = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica : [];
    if (!estadistica.length) return;
    const labels = estadistica.map((_,i) => `Intento ${i+1}`);
    const dataValues = estadistica.map(e => getTotalScore(e));
    const ctx = document.getElementById('puntajesRadarChart'); if (!ctx) return; if (radarChart) radarChart.destroy();
    radarChart = new Chart(ctx, { type: 'radar', data: { labels, datasets: [{ label: 'Puntaje por Intento', data: dataValues }] }, options: { responsive: true } });
}

// ============================================
// Gráficos generales
// ============================================
function renderGeneralEstadisticaChart(partidas) {
    const { labels, dataValues } = getGeneralBestScores(partidas);

    const ctx = document.getElementById('generalEstadisticaChart'); if (!ctx) return; if (generalEstadisticaChart) generalEstadisticaChart.destroy();

    generalEstadisticaChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Mejor puntaje por Partida', data: dataValues, backgroundColor: dataValues.map(v => v<0 ? 'rgba(255,99,132,0.7)' : 'rgba(54,162,235,0.7)') }] },
        options: { responsive: true, scales: { y: { beginAtZero: false, suggestedMin: Math.min(0, ...dataValues, -1) } } }
    });

    // mostrar lista de negativos
    const negEl = document.getElementById('generalEstadisticaNegativos');
    if (negEl) {
        const negativos = labels.filter((l,i) => dataValues[i] < 0);
        negEl.innerHTML = negativos.length ? `<strong>Partidas con puntajes negativos:</strong> ${negativos.map(escapeHtml).join(', ')}` : '';
    }
}

function renderGeneralMejorasDonutChart(partidas) {
    const labels = partidas.map(getPartidaLabel);
    const dataValues = partidas.map(p => {
        const estad = Array.isArray(p?.Estadistica) ? p.Estadistica : [];
        return estad.length ? Math.max(...estad.map(e => getTotalScore(e))) : 0;
    });
    const ctx = document.getElementById('generalMejorasChart'); if (!ctx) return; if (generalMejorasChart) generalMejorasChart.destroy();
    generalMejorasChart = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: dataValues }] }, options: { responsive: true } });
}

function renderGeneralTiempoLineChart(partidas) {
    // excluir partidas con mejor puntaje negativo
    const partidasValidas = partidas.filter(p => {
        const estad = Array.isArray(p?.Estadistica) ? p.Estadistica : [];
        const best = estad.length ? Math.max(...estad.map(e => getTotalScore(e))) : 0;
        return best >= 0;
    });
    if (!partidasValidas.length) {
        const ctx = document.getElementById('generalTiempoChart'); if (ctx && generalTiempoChart) { generalTiempoChart.destroy(); ctx.getContext('2d').clearRect(0,0,ctx.width,ctx.height); }
        return;
    }

    // max attempts
    const maxAttempts = Math.max(...partidasValidas.map(p => Array.isArray(p?.Estadistica) ? p.Estadistica.length : 0), 0);
    const labels = Array.from({length: maxAttempts}, (_,i) => `Intento ${i+1}`);

    const datasets = partidasValidas.map((p, idx) => {
        const times = getPlayTimesFromPartida(p);
        while (times.length < maxAttempts) times.push(null);
        const hue = (idx*50)%360;
        return { label: getPartidaLabel(p, idx), data: times, borderColor: `hsl(${hue} 70% 50%)`, backgroundColor: `hsl(${hue} 70% 30%)`, fill: false, spanGaps: true };
    });

    const ctx = document.getElementById('generalTiempoChart'); if (!ctx) return; if (generalTiempoChart) generalTiempoChart.destroy();
    generalTiempoChart = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, plugins: { legend: { position: 'right' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Tiempo (s)' } } } } });
}

function renderGeneralInstruccionesBarChart(partidas) {
    const labels = partidas.map(getPartidaLabel);
    const dataValues = partidas.map(getInstructionTimeFromPartida);

    const ctx = document.getElementById('generalInstruccionesChart');
    if (!ctx) return;
    if (generalInstruccionesChart) generalInstruccionesChart.destroy();

    generalInstruccionesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Tiempo de instrucciones (s)',
                data: dataValues,
                backgroundColor: 'rgba(168, 85, 247, 0.75)',
                borderColor: 'rgba(196, 181, 253, 1)',
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Segundos' },
                },
            },
        },
    });
}

function renderGeneralPuntajesPolarChart(partidas) {
    const { labels, dataValues } = getGeneralBestScores(partidas);
    const absValues = dataValues.map(v => Math.abs(v));

    const ctx = document.getElementById('generalPuntajesPolarChart'); if (!ctx) return; if (generalPuntajesPolarChart) generalPuntajesPolarChart.destroy();
    generalPuntajesPolarChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels,
            datasets: [{
                data: absValues,
                backgroundColor: dataValues.map((value, i) => value < 0 ? 'rgba(255,99,132,0.7)' : `hsl(${(i*40)%360} 70% 60%)`)
            }]
        },
        options: { responsive: true }
    });

    const negEl = document.getElementById('generalPolarNegativos');
    if (negEl) {
        const negativos = labels.filter((label, index) => dataValues[index] < 0);
        negEl.innerHTML = negativos.length ? `<strong>Partidas con puntajes negativos:</strong> ${negativos.map(escapeHtml).join(', ')}` : '';
    }
}

function renderTopRanking(partidas) {
        const container = document.getElementById('topRankingContainer');
        if (!container) return;

    const rows = partidas.map((partida, partidaIndex) => {
        const estadistica = Array.isArray(partida?.Estadistica) ? partida.Estadistica : [];
        const partidaLabel = getPartidaLabel(partida, partidaIndex);

        const resumen = estadistica.reduce((accumulator, entry) => {
            const { recolectados, toxicos, perdidos, total } = getScoreBreakdown(entry);
            accumulator.recolectados += recolectados;
            accumulator.toxicos += toxicos;
            accumulator.perdidos += perdidos;
            accumulator.total += total;
            return accumulator;
        }, { recolectados: 0, toxicos: 0, perdidos: 0, total: 0 });

        return {
            partidaLabel,
            playerName: getPartidaPlayerName(partida),
            recolectados: resumen.recolectados,
            toxicos: resumen.toxicos,
            perdidos: resumen.perdidos,
            total: resumen.total,
        };
    }).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.partidaLabel.localeCompare(b.partidaLabel);
    });

        if (!rows.length) {
                container.innerHTML = '<p>No hay datos suficientes para construir el ranking.</p>';
                return;
        }

    const totalGeneral = rows.reduce((sum, row) => sum + row.total, 0);
        const partidasConDatos = new Set(rows.map(row => row.partidaLabel)).size;

        container.innerHTML = `
            <div class="ranking-summary">
                <div><strong>Documentos analizados:</strong> ${partidasConDatos}</div>
                <div><strong>Total general acumulado:</strong> ${totalGeneral}</div>
            </div>
            <div class="ranking-table-wrap">
                <table class="puntajes-table ranking-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Partida</th>
                <th>Nombre</th>
                <th>Recolectados acumulados</th>
                <th>Tóxicos acumulados</th>
                <th>Perdidos acumulados</th>
                <th>Total acumulado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((row, index) => `
                            <tr class="${index === 0 ? 'podium-gold' : index === 1 ? 'podium-silver' : index === 2 ? 'podium-bronze' : ''}">
                                <td>${index + 1}</td>
                                <td>${escapeHtml(row.partidaLabel)}</td>
                                <td>${escapeHtml(row.playerName)}</td>
                                <td>${row.recolectados}</td>
                                <td>${row.toxicos}</td>
                                <td>${row.perdidos}</td>
                                <td>${row.total}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
}

const updateAllGeneralBtn = document.getElementById('updateAllGeneralBtn');
if (updateAllGeneralBtn) {
    updateAllGeneralBtn.addEventListener('click', async () => {
        const res = await apiCall('/partidas');
        if (!res?.data) { alert('No se pudieron cargar las partidas para estadísticas generales'); return; }
        const partidas = Array.isArray(res.data) ? res.data : [];
        renderGeneralEstadisticaChart(partidas);
        renderGeneralMejorasDonutChart(partidas);
        renderGeneralTiempoLineChart(partidas);
        renderGeneralInstruccionesBarChart(partidas);
        renderGeneralPuntajesPolarChart(partidas);
        renderTopRanking(partidas);
    });
}

const updateTopRankingBtn = document.getElementById('updateTopRankingBtn');
if (updateTopRankingBtn) {
    updateTopRankingBtn.addEventListener('click', async () => {
        const res = await apiCall('/partidas');
        if (!res?.data) { alert('No se pudieron cargar las partidas para el ranking'); return; }
        renderTopRanking(Array.isArray(res.data) ? res.data : []);
    });
}

// ============================================
// Interacciones por partida
// ============================================
const selectPartidaForStatsBtn = document.getElementById('selectPartidaForStatsBtn');
if (selectPartidaForStatsBtn) {
    selectPartidaForStatsBtn.addEventListener('click', async () => {
        const input = document.getElementById('estadisticasPartidaId');
        currentPartidaId = input.value.trim();
        if (!currentPartidaId) { alert('Ingresa un ID de partida'); return; }
        const res = await apiCall(`/partida/${currentPartidaId}`);
        if (!res?.data) { alert('Partida no encontrada'); return; }
        currentPartidaData = res.data;
        const container = document.getElementById('results') || createResultsContainer();
        const attempts = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica.length : 0;
        container.innerHTML = `<p>Intentos disponibles: ${attempts}. Usa los botones debajo de cada gráfico para mostrarlos o pulsa "Mostrar tabla de puntajes de la partida".</p>`;
    });
}

const showEstadisticaChartBtn = document.getElementById('showEstadisticaChartBtn'); if (showEstadisticaChartBtn) showEstadisticaChartBtn.addEventListener('click', () => { const latest = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica.slice(-1)[0] : null; if (!latest) { alert('No hay datos'); return; } renderEstadisticaChart(latest); });
const showMejorasChartBtn = document.getElementById('showMejorasChartBtn'); if (showMejorasChartBtn) showMejorasChartBtn.addEventListener('click', () => { renderMejorasDonutChartForCurrent(); });
const showTiempoChartBtn = document.getElementById('showTiempoChartBtn'); if (showTiempoChartBtn) showTiempoChartBtn.addEventListener('click', () => { renderTiempoLineChartForCurrent(); });
const showPuntajesRadarBtn = document.getElementById('showPuntajesRadarBtn'); if (showPuntajesRadarBtn) showPuntajesRadarBtn.addEventListener('click', () => { renderPuntajesRadarChartForCurrent(); });

// tabla de puntajes por partida
function formatTimestamp(ts) {
    if (!ts) return '';
    let millis = null;
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) millis = ts.seconds * 1000 + (ts.nanoseconds||0)/1000000;
    else if (typeof ts === 'string') millis = new Date(ts).getTime();
    else if (typeof ts === 'number') millis = ts;
    if (!millis || Number.isNaN(millis)) return '';
    return new Date(millis).toLocaleString();
}

function renderPartidaTable() {
    if (!currentPartidaData) { alert('Selecciona primero una partida'); return; }
    const estad = Array.isArray(currentPartidaData.Estadistica) ? currentPartidaData.Estadistica : [];
    const container = document.getElementById('results') || createResultsContainer();
    if (!estad.length) { container.innerHTML = `<p>No hay intentos para mostrar.</p>`; return; }
    const partidaLabel = getPartidaLabel(currentPartidaData, 0);
    const playerName = getPartidaPlayerName(currentPartidaData);

    const rows = estad.map((entry, idx) => {
        const inicio = formatTimestamp(entry?.HoraInicio) || '-';
        const fin = formatTimestamp(entry?.HoraFinal) || '-';
        const { recolectados, toxicos, perdidos, total } = getScoreBreakdown(entry);
        return `<tr><td>${idx+1}</td><td>${escapeHtml(inicio)}</td><td>${escapeHtml(fin)}</td><td>${recolectados}</td><td>${toxicos}</td><td>${perdidos}</td><td>${total}</td></tr>`;
    }).join('');

    container.innerHTML = `
            <h3>Tabla de puntajes - Documento: ${escapeHtml(partidaLabel)} | Nombre: ${escapeHtml(playerName)}</h3>
      <table class="puntajes-table">
                <thead><tr><th>#</th><th>Hora Inicio</th><th>Hora Final</th><th>Recolectados</th><th>Tóxicos</th><th>Perdidos</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
}

const showPartidaTableBtn = document.getElementById('showPartidaTableBtn'); if (showPartidaTableBtn) showPartidaTableBtn.addEventListener('click', () => { renderPartidaTable(); });

// helpers: displayResults (simple)
function renderMapTable(title, data) {
    const entries = Object.entries(data || {});
    if (!entries.length) return `<h3>${escapeHtml(title)}</h3><p>Sin datos</p>`;
    return `<h3>${escapeHtml(title)}</h3><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
}
function renderArrayOfMaps(title, data) { return `<h3>${escapeHtml(title)}</h3><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`; }
function displayResults(data, title='Resultados') { const resultContainer = document.getElementById('results') || createResultsContainer(); const el = document.getElementById('results'); el.innerHTML = Array.isArray(data) ? renderArrayOfMaps(title,data) : (typeof data==='object' ? renderMapTable(title,data) : `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(String(data))}</p>`); }

// Init
document.addEventListener('DOMContentLoaded', () => { createResultsContainer(); console.log('App lista'); });
