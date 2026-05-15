// Ubicación: /api/chat.js
export default async function handler(req, res) {
    // Configuración de CORS obligatoria para Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Si el método no es POST, devolvemos error explícito
    if (req.method !== 'POST') {
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    const GOOGLE_API_KEY = "AIzaSyAYG9a-HvaGSK1bYMEw7sNebFcFVlr7_nA";
    const DEEPGRAM_KEY = "90d3ca39a1dd6c4ff959df9d21ea654254b9e0d6";

    try {
        const { text } = req.body;
        const promptText = text === "INICIO_AUTOMATICO" ? "Saludá a Walter brevemente." : text;

        // 1. Llamada a Gemini
        const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Sos Irina de Blue Lab. Argentina. Máximo 12 palabras. Respondé a: ${promptText}` }] }]
            })
        });

        const googleData = await googleRes.json();
        const aiText = googleData.candidates[0].content.parts[0].text;

        // 2. Llamada a Deepgram (TTS)
        const ttsRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-antonia-es", {
            method: "POST",
            headers: {
                "Authorization": `Token ${DEEPGRAM_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: aiText })
        });

        const audioBuffer = await ttsRes.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        return res.status(200).json({
            texto: aiText,
            audio: `data:audio/mp3;base64,${base64Audio}`
        });

    } catch (error) {
        console.error("Error en API:", error);
        return res.status(500).json({ error: error.message });
    }
}
