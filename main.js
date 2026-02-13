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
            <div id="fb-delete-count" style="font-size: 24px; font-weight: bold; color: #31a24c;">0</div>
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

    // Bucle Principal
    while (active) {
        // Cerrar errores primero
        await closePopups();

        // Buscar botones visibles y NO PROCESADOS
        // Añadimos filtro !b.hasAttribute('data-processed')
        const buttons = Array.from(document.querySelectorAll('span')).filter(b =>
            b.textContent.trim() === 'Cancelar solicitud' &&
            b.offsetParent !== null &&
            !b.hasAttribute('data-processed')
        );

        if (buttons.length > 0) {
            ui.updateStatus(`Procesando ${buttons.length} visibles...`);

            for (const btn of buttons) {
                if (!active) break;

                // Doble chequeo por si acaso desapareció
                if (document.body.contains(btn)) {
                    try {
                        // Marcar como procesado ANTES de clickear para evitar doble conteo en siguiente iteración rápida
                        btn.setAttribute('data-processed', 'true');
                        btn.style.opacity = '0.5'; // Feedback visual

                        btn.click();
                        cancelCount++; // Solo incrementamos aquí una vez
                        ui.updateCount(cancelCount);

                        // Pausa aleatoria
                        await wait(250 + Math.random() * 250);
                    } catch (e) {
                        console.error(e);
                        // Si falla, quizás deberíamos des-marcarlo? Mejor no, para evitar bucles infinitos en errores
                    }
                }
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
