// /interview/main.js

let recognition;
let isRecording = false;

// 1. Configuración del Reconocimiento de Voz (Browser Nativo)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-AR'; // Español de Argentina
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        document.getElementById('status').innerText = "IRINA TE ESCUCHA...";
        document.getElementById('btn-mic').innerText = "DETENER";
    };

    recognition.onresult = (event) => {
        const textoEscuchado = event.results[0][0].transcript;
        console.log("Escuchado:", textoEscuchado);
        hablarConIrina(textoEscuchado);
    };

    recognition.onerror = (event) => {
        console.error("Error de reconocimiento:", event.error);
        document.getElementById('status').innerText = "ERROR DE AUDIO";
        isRecording = false;
    };

    recognition.onend = () => {
        isRecording = false;
        document.getElementById('btn-mic').innerText = "HABLAR CON IRINA";
    };
}

// 2. Función que activa/desactiva el micrófono
async function toggleRecording() {
    if (!recognition) {
        alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
        return;
    }

    try {
        if (!isRecording) {
            // Esto fuerza al navegador a pedir el permiso la primera vez
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognition.start();
            isRecording = true;
        } else {
            recognition.stop();
            isRecording = false;
        }
    } catch (err) {
        console.error("Permiso denegado:", err);
        alert("Debes permitir el acceso al micrófono para hablar con Irina.");
    }
}

// 3. Comunicación con el Cerebro (Vercel API)
async function hablarConIrina(textoUsuario) {
    const status = document.getElementById('status');
    const display = document.getElementById('irina-text');
    
    status.innerText = "IRINA PENSANDO...";
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textoUsuario })
        });

        const data = await response.json();
        
        // Mostramos el texto en pantalla
        display.innerText = data.texto;
        
        // Reproducimos la voz de Antonia
        if (data.audio) {
            const audio = new Audio(data.audio);
            audio.play();
            status.innerText = "IRINA HABLANDO";
            audio.onended = () => {
                status.innerText = "SISTEMA LISTO";
            };
        }

    } catch (error) {
        console.error("Error en la API:", error);
        display.innerText = "No pude conectarme con mi cerebro. Reintenta.";
        status.innerText = "ERROR";
    }
}

// 4. Saludo inicial al cargar la página
window.onload = () => {
    console.log("Irina lista en bluelab.online");
};
