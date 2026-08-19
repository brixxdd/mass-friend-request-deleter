// --- UI HELPER ---
function crearPanelControl() {
    const existing = document.getElementById('fb-mass-delete-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'fb-mass-delete-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1c1e21;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 99999;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        border: 1px solid #3e4042;
        min-width: 240px;
        text-align: center;
    `;

    panel.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #e4e6eb;">🤖 Eliminador Masivo</h3>

        <div style="background: #242526; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">SOLICITUDES CANCELADAS</div>
            <div id="fb-delete-count" style="font-size: 24px; font-weight: bold; color: #31a24c; transition: transform 0.15s ease;">0</div>
        </div>

        <div style="font-size: 13px; color: #e4e6eb; margin-bottom: 15px; line-height: 1.4;">
            ℹ️ <span style="color: #f7b928; font-weight: bold;">Sigue haciendo scroll manual</span> para cargar más. El bot eliminará las que vayan apareciendo y contará cada una solo una vez.
        </div>

        <div id="fb-status-text" style="font-size: 12px; color: #aaa; margin-bottom: 10px;">Esperando solicitudes...</div>

        <button id="fb-stop-btn" style="
            background: #e41e3f;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
        ">DETENER</button>
    `;

    document.body.appendChild(panel);

    return {
        updateCount: (n) => {
            const el = document.getElementById('fb-delete-count');
            if (el) {
                el.textContent = n;
                el.style.transform = "scale(1.2)";
                setTimeout(() => el.style.transform = "scale(1)", 100);
            }
        },
        updateStatus: (s) => {
            const el = document.getElementById('fb-status-text');
            if (el) el.textContent = s;
        },
        onStop: (cb) => {
            const btn = document.getElementById('fb-stop-btn');
            if (btn) btn.onclick = cb;
        },
        remove: () => panel.remove()
    };
}

// --- MAIN LOGIC ---
async function runMassDeleter() {
    let active = true;
    let cancelCount = 0;

    const MAX_ATTEMPTS = 3; // reintentos antes de dar por fallida una solicitud

    // UI
    const ui = crearPanelControl();
    ui.onStop(() => {
        active = false;
        ui.updateStatus('Deteniendo...');
        console.log('Usuario solicitó detener.');
    });

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    // Cerrar popups
    async function closePopups() {
        const buttons = document.querySelectorAll('[role="dialog"] [role="button"], [role="dialog"] span');
        for (const btn of buttons) {
            if (['Aceptar', 'Ok', 'Cerrar', 'Confirmar'].includes(btn.textContent.trim())) {
                if (btn.offsetWidth > 0 && btn.offsetHeight > 0 && btn.id !== 'fb-stop-btn') {
                    try { btn.click(); await wait(100); } catch (e) { }
                }
            }
        }
    }

    // Encuentra los spans "hoja" con el texto buscado, descartando wrappers
    // que envuelven a otro span que también matchea (FB anida <span><span>texto</span></span>,
    // así que sin este filtro se clickea y cuenta el mismo botón dos veces).
    function buscarBotonesCancelar() {
        const candidatos = Array.from(document.querySelectorAll('span')).filter(b =>
            b.textContent.trim() === 'Cancelar solicitud' &&
            b.offsetParent !== null &&
            !b.hasAttribute('data-processed') &&
            !b.hasAttribute('data-processing')
        );
        return candidatos.filter(c =>
            !candidatos.some(other => other !== c && c.contains(other))
        );
    }

    // Bucle Principal
    while (active) {
        // Cerrar errores primero
        await closePopups();

        const buttons = buscarBotonesCancelar();

        if (buttons.length > 0) {
            ui.updateStatus(`Procesando ${buttons.length} visibles...`);

            for (const btn of buttons) {
                if (!active) break;
                if (!document.body.contains(btn)) continue;

                const attempts = parseInt(btn.getAttribute('data-attempts') || '0', 10);

                // Marcar como "en proceso" (no "procesado") hasta confirmar que de verdad se canceló
                btn.setAttribute('data-processing', 'true');
                btn.style.opacity = '0.5';

                try {
                    btn.click();
                    await wait(300 + Math.random() * 300);
                    await closePopups();

                    // Verificamos que el botón realmente desapareció/dejó de estar visible
                    // antes de contarlo. Así evitamos contar clicks que no surtieron efecto
                    // (p.ej. si Facebook mostró un diálogo de confirmación no manejado).
                    const seCancelo = !document.body.contains(btn) || btn.offsetParent === null;

                    if (seCancelo) {
                        btn.removeAttribute('data-processing');
                        btn.setAttribute('data-processed', 'true');
                        cancelCount++;
                        ui.updateCount(cancelCount);
                    } else if (attempts + 1 >= MAX_ATTEMPTS) {
                        // Se agotaron los reintentos: lo damos por fallido y no lo tocamos más
                        btn.removeAttribute('data-processing');
                        btn.setAttribute('data-processed', 'true');
                        btn.style.opacity = '1';
                        console.warn('No se pudo cancelar esta solicitud tras varios intentos:', btn);
                    } else {
                        // Liberamos el botón para reintentar en la próxima vuelta del loop
                        btn.removeAttribute('data-processing');
                        btn.setAttribute('data-attempts', String(attempts + 1));
                        btn.style.opacity = '1';
                    }
                } catch (e) {
                    console.error(e);
                    btn.removeAttribute('data-processing');
                    btn.style.opacity = '1';
                }

                // Pausa aleatoria entre solicitudes
                await wait(250 + Math.random() * 250);
            }
            // Después del lote, cerramos posibles errores
            await closePopups();
        } else {
            ui.updateStatus('💤 Haz scroll para cargar más...');
            await wait(1000);
        }
    }

    ui.updateStatus('Detenido.');
    ui.remove();
    alert(`Finalizado. Solicitudes canceladas: ${cancelCount}`);
}

runMassDeleter();
