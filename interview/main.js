async function hablarIrina(texto) {
    isProcessing = true;
    statusDisplay.innerText = "IRINA PENSANDO...";
    
    try {
        // Usamos la ruta absoluta desde la raíz para evitar confusiones de carpetas
        const response = await fetch('/api/chat', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: texto })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el servidor');
        }

        const data = await response.json();
        // ... resto del código para reproducir audio ...
    } catch (e) {
        console.error(e);
        statusDisplay.innerText = "Error al conectar. Verifica las API Keys en Vercel.";
    }
}
