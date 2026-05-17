const express = require("express");
const db = require("./Modules/firebase.service.js");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// ============================================
// RUTAS API - Estructura Sections/IDPartida
// ============================================

// Obtener documento principal (IDPartida)
app.get("/api/partida/:partidaId", async (req, res) => {
    try {
        const { partidaId } = req.params;
        
        const doc = await db.collection("Sections").doc(partidaId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "Partida no encontrada" });
        }
        
        res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        console.error("Error en getPartida:", error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener subcollection Comportamiento
app.get("/api/partida/:partidaId/comportamiento", async (req, res) => {
    try {
        const { partidaId } = req.params;
        
        const snapshot = await db.collection("Sections")
            .doc(partidaId)
            .collection("Comportamiento")
            .get();
        
        if (snapshot.empty) {
            return res.json({ success: true, data: [] });
        }
        
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error en getComportamiento:", error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener subcollection Estadistica
app.get("/api/partida/:partidaId/estadistica", async (req, res) => {
    try {
        const { partidaId } = req.params;
        
        const snapshot = await db.collection("Sections")
            .doc(partidaId)
            .collection("Estadistica")
            .get();
        
        if (snapshot.empty) {
            return res.json({ success: true, data: [] });
        }
        
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error en getEstadistica:", error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener documento específico de Comportamiento
app.get("/api/partida/:partidaId/comportamiento/:docId", async (req, res) => {
    try {
        const { partidaId, docId } = req.params;
        
        const doc = await db.collection("Sections")
            .doc(partidaId)
            .collection("Comportamiento")
            .doc(docId)
            .get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        
        res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        console.error("Error en getComportamientoDoc:", error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener documento específico de Estadistica
app.get("/api/partida/:partidaId/estadistica/:docId", async (req, res) => {
    try {
        const { partidaId, docId } = req.params;
        
        const doc = await db.collection("Sections")
            .doc(partidaId)
            .collection("Estadistica")
            .doc(docId)
            .get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        
        res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        console.error("Error en getEstadisticaDoc:", error);
        res.status(500).json({ error: error.message });
    }
});

// Crear/Actualizar documento principal (IDPartida)
app.post("/api/partida", async (req, res) => {
    try {
        const { partidaId, data } = req.body;
        
        if (!partidaId || !data) {
            return res.status(400).json({ error: "partidaId y data son requeridos" });
        }

        await db.collection("Sections").doc(partidaId).set(data, { merge: true });
        res.json({ success: true, message: "Partida guardada" });
    } catch (error) {
        console.error("Error en createPartida:", error);
        res.status(500).json({ error: error.message });
    }
});

// Crear/Actualizar documento en Comportamiento
app.post("/api/partida/:partidaId/comportamiento", async (req, res) => {
    try {
        const { partidaId } = req.params;
        const { docId, data } = req.body;
        
        if (!docId || !data) {
            return res.status(400).json({ error: "docId y data son requeridos" });
        }

        await db.collection("Sections")
            .doc(partidaId)
            .collection("Comportamiento")
            .doc(docId)
            .set(data, { merge: true });
        
        res.json({ success: true, message: "Comportamiento guardado" });
    } catch (error) {
        console.error("Error en createComportamiento:", error);
        res.status(500).json({ error: error.message });
    }
});

// Crear/Actualizar documento en Estadistica
app.post("/api/partida/:partidaId/estadistica", async (req, res) => {
    try {
        const { partidaId } = req.params;
        const { docId, data } = req.body;
        
        if (!docId || !data) {
            return res.status(400).json({ error: "docId y data son requeridos" });
        }

        await db.collection("Sections")
            .doc(partidaId)
            .collection("Estadistica")
            .doc(docId)
            .set(data, { merge: true });
        
        res.json({ success: true, message: "Estadistica guardada" });
    } catch (error) {
        console.error("Error en createEstadistica:", error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar campo específico en Comportamiento
app.patch("/api/partida/:partidaId/comportamiento/:docId", async (req, res) => {
    try {
        const { partidaId, docId } = req.params;
        const updateData = req.body;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No hay datos para actualizar" });
        }

        await db.collection("Sections")
            .doc(partidaId)
            .collection("Comportamiento")
            .doc(docId)
            .update(updateData);
        
        res.json({ success: true, message: "Comportamiento actualizado" });
    } catch (error) {
        console.error("Error en updateComportamiento:", error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar campo específico en Estadistica
app.patch("/api/partida/:partidaId/estadistica/:docId", async (req, res) => {
    try {
        const { partidaId, docId } = req.params;
        const updateData = req.body;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No hay datos para actualizar" });
        }

        await db.collection("Sections")
            .doc(partidaId)
            .collection("Estadistica")
            .doc(docId)
            .update(updateData);
        
        res.json({ success: true, message: "Estadistica actualizada" });
    } catch (error) {
        console.error("Error en updateEstadistica:", error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar documento en Comportamiento
app.delete("/api/partida/:partidaId/comportamiento/:docId", async (req, res) => {
    try {
        const { partidaId, docId } = req.params;
        
        await db.collection("Sections")
            .doc(partidaId)
            .collection("Comportamiento")
            .doc(docId)
            .delete();
        
        res.json({ success: true, message: "Comportamiento eliminado" });
    } catch (error) {
        console.error("Error en deleteComportamiento:", error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar documento en Estadistica
app.delete("/api/partida/:partidaId/estadistica/:docId", async (req, res) => {
    try {
        const { partidaId, docId } = req.params;
        
        await db.collection("Sections")
            .doc(partidaId)
            .collection("Estadistica")
            .doc(docId)
            .delete();
        
        res.json({ success: true, message: "Estadistica eliminada" });
    } catch (error) {
        console.error("Error en deleteEstadistica:", error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las partidas
app.get("/api/partidas", async (req, res) => {
    try {
        const snapshot = await db.collection("Sections").get();
        
        if (snapshot.empty) {
            return res.json({ success: true, data: [] });
        }
        
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error en getPartidas:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(3000, () => {
    console.log('✅ Servidor corriendo en http://localhost:3000');
    console.log('📚 API disponible en /api/*');
});

// Búsqueda por filtro
app.post("/api/where-query", async (req, res) => {
    try {
        const { column, comparison, value, collectionPath } = req.body;
        
        if (!column || !comparison || !collectionPath) {
            return res.status(400).json({ error: "column, comparison y collectionPath son requeridos" });
        }

        const query = new FirestoreQuery(collectionPath);
        const results = await query.whereQuery(column, comparison, value);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en whereQuery:", error);
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda ordenada
app.post("/api/ordered-query", async (req, res) => {
    try {
        const { column, direction = 'asc', collectionPath } = req.body;
        
        if (!column || !collectionPath) {
            return res.status(400).json({ error: "column y collectionPath son requeridos" });
        }

        const query = new FirestoreQuery(collectionPath);
        const results = await query.orderedQuery(column, direction);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en orderedQuery:", error);
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda limitada
app.post("/api/limited-query", async (req, res) => {
    try {
        const { maxResults = 5, collectionPath } = req.body;
        
        if (!collectionPath) {
            return res.status(400).json({ error: "collectionPath es requerido" });
        }

        const query = new FirestoreQuery(collectionPath);
        const results = await query.limitedQuery(maxResults);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en limitedQuery:", error);
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda combinada (múltiples filtros)
app.post("/api/combined-query", async (req, res) => {
    try {
        const { filters = [], order = null, maxResults = null, collectionPath } = req.body;
        
        if (!collectionPath) {
            return res.status(400).json({ error: "collectionPath es requerido" });
        }

        const query = new FirestoreQuery(collectionPath);
        const results = await query.combinedQuery(filters, order, maxResults);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en combinedQuery:", error);
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda por prefijo
app.post("/api/prefix-search", async (req, res) => {
    try {
        const { column, prefix, collectionPath } = req.body;
        
        if (!column || !prefix || !collectionPath) {
            return res.status(400).json({ error: "column, prefix y collectionPath son requeridos" });
        }

        const query = new FirestoreQuery(collectionPath);
        const results = await query.prefixSearch(column, prefix);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error en prefixSearch:", error);
        res.status(500).json({ error: error.message });
    }
});

// Crear/Guardar documento
app.post("/api/create-document", async (req, res) => {
    try {
        const { collectionPath, documentId, data } = req.body;
        
        if (!collectionPath || !documentId || !data) {
            return res.status(400).json({ error: "collectionPath, documentId y data son requeridos" });
        }

        await db.collection(collectionPath).doc(documentId).set(data);
        res.json({ success: true, message: "Documento creado exitosamente" });
    } catch (error) {
        console.error("Error en createDocument:", error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener documento
app.get("/api/get-document/:collectionPath/:documentId", async (req, res) => {
    try {
        const { collectionPath, documentId } = req.params;
        
        const doc = await db.collection(collectionPath).doc(documentId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        
        res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        console.error("Error en getDocument:", error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar documento
app.put("/api/update-document/:collectionPath/:documentId", async (req, res) => {
    try {
        const { collectionPath, documentId } = req.params;
        const data = req.body;
        
        await db.collection(collectionPath).doc(documentId).update(data);
        res.json({ success: true, message: "Documento actualizado exitosamente" });
    } catch (error) {
        console.error("Error en updateDocument:", error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar documento
app.delete("/api/delete-document/:collectionPath/:documentId", async (req, res) => {
    try {
        const { collectionPath, documentId } = req.params;
        
        await db.collection(collectionPath).doc(documentId).delete();
        res.json({ success: true, message: "Documento eliminado exitosamente" });
    } catch (error) {
        console.error("Error en deleteDocument:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(3000, () => {
    console.log('✅ Servidor corriendo en http://localhost:3000');
    console.log('📚 API disponible en /api/*');
});