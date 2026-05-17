// ============================================
// Sistema de Partidas Firestore (Cliente)
// Estructura: Sections/IDPartida/Comportamiento + Estadistica
// ============================================

let currentPartidaId = '';
const API_BASE = 'http://localhost:3000/api';

// ============================================
// Funciones Auxiliares
// ============================================

async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            console.error(`Error: ${result.error}`);
            alert(`Error: ${result.error}`);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('Error en petición API:', error);
        alert(`Error en petición: ${error.message}`);
        return null;
    }
}

function displayResults(data, title = "Resultados") {
    const resultContainer = document.getElementById("results") || createResultsContainer();
    
    if (!data) {
        resultContainer.innerHTML = `<p style="color:red;">${title}: No hay datos</p>`;
        return;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            resultContainer.innerHTML = `<p>${title}: Lista vacía</p>`;
            return;
        }

        let html = `<h3>${title}</h3><table border='1'><tr>`;
        
        const headers = new Set();
        data.forEach(item => Object.keys(item).forEach(key => headers.add(key)));
        
        headers.forEach(header => html += `<th>${header}</th>`);
        html += "</tr>";

        data.forEach(item => {
            html += "<tr>";
            headers.forEach(header => {
                const value = item[header];
                const displayValue = typeof value === 'object' ? JSON.stringify(value) : (value || '-');
                html += `<td>${displayValue}</td>`;
            });
            html += "</tr>";
        });

        html += "</table>";
        resultContainer.innerHTML = html;
    } else {
        resultContainer.innerHTML = `<h3>${title}</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

function createResultsContainer() {
    const container = document.createElement("div");
    container.id = "results";
    container.style.marginTop = "20px";
    container.style.padding = "10px";
    container.style.border = "1px solid #ccc";
    document.body.appendChild(container);
    return container;
}

// ============================================
// Event Listeners - Partidas
// ============================================

if (document.getElementById("loadPartidasBtn")) {
    document.getElementById("loadPartidasBtn").addEventListener("click", async () => {
        const result = await apiCall("/partidas");
        if (result) {
            displayResults(result.data, "📋 Lista de Partidas");
        }
    });
}

if (document.getElementById("selectPartidaBtn")) {
    document.getElementById("selectPartidaBtn").addEventListener("click", async () => {
        const input = document.getElementById("partidaIdInput");
        currentPartidaId = input.value.trim();
        
        if (!currentPartidaId) {
            alert("Ingresa un ID de partida");
            return;
        }
        
        const result = await apiCall(`/partida/${currentPartidaId}`);
        if (result) {
            console.log("✅ Partida seleccionada:", currentPartidaId);
            alert(`✅ Partida seleccionada: ${currentPartidaId}`);
            displayResults(result.data, `📂 Datos de Partida: ${currentPartidaId}`);
        }
    });
}

if (document.getElementById("createPartidaBtn")) {
    document.getElementById("createPartidaBtn").addEventListener("click", async () => {
        const partidaId = document.getElementById("newPartidaId").value.trim();
        const nombre = document.getElementById("newPartidaNombre").value.trim();
        
        if (!partidaId || !nombre) {
            alert("Ingresa ID y nombre de la partida");
            return;
        }
        
        const result = await apiCall("/partida", "POST", {
            partidaId,
            data: { Nombre: nombre, FechaCreacion: new Date().toISOString() }
        });
        
        if (result) {
            alert(`✅ Partida creada: ${partidaId}`);
        }
    });
}

// ============================================
// Event Listeners - Comportamiento
// ============================================

if (document.getElementById("loadComportamientoBtn")) {
    document.getElementById("loadComportamientoBtn").addEventListener("click", async () => {
        if (!currentPartidaId) {
            alert("Selecciona una partida primero");
            return;
        }
        
        const result = await apiCall(`/partida/${currentPartidaId}/comportamiento`);
        if (result) {
            displayResults(result.data, `🎮 Comportamiento de ${currentPartidaId}`);
        }
    });
}

if (document.getElementById("updateComportamientoBtn")) {
    document.getElementById("updateComportamientoBtn").addEventListener("click", async () => {
        if (!currentPartidaId) {
            alert("Selecciona una partida primero");
            return;
        }
        
        const docId = document.getElementById("comportamientoDocId").value.trim() || "0";
        const numeroSecciones = document.getElementById("numeroSecciones").value.trim();
        const tiempoInstrucciones = document.getElementById("tiempoInstrucciones").value.trim();
        
        const data = {};
        if (numeroSecciones) data.NumeroSecciones = parseInt(numeroSecciones);
        if (tiempoInstrucciones) data.TiempoInstrucciones = parseInt(tiempoInstrucciones);
        
        if (Object.keys(data).length === 0) {
            alert("Ingresa al menos un campo");
            return;
        }
        
        const result = await apiCall(`/partida/${currentPartidaId}/comportamiento`, "POST", {
            docId,
            data
        });
        
        if (result) {
            alert(`✅ Comportamiento guardado`);
        }
    });
}

// ============================================
// Event Listeners - Estadistica
// ============================================

if (document.getElementById("loadEstadisticaBtn")) {
    document.getElementById("loadEstadisticaBtn").addEventListener("click", async () => {
        if (!currentPartidaId) {
            alert("Selecciona una partida primero");
            return;
        }
        
        const result = await apiCall(`/partida/${currentPartidaId}/estadistica`);
        if (result) {
            displayResults(result.data, `📊 Estadística de ${currentPartidaId}`);
        }
    });
}

if (document.getElementById("updateEstadisticaBtn")) {
    document.getElementById("updateEstadisticaBtn").addEventListener("click", async () => {
        if (!currentPartidaId) {
            alert("Selecciona una partida primero");
            return;
        }
        
        const docId = document.getElementById("estadisticaDocId").value.trim() || "0";
        const arduinosPerdidos = document.getElementById("arduinosPerdidos").value.trim();
        const arduinosRecolectados = document.getElementById("arduinosRecolectados").value.trim();
        const toxicosEsquivados = document.getElementById("toxicosEsquivados").value.trim();
        const nombre = document.getElementById("estadisticaNombre").value.trim();
        
        const data = {};
        if (arduinosPerdidos) data.ArduinosPerdidos = parseInt(arduinosPerdidos);
        if (arduinosRecolectados) data.ArduinosRecolectados = parseInt(arduinosRecolectados);
        if (toxicosEsquivados) data.ToxicosEsquivados = parseInt(toxicosEsquivados);
        if (nombre) data.Nombre = nombre;
        
        data.HoraFinal = new Date().toISOString();
        
        if (Object.keys(data).length === 1) {
            alert("Ingresa al menos un campo");
            return;
        }
        
        const result = await apiCall(`/partida/${currentPartidaId}/estadistica`, "POST", {
            docId,
            data
        });
        
        if (result) {
            alert(`✅ Estadística guardada`);
        }
    });
}

// ============================================
// Inicialización
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Aplicación lista");
    createResultsContainer();
});

    document.getElementById("getHighPriority").addEventListener("click", async () => {
        const teamId = document.getElementById("getTeamId").value.trim();

        firestoreQ = new FirestoreQuery(`/${teamId}/${projectId}/${taskId}/`);

        const tasks = await firestoreQ.getCriticalTasks(teamId);
        console.log(tasks);
    });