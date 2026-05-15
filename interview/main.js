// /interview/main.js
let recognition;
let isRecording = false;

function initRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            document.getElementById('status').innerText = "IRINA TE ESCUCHA...";
            document.getElementById('btn-mic').innerText = "DETENER";
        };

        recognition.onresult = (event) => {
            const textoEscuchado = event.results[0][0].transcript;
            hablarConIrina(textoEscuchado);
        };

        recognition.onerror = () => {
            document.getElementById('status').innerText = "SISTEMA LISTO";
            isRecording = false;
        };

        recognition.onend = () => {
            isRecording = false;
            document.getElementById('btn-mic').innerText = "HABLAR CON IRINA";
        };
    }
}

async function toggleRecording() {
    if (!recognition) initRecognition();
    try {
        if (!isRecording) {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognition.start();
            isRecording = true;
        } else {
            recognition.stop();
            isRecording = false;
        }
    } catch (err) {
        alert("Permiso de micrófono denegado.");
    }
}

async function hablarConIrina(textoUsuario) {
    const status = document.getElementById('status');
    const display = document.getElementById('irina-text');
    status.innerText = "IRINA PENSANDO...";

    try {
        // Usamos la ruta absoluta para evitar errores de carpeta
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textoUsuario })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        display.innerText = data.texto;
        if (data.audio) {
            const audio = new Audio(data.audio);
            status.innerText = "IRINA HABLANDO";
            audio.play();
            audio.onended = () => status.innerText = "SISTEMA LISTO";
        }
    } catch (error) {
        console.error("Error:", error);
        display.innerText = "Error de conexión: " + error.message;
        status.innerText = "SISTEMA LISTO";
    }
}

window.onload = () => {
    document.getElementById('status').innerText = "SISTEMA LISTO";
    initRecognition();
};
