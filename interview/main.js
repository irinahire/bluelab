// /interview/main.js

let recognition;
let isRecording = false;

// 1. Inicialización segura del reconocimiento de voz
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
            console.log("Usuario dijo:", textoEscuchado);
            hablarConIrina(textoEscuchado);
        };

        recognition.onerror = (event) => {
            console.error("Error de audio:", event.error);
            document.getElementById('status').innerText = "SISTEMA LISTO";
            isRecording = false;
        };

        recognition.onend = () => {
            isRecording = false;
            document.getElementById('btn-mic').innerText = "HABLAR CON IRINA";
        };
    }
}

// 2. Función del botón (Solo actúa al hacer CLIC)
async function toggleRecording() {
    if (!recognition) initRecognition();

    if (!recognition) {
        alert("Navegador no compatible con voz.");
        return;
    }

    try {
        if (!isRecording) {
            // Pedimos permiso de audio solo al hacer clic
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognition.start();
            isRecording = true;
        } else {
            recognition.stop();
            isRecording = false;
        }
    } catch (err) {
        alert("Debes permitir el micrófono para usar a Irina.");
    }
}

// 3. Comunicación con el backend (API)
async function hablarConIrina(textoUsuario) {
    const status = document.getElementById('status');
    const display = document.getElementById('irina-text');
    
    status.innerText = "IRINA PENSANDO..."; // Solo aparece aquí ahora
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textoUsuario })
        });

        const data = await response.json();
        
        display.innerText = data.texto;
        
        if (data.audio) {
            const audio = new Audio(data.audio);
            status.innerText = "IRINA HABLANDO";
            audio.play();
            audio.onended = () => {
                status.innerText = "SISTEMA LISTO";
            };
        }

    } catch (error) {
        display.innerText = "Error de conexión con el servidor.";
        status.innerText = "SISTEMA LISTO";
    }
}

// 4. Estado inicial al cargar
window.onload = () => {
    document.getElementById('status').innerText = "SISTEMA LISTO";
    document.getElementById('irina-text').innerText = "Haz clic en el botón para comenzar la entrevista.";
    initRecognition();
};
