// /api/chat.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
    // Configuración de cabeceras para evitar errores de conexión (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Responder rápido a la verificación del navegador
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No se recibió texto del usuario" });
        }

        // 1. Consultar a Gemini
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Eres Irina, una reclutadora de Blue Lab. Responde de forma muy breve y profesional: ${text}` }] }]
            })
        });
        
        const geminiData = await geminiRes.json();
        const aiText = geminiData.candidates[0].content.parts[0].text;

        // 2. Convertir texto a voz con Deepgram
        const ttsRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-antonia-es", {
            method: "POST",
            headers: { 
                "Authorization": `Token ${DEEPGRAM_API_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ text: aiText })
        });

        if (!ttsRes.ok) throw new Error("Fallo en el motor de voz");

        const audioBuffer = await ttsRes.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        // 3. Enviar respuesta final
        return res.status(200).json({
            texto: aiText,
            audio: `data:audio/mp3;base64,${base64Audio}`
        });

    } catch (e) {
        console.error("Error en Irina:", e.message);
        return res.status(500).json({ error: "Hubo un error en el servidor: " + e.message });
    }
};
