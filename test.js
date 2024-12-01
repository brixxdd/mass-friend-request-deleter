async function cancelarSolicitudesOptimizado() {
    let cancelCount = 0;
    
    // Crear contador visual
    const crearContadorVisual = () => {
        const contador = document.createElement('div');
        contador.id = 'contador-solicitudes';
        contador.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1877f2;
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(contador);
        return contador;
    };

    const contadorVisual = crearContadorVisual();
    
    // Función para actualizar el contador visual
    const actualizarContador = () => {
        contadorVisual.innerHTML = `
            Solicitudes canceladas: ${cancelCount}<br>
            Velocidad: ${(cancelCount / ((Date.now() - tiempoInicio) / 1000)).toFixed(2)} sol/seg
        `;
    };

    // Función para procesar las solicitudes visibles
    async function procesarSolicitudesVisibles() {
        const buttons = document.querySelectorAll('span');
        const solicitudes = Array.from(buttons).filter(button => 
            button.textContent.includes('Cancelar solicitud')
        );

        // Procesar en grupos de 10 solicitudes (aumentado de 5)
        for(let i = 0; i < solicitudes.length; i += 10) {
            const grupo = solicitudes.slice(i, i + 10);
            
            // Cancelar grupo de solicitudes simultáneamente
            grupo.forEach(button => {
                button.click();
                cancelCount++;
                actualizarContador();
            });

            // Reducido el tiempo de espera entre grupos
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    const tiempoInicio = Date.now();
    
    // Bucle principal con menos espera
    const maxIntentos = 10;
    for(let i = 0; i < maxIntentos; i++) {
        await procesarSolicitudesVisibles();
        window.scrollTo(0, document.body.scrollHeight);
        // Reducido el tiempo de espera entre scrolls
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Proceso completado. Se cancelaron ${cancelCount} solicitudes.`);
    
    // Eliminar el contador visual después de 5 segundos
    setTimeout(() => {
        contadorVisual.remove();
    }, 5000);
}

// Ejecutar el script
cancelarSolicitudesOptimizado();
