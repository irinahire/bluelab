const startBtn = document.getElementById('start-btn');
const statusDisplay = document.getElementById('status-display');
const DEEPGRAM_KEY = '90d3ca39a1dd6c4ff959df9d21ea654254b9e0d6'; 

let socket;
let isProcessing = false;
let isCallActive = false;
let streamGlobal;
let mediaRecorder;
let currentAudio = null;

async function hablarIrina(texto) {
    isProcessing = true;
    statusDisplay.innerText = "IRINA PENSANDO...";
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: texto })
        });
        const data = await response.json();
        if (data.audio) {
            statusDisplay.innerHTML = `<div style="color:#bc8abf; font-weight:800;">Irina: "${data.texto}"</div>`;
            if (currentAudio) { currentAudio.pause(); currentAudio = null; }
            currentAudio = new Audio(data.audio);
            currentAudio.onended = () => {
                isProcessing = false;
                if(isCallActive) statusDisplay.innerText = "TE ESCUCHO...";
            };
            await currentAudio.play();
        }
    } catch (e) { 
        isProcessing = false; 
        statusDisplay.innerText = "ERROR - REINTENTANDO";
    }
}

async function iniciarLlamada() {
    isCallActive = true;
    startBtn.innerText = "CORTAR LLAMADA";
    startBtn.style.backgroundColor = "#ef4444";
    statusDisplay.innerText = "CONECTANDO...";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamGlobal = stream;
        socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&language=es-419&smart_format=true', ['token', DEEPGRAM_KEY]);
        socket.onopen = () => {
            statusDisplay.innerText = "SISTEMA ACTIVO";
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0 && socket.readyState === 1 && !isProcessing) socket.send(e.data);
            };
            mediaRecorder.start(250);
            setTimeout(() => hablarIrina("INICIO_AUTOMATICO"), 500);
        };
        socket.onmessage = async (msg) => {
            const res = JSON.parse(msg.data);
            const transcript = res.channel.alternatives[0].transcript;
            if (transcript && res.is_final && !isProcessing) {
                statusDisplay.innerHTML = `<div style="color:#4b5563">Vos: "${transcript}"</div>`;
                await hablarIrina(transcript);
            }
        };
    } catch (err) {
        alert("Error al acceder al micrófono.");
        cortarLlamada();
    }
}

function cortarLlamada() {
    isCallActive = false;
    isProcessing = false;
    if (socket) socket.close();
    if (streamGlobal) streamGlobal.getTracks().forEach(t => t.stop());
    if (currentAudio) currentAudio.pause();
    startBtn.innerText = "INICIAR ENTREVISTA";
    startBtn.style.backgroundColor = "#bc8abf";
    statusDisplay.innerText = "LLAMADA FINALIZADA";
}
startBtn.addEventListener('click', () => isCallActive ? cortarLlamada() : iniciarLlamada());
