// /api/chat.js
export default async function handler(req, res) {
    // 1. Headers para evitar errores de seguridad (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 2. Manejo de pre-vuelo (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Forzar que solo acepte POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Debes usar POST' });
    }

    try {
        const { text } = req.body;
        const prompt = text === "INICIO_AUTOMATICO" ? "Saludá a Walter brevemente." : text;

        // --- LLAMADA A GEMINI ---
        const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAYG9a-HvaGSK1bYMEw7sNebFcFVlr7_nA`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Sos Irina. Respondé en español rioplatense, máximo 12 palabras. Usuario dice: ${prompt}` }] }]
            })
        });
        const googleData = await googleRes.json();
        const aiText = googleData.candidates[0].content.parts[0].text;

        // --- LLAMADA A DEEPGRAM (Voz) ---
        const ttsRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-antonia-es", {
            method: "POST",
            headers: {
                "Authorization": `Token 90d3ca39a1dd6c4ff959df9d21ea654254b9e0d6`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: aiText })
        });

        const audioBuffer = await ttsRes.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        // 4. Respuesta final exitosa
        return res.status(200).json({
            texto: aiText,
            audio: `data:audio/mp3;base64,${base64Audio}`
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
