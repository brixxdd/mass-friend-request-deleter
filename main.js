// Inicializar el contador de solicitudes canceladas
let cancelCount = 0;

// Obtener todos los botones en la página
var buttons = document.querySelectorAll('span'); 

// Iterar sobre cada botón
buttons.forEach(function(button) {
    if (button.textContent.includes('Cancelar solicitud')) {
        button.click(); // Hacer clic en el botón para cancelar la solicitud
        cancelCount++; // Incrementar el contador
    }
});

// Mostrar en consola cuántas solicitudes se han cancelado
console.log(`Se han cancelado un total de ${cancelCount} solicitudes.`);

