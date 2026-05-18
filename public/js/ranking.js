import {
    escapeHtml,
    getPartidaLabel,
    getPartidaPlayerName,
    getScoreBreakdown,
} from './common.js';

export function renderRankingSection(partidas) {
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
    const partidasConDatos = new Set(rows.map((row) => row.partidaLabel)).size;

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
