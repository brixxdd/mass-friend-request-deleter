async function cancelarSolicitudesRapido() {
    let cancelCount = 0;
    
    // Función para procesar las solicitudes visibles
    async function procesarSolicitudesVisibles() {
        const buttons = document.querySelectorAll('span');
        const solicitudes = Array.from(buttons).filter(button => 
            button.textContent.includes('Cancelar solicitud')
        );

        // Procesar en grupos de 5 solicitudes
        for(let i = 0; i < solicitudes.length; i += 5) {
            const grupo = solicitudes.slice(i, i + 5);
            
            // Cancelar grupo de solicitudes simultáneamente
            grupo.forEach(button => {
                button.click();
                cancelCount++;
                console.log(`Solicitud ${cancelCount} cancelada`);
            });

            // Pequeña pausa entre grupos
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Bucle principal con menos espera
    const maxIntentos = 5;
    for(let i = 0; i < maxIntentos; i++) {
        await procesarSolicitudesVisibles();
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 750));
    }

    console.log(`Proceso completado. Se cancelaron ${cancelCount} solicitudes.`);
}

// Ejecutar el script
cancelarSolicitudesRapido();
