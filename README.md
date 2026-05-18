# PagWebTallerMemo - Dashboard de Estadísticas

## Descripción
Este proyecto es un dashboard web que consume datos reales de Firebase Firestore (colección `Sections`) y presenta visualizaciones para analizar rendimiento y comportamiento de los jugadores en Memo Engineer .

La aplicación web lee los documentos mediante `FirestoreService` y transforma los campos de:
- `Nombre`
- `Comportamiento.TiempoInstruccionesSeg`
- `Estadistica[]` (`ArduinosRecolectados`, `ArduinosPerdidos`, `ToxicosEsquivados`, `HoraInicio`, `HoraFinal`)

## Cómo cumple las especificaciones

### 1) Tabla de ranking (highscores)
Se implementa en la sección `Ranking General / Top de Puntajes`.

Qué muestra:
- Posición
- Documento
- Nombre
- Recolectados acumulados
- Tóxicos acumulados
- Perdidos acumulados
- Total acumulado

Importancia:
- Permite identificar rápidamente a los mejores jugadores.
- Resume el desempeño agregado por sesión/documento.
- Facilita comparación directa entre partidas.

### 2) Gráfica de distribución de puntajes
Se cumple con:
- Donut general (`generalMejorasChart`): distribución de mejores puntajes por partida.
- Polar general (`generalPuntajesPolarChart`): distribución de magnitudes de puntaje por partida, resaltando negativas.

Importancia:
- Muestra cómo se reparte el rendimiento global, no solo quién va primero.
- Permite detectar concentración (pocos dominan) o dispersión (rendimiento variado).

### 3) Al menos 2 visualizaciones adicionales derivadas de métricas específicas
Este dashboard tiene más de dos visualizaciones adicionales:
- Barras por partida (`generalEstadisticaChart`): mejor puntaje por documento.
- Línea general (`generalTiempoChart`): tiempo de juego por intento.
- Barras de comportamiento (`generalInstruccionesChart`): comparación de `TiempoInstruccionesSeg` por documento.
- Barras por partida específica (`estadisticaChart`): desglose de recolectados, tóxicos, perdidos y total.
- Donut por partida (`mejorasChart`).
- Línea por partida (`tiempoChart`).
- Radar por partida (`puntajesRadarChart`).

Importancia de la gráfica de tiempo de instrucciones:
- Mide una métrica de comportamiento no trivial (lectura/comprensión previa).
- Permite correlacionar preparación con desempeño posterior.
- Ayuda a detectar si las instrucciones son confusas (tiempos anómalos).

### 4) Actualización con datos reales (sin mocks)
Se cumple porque el frontend consulta Firestore real en cada actualización:
- `apiCall('/partidas')` y `apiCall('/partida/:id')` en `public/js/main.js`.
- `FirestoreService` accede directamente a la colección `Sections`.

No hay datos estáticos pre-cargados en el dashboard: los gráficos y tablas se regeneran desde la data actual de la base.

## Flujo de datos Unity -> Firestore -> Dashboard

El juego en Unity escribe datos en Firestore, y este dashboard los lee para visualizarlos.

Repositorio Unity (escritura):
- https://github.com/KatheGuayazan/TallerMemin2

Puntos clave donde se actualizan/escriben datos:
- Creación de sesión y estructura base del documento:
  - `Assets/MemoEngineer/Scripts/BaseDeDatos/Firestore.cs`
  - Método `CreateSection(...)` con `SetAsync(...)`.
- Actualización de tiempo de instrucciones:
  - `Assets/MemoEngineer/Scripts/BaseDeDatos/Firestore.cs`
  - Método `UpdateTiempoInstrucciones(...)` con `UpdateAsync("Comportamiento.TiempoInstruccionesSeg", tiempo)`.
- Guardado de estadísticas finales de juego:
  - `Assets/MemoEngineer/Scripts/BaseDeDatos/Firestore.cs`
  - Método `AppendStatisticsEntry(...)` con `SetAsync(..., SetOptions.MergeAll)` y `FieldValue.ArrayUnion(...)`.
- Disparo de eventos de escritura desde gameplay:
  - `Assets/MemoEngineer/Scripts/BaseDeDatos/ScoreToFirestoreEvents.cs`
  - `Assets/MemoEngineer/Scripts/BaseDeDatos/FirestoreEventHandler.cs`
  - `Assets/MemoEngineer/Scripts/Systems/Sessions/InstructionsAnalytics.cs`

## Ejecución local
1. Instalar dependencias:
   - `npm install`
2. Iniciar servidor:
   - `npm start`
3. Abrir en navegador:
   - `http://localhost:3000/public/index.html`

## Notas
- El dashboard está orientado a lectura y análisis.
- Las listas de puntajes negativos se muestran en barras y polar general.
- El ranking resalta podio (oro, plata, bronce).
