import { FirestoreService } from '/Modules/firebase.service.js';

const firestoreService = new FirestoreService('Sections');

export async function apiCall(endpoint, method = 'GET') {
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

export function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function createResultsContainer() {
    const existing = document.getElementById('results');
    if (existing) return existing;
    const container = document.createElement('div');
    container.id = 'results';
    document.body.appendChild(container);
    return container;
}

export function parseNumber(value, integer = false) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = integer ? parseInt(value, 10) : parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export function getScoreBreakdown(entry) {
    const recolectados = parseNumber(String(entry?.ArduinosRecolectados ?? '0'), true) || 0;
    const toxicos = parseNumber(String(entry?.ToxicosEsquivados ?? '0'), true) || 0;
    const perdidos = parseNumber(String(entry?.ArduinosPerdidos ?? '0'), true) || 0;
    const total = recolectados + toxicos - perdidos;

    return { recolectados, toxicos, perdidos, total };
}

export function getTotalScore(entry) {
    return getScoreBreakdown(entry).total;
}

export function getPlayTimesFromPartida(partida) {
    const estadistica = Array.isArray(partida?.Estadistica) ? partida.Estadistica : [];
    return estadistica.map((entry) => {
        let hi = entry?.HoraInicio;
        let hf = entry?.HoraFinal;

        if (typeof hi === 'object' && hi !== null && 'seconds' in hi) hi = hi.seconds * 1000 + (hi.nanoseconds || 0) / 1000000;
        else if (typeof hi === 'string') hi = new Date(hi).getTime();

        if (typeof hf === 'object' && hf !== null && 'seconds' in hf) hf = hf.seconds * 1000 + (hf.nanoseconds || 0) / 1000000;
        else if (typeof hf === 'string') hf = new Date(hf).getTime();

        if (Number.isNaN(hi) || Number.isNaN(hf) || hf <= hi) return null;
        return Math.round((hf - hi) / 1000);
    }).filter((value) => value !== null);
}

export function getPartidaLabel(partida, idx) {
    return partida?.id || partida?.Id || partida?.Nombre || `Partida ${idx + 1}`;
}

export function getPartidaPlayerName(partida) {
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

export function getGeneralBestScores(partidas) {
    const labels = partidas.map(getPartidaLabel);
    const dataValues = partidas.map((partida) => {
        const estad = Array.isArray(partida?.Estadistica) ? partida.Estadistica : [];
        if (!estad.length) return 0;
        return estad.reduce((max, entry) => Math.max(max, getTotalScore(entry)), -Infinity) || 0;
    });

    return { labels, dataValues };
}

export function getInstructionTimeFromPartida(partida) {
    const value = partida?.Comportamiento?.TiempoInstruccionesSeg;
    const parsed = parseNumber(String(value ?? '0'));
    return parsed === null ? 0 : parsed;
}

export function formatTimestamp(ts) {
    if (!ts) return '';
    let millis = null;

    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) millis = ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
    else if (typeof ts === 'string') millis = new Date(ts).getTime();
    else if (typeof ts === 'number') millis = ts;

    if (!millis || Number.isNaN(millis)) return '';
    return new Date(millis).toLocaleString();
}
