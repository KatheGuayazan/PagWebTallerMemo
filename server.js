const express = require('express');
const app = express();

app.use(express.static(__dirname)); // Sirve archivos estáticos desde la carpeta actual

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});