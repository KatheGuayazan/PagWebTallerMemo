import {
    apiCall,
    createResultsContainer,
    escapeHtml,
    formatTimestamp,
    getPartidaLabel,
    getPartidaPlayerName,
    getPlayTimesFromPartida,
    getScoreBreakdown,
    getTotalScore,
} from './common.js';

let currentPartidaId = '';
let currentPartidaData = null;

let estadisticaChart = null;
let mejorasChart = null;
let tiempoChart = null;
let radarChart = null;

function renderEstadisticaChart(entry) {
    const { recolectados, toxicos, perdidos, total } = getScoreBreakdown(entry);
    const ctx = document.getElementById('estadisticaChart');
    if (!ctx) return;
    if (estadisticaChart) estadisticaChart.destroy();

    estadisticaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Recolectados', 'Tóxicos', 'Perdidos', 'Total'],
            datasets: [{
                label: 'Estadísticas por Usuario',
                data: [recolectados, toxicos, perdidos, total],
                backgroundColor: ['rgba(54,162,235,0.7)', 'rgba(255,206,86,0.7)', 'rgba(255,99,132,0.7)', 'rgba(75,192,192,0.7)'],
            }],
        },
        options: { responsive: true },
    });
}

function renderMejorasDonutChartForCurrent() {
    const mejorasData = Array.isArray(currentPartidaData?.Estadistica)
        ? currentPartidaData.Estadistica.map((entry, index) => ({ label: `Intento ${index + 1}`, value: getTotalScore(entry) }))
        : [];

    if (!mejorasData.length) return;
    const labels = mejorasData.map((data) => data.label);
    const rawValues = mejorasData.map((data) => data.value);
    const hasNegativeValues = rawValues.some((value) => value < 0);

    const ctx = document.getElementById('mejorasChart');
    if (!ctx) return;

    if (hasNegativeValues) {
        if (mejorasChart) {
            mejorasChart.destroy();
            mejorasChart = null;
        }

        const context = ctx.getContext('2d');
        context.clearRect(0, 0, ctx.width, ctx.height);
        context.fillStyle = '#f3e8ff';
        context.font = '600 16px Inter, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('No se puede visualizar porque hay data negativa.', ctx.width / 2, ctx.height / 2);
        return;
    }

    const dataValues = rawValues.map((value) => Math.max(0, value));
    if (mejorasChart) mejorasChart.destroy();

    mejorasChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: dataValues }] },
        options: { responsive: true },
    });
}

function renderTiempoLineChartForCurrent() {
    const playTimes = getPlayTimesFromPartida(currentPartidaData);
    if (!playTimes.length) return;

    const labels = playTimes.map((_, index) => `Intento ${index + 1}`);
    const ctx = document.getElementById('tiempoChart');
    if (!ctx) return;
    if (tiempoChart) tiempoChart.destroy();

    tiempoChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Tiempo (s)', data: playTimes }] },
        options: { responsive: true },
    });
}

function renderPuntajesRadarChartForCurrent() {
    const estadistica = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica : [];
    if (!estadistica.length) return;

    const labels = estadistica.map((_, index) => `Intento ${index + 1}`);
    const dataValues = estadistica.map((entry) => getTotalScore(entry));

    const ctx = document.getElementById('puntajesRadarChart');
    if (!ctx) return;
    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: { labels, datasets: [{ label: 'Puntaje por Intento', data: dataValues }] },
        options: { responsive: true },
    });
}

function renderPartidaTable() {
    if (!currentPartidaData) {
        alert('Selecciona primero una partida');
        return;
    }

    const estad = Array.isArray(currentPartidaData.Estadistica) ? currentPartidaData.Estadistica : [];
    const container = document.getElementById('results') || createResultsContainer();

    if (!estad.length) {
        container.innerHTML = '<p>No hay intentos para mostrar.</p>';
        return;
    }

    const partidaLabel = getPartidaLabel(currentPartidaData, 0);
    const playerName = getPartidaPlayerName(currentPartidaData);

    const rows = estad.map((entry, index) => {
        const inicio = formatTimestamp(entry?.HoraInicio) || '-';
        const fin = formatTimestamp(entry?.HoraFinal) || '-';
        const { recolectados, toxicos, perdidos, total } = getScoreBreakdown(entry);
        return `<tr><td>${index + 1}</td><td>${escapeHtml(inicio)}</td><td>${escapeHtml(fin)}</td><td>${recolectados}</td><td>${toxicos}</td><td>${perdidos}</td><td>${total}</td></tr>`;
    }).join('');

    container.innerHTML = `
      <h3>Tabla de puntajes - Documento: ${escapeHtml(partidaLabel)} | Nombre: ${escapeHtml(playerName)}</h3>
      <table class="puntajes-table">
        <thead><tr><th>#</th><th>Hora Inicio</th><th>Hora Final</th><th>Recolectados</th><th>Tóxicos</th><th>Perdidos</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
}

async function selectPartidaForStats() {
    const input = document.getElementById('estadisticasPartidaId');
    currentPartidaId = input?.value.trim() || '';

    if (!currentPartidaId) {
        alert('Ingresa un ID de partida');
        return;
    }

    const res = await apiCall(`/partida/${currentPartidaId}`);
    if (!res?.data) {
        alert('Partida no encontrada');
        return;
    }

    currentPartidaData = res.data;
    const container = document.getElementById('results') || createResultsContainer();
    const attempts = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica.length : 0;
    container.innerHTML = `<p>Intentos disponibles: ${attempts}. Usa los botones debajo de cada gráfico para mostrarlos o pulsa "Mostrar tabla de puntajes de la partida".</p>`;
}

export function initSpecificSection() {
    const selectPartidaForStatsBtn = document.getElementById('selectPartidaForStatsBtn');
    if (selectPartidaForStatsBtn) selectPartidaForStatsBtn.addEventListener('click', selectPartidaForStats);

    const showEstadisticaChartBtn = document.getElementById('showEstadisticaChartBtn');
    if (showEstadisticaChartBtn) showEstadisticaChartBtn.addEventListener('click', () => {
        const latest = Array.isArray(currentPartidaData?.Estadistica) ? currentPartidaData.Estadistica.slice(-1)[0] : null;
        if (!latest) {
            alert('No hay datos');
            return;
        }
        renderEstadisticaChart(latest);
    });

    const showMejorasChartBtn = document.getElementById('showMejorasChartBtn');
    if (showMejorasChartBtn) showMejorasChartBtn.addEventListener('click', renderMejorasDonutChartForCurrent);

    const showTiempoChartBtn = document.getElementById('showTiempoChartBtn');
    if (showTiempoChartBtn) showTiempoChartBtn.addEventListener('click', renderTiempoLineChartForCurrent);

    const showPuntajesRadarBtn = document.getElementById('showPuntajesRadarBtn');
    if (showPuntajesRadarBtn) showPuntajesRadarBtn.addEventListener('click', renderPuntajesRadarChartForCurrent);

    const showPartidaTableBtn = document.getElementById('showPartidaTableBtn');
    if (showPartidaTableBtn) showPartidaTableBtn.addEventListener('click', renderPartidaTable);
}
