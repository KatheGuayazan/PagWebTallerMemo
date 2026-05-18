import {
    escapeHtml,
    getGeneralBestScores,
    getInstructionTimeFromPartida,
    getPartidaLabel,
    getPlayTimesFromPartida,
    getTotalScore,
} from './common.js';

let generalEstadisticaChart = null;
let generalMejorasChart = null;
let generalTiempoChart = null;
let generalInstruccionesChart = null;
let generalPuntajesPolarChart = null;

function renderGeneralEstadisticaChart(partidas) {
    const { labels, dataValues } = getGeneralBestScores(partidas);

    const ctx = document.getElementById('generalEstadisticaChart');
    if (!ctx) return;
    if (generalEstadisticaChart) generalEstadisticaChart.destroy();

    generalEstadisticaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Mejor puntaje por Partida',
                data: dataValues,
                backgroundColor: dataValues.map((value) => (value < 0 ? 'rgba(255,99,132,0.7)' : 'rgba(54,162,235,0.7)')),
            }],
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false, suggestedMin: Math.min(0, ...dataValues, -1) } },
        },
    });

    const negEl = document.getElementById('generalEstadisticaNegativos');
    if (negEl) {
        const negativos = labels.filter((label, index) => dataValues[index] < 0);
        negEl.innerHTML = negativos.length ? `<strong>Partidas con puntajes negativos:</strong> ${negativos.map(escapeHtml).join(', ')}` : '';
    }
}

function renderGeneralMejorasDonutChart(partidas) {
    const labels = partidas.map(getPartidaLabel);
    const dataValues = partidas.map((partida) => {
        const estad = Array.isArray(partida?.Estadistica) ? partida.Estadistica : [];
        return estad.length ? Math.max(...estad.map((entry) => getTotalScore(entry))) : 0;
    });

    const ctx = document.getElementById('generalMejorasChart');
    if (!ctx) return;
    if (generalMejorasChart) generalMejorasChart.destroy();

    generalMejorasChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: dataValues }] },
        options: { responsive: true },
    });
}

function renderGeneralTiempoLineChart(partidas) {
    const partidasValidas = partidas.filter((partida) => {
        const estad = Array.isArray(partida?.Estadistica) ? partida.Estadistica : [];
        const best = estad.length ? Math.max(...estad.map((entry) => getTotalScore(entry))) : 0;
        return best >= 0;
    });

    if (!partidasValidas.length) {
        const ctx = document.getElementById('generalTiempoChart');
        if (ctx && generalTiempoChart) {
            generalTiempoChart.destroy();
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        }
        return;
    }

    const maxAttempts = Math.max(...partidasValidas.map((partida) => (Array.isArray(partida?.Estadistica) ? partida.Estadistica.length : 0)), 0);
    const labels = Array.from({ length: maxAttempts }, (_, index) => `Intento ${index + 1}`);

    const datasets = partidasValidas.map((partida, index) => {
        const times = getPlayTimesFromPartida(partida);
        while (times.length < maxAttempts) times.push(null);
        const hue = (index * 50) % 360;

        return {
            label: getPartidaLabel(partida, index),
            data: times,
            borderColor: `hsl(${hue} 70% 50%)`,
            backgroundColor: `hsl(${hue} 70% 30%)`,
            fill: false,
            spanGaps: true,
        };
    });

    const ctx = document.getElementById('generalTiempoChart');
    if (!ctx) return;
    if (generalTiempoChart) generalTiempoChart.destroy();

    generalTiempoChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { position: 'right' } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Tiempo (s)' } } },
        },
    });
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
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Segundos' } } },
        },
    });
}

function renderGeneralPuntajesPolarChart(partidas) {
    const { labels, dataValues } = getGeneralBestScores(partidas);
    const absValues = dataValues.map((value) => Math.abs(value));

    const ctx = document.getElementById('generalPuntajesPolarChart');
    if (!ctx) return;
    if (generalPuntajesPolarChart) generalPuntajesPolarChart.destroy();

    generalPuntajesPolarChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels,
            datasets: [{
                data: absValues,
                backgroundColor: dataValues.map((value, index) => (value < 0 ? 'rgba(255,99,132,0.7)' : `hsl(${(index * 40) % 360} 70% 60%)`)),
            }],
        },
        options: { responsive: true },
    });

    const negEl = document.getElementById('generalPolarNegativos');
    if (negEl) {
        const negativos = labels.filter((label, index) => dataValues[index] < 0);
        negEl.innerHTML = negativos.length ? `<strong>Partidas con puntajes negativos:</strong> ${negativos.map(escapeHtml).join(', ')}` : '';
    }
}

export function renderGeneralSection(partidas) {
    renderGeneralEstadisticaChart(partidas);
    renderGeneralMejorasDonutChart(partidas);
    renderGeneralTiempoLineChart(partidas);
    renderGeneralInstruccionesBarChart(partidas);
    renderGeneralPuntajesPolarChart(partidas);
}
