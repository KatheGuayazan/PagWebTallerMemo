import { apiCall, createResultsContainer } from './common.js';
import { renderGeneralSection } from './general.js';
import { renderRankingSection } from './ranking.js';
import { initSpecificSection } from './specific.js';

async function updateGeneralAndRanking() {
    const res = await apiCall('/partidas');
    if (!res?.data) {
        alert('No se pudieron cargar las partidas para estadísticas generales');
        return;
    }

    const partidas = Array.isArray(res.data) ? res.data : [];
    renderGeneralSection(partidas);
    renderRankingSection(partidas);
}

async function updateRankingOnly() {
    const res = await apiCall('/partidas');
    if (!res?.data) {
        alert('No se pudieron cargar las partidas para el ranking');
        return;
    }

    renderRankingSection(Array.isArray(res.data) ? res.data : []);
}

function initGeneralSection() {
    const updateAllGeneralBtn = document.getElementById('updateAllGeneralBtn');
    if (updateAllGeneralBtn) updateAllGeneralBtn.addEventListener('click', updateGeneralAndRanking);

    const updateTopRankingBtn = document.getElementById('updateTopRankingBtn');
    if (updateTopRankingBtn) updateTopRankingBtn.addEventListener('click', updateRankingOnly);
}

document.addEventListener('DOMContentLoaded', () => {
    createResultsContainer();
    initSpecificSection();
    initGeneralSection();
    console.log('App lista');
});
