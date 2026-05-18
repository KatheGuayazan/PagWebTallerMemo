# PagWebTallerMemo - Dashboard de Estadísticas

Hosting: https://tallermemin-5796b.web.app/

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
- Radar general (`generalPuntajesRadarChart`): comparación por documento usando ejes de puntajes específicos acumulados (recolectados, tóxicos, perdidos y total), sin separar por intento.

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
- Radar por partida (`puntajesRadarChart`) con ejes de puntajes específicos acumulados (recolectados, tóxicos, perdidos y total).

Importancia de la gráfica de tiempo de instrucciones:
- Mide una métrica de comportamiento no trivial (lectura/comprensión previa).
- Permite correlacionar preparación con desempeño posterior.
- Ayuda a detectar si las instrucciones son confusas (tiempos anómalos).

### 4) Actualización con datos reales (sin mocks)
Se cumple porque el frontend consulta Firestore real en cada actualización:
- `apiCall('/partidas')` y `apiCall('/partida/:id')` en `public/js/main.js`.
- `FirestoreService` accede directamente a la colección `Sections`.

No hay datos estáticos pre-cargados en el dashboard: los gráficos y tablas se regeneran desde la data actual de la base.

## Detalle de gráficas y valor analítico

Esta sección explica qué hace cada visualización y qué información importante aporta al análisis del juego.

| Gráfica | Qué muestra | Información importante que aporta |
|---|---|---|
| `estadisticaChart` | Desglose de una partida en un intento específico: recolectados, tóxicos, perdidos y total. | Permite ver con precisión cómo se compuso el puntaje en un intento puntual y detectar si el resultado fue bueno por recolección, por esquive o afectado por pérdidas. |
| `mejorasChart` | Distribución de puntajes de los intentos de una misma partida. | Ayuda a observar si el jugador fue mejorando, si tuvo un pico aislado o si su rendimiento fue estable durante la sesión. |
| `tiempoChart` | Evolución del tiempo de juego por intento dentro de una partida. | Sirve para comparar rapidez entre intentos y detectar si el jugador acelera, se detiene o mantiene un ritmo constante. |
| `puntajesRadarChart` | Comparación de puntajes específicos acumulados de la partida: recolectados, tóxicos, perdidos y total. | Resume el perfil de la partida en un solo radar y permite identificar si el desempeño estuvo impulsado por recolección, esquive, pérdidas o por el total final. |
| `generalEstadisticaChart` | Mejor puntaje de cada documento/partida. | Es la comparación principal entre jugadores o sesiones; muestra quién alcanzó el mejor resultado global. |
| `generalMejorasChart` | Distribución general de los mejores puntajes entre todas las partidas. | Permite comparar de forma rápida qué tan repartido está el rendimiento global y si hay pocas partidas dominantes. |
| `generalTiempoChart` | Tiempo de juego por intento, con una línea por partida. | Sirve para comparar el comportamiento temporal de varias partidas al mismo tiempo y detectar partidas más lentas o más rápidas. |
| `generalInstruccionesChart` | Tiempo dedicado a leer instrucciones por documento. | Es una métrica de comportamiento no trivial: ayuda a entender si el jugador leyó, repasó o tuvo dificultad para comprender las instrucciones antes de jugar. |
| `generalPuntajesRadarChart` | Comparación general por documento en ejes específicos: recolectados, tóxicos, perdidos y total acumulado. | Permite ver cómo se distribuye el perfil de puntajes del juego por documento y detectar si una partida destaca por recolección, esquive, pérdidas o rendimiento total. |
| `topRankingContainer` | Tabla de ranking global con totales acumulados por documento y nombre del jugador. | Es la vista de highscore: identifica el mejor rendimiento general y ordena a los jugadores por su desempeño acumulado. |

### Interpretación rápida de la lectura del dashboard

- Si una partida tiene una barra alta en `generalEstadisticaChart`, esa sesión logró un mejor rendimiento acumulado.
- Si `generalInstruccionesChart` muestra tiempos altos, puede significar que el jugador necesitó más tiempo para comprender el juego o que releyó las reglas.
- Si `generalTiempoChart` muestra una línea ascendente, el jugador tardó más en intentos posteriores; si desciende, ganó velocidad.
- Si `mejorasChart` y `generalMejorasChart` muestran mucha variación, hay sesiones con picos de rendimiento y otras más inestables.
- Si el ranking general concentra pocos documentos arriba, el sistema muestra claramente los mejores jugadores y sus totales.

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
- Las listas de puntajes negativos se muestran en barras generales.
- El ranking resalta podio (oro, plata, bronce).
