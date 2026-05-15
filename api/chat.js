const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default async function handler(req, res) {
    // Headers para habilitar comunicación (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Método no permitido. Usar POST." });

    const GEMINI_KEY = "AIzaSyAYG9a-HvaGSK1bYMEw7sNebFcFVlr7_nA";
    const DEEPGRAM_KEY = "90d3ca39a1dd6c4ff959df9d21ea654254b9e0d6";

    try {
        const { text } = req.body;
        const prompt = text === "INICIO_AUTOMATICO" ? "Saludá a Walter muy brevemente." : text;

        // 1. Gemini
        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Sos Irina. Hablás español rioplatense. Sé breve (12 palabras). Usuario: ${prompt}` }] }]
            })
        });
        const gData = await gRes.json();
        const aiText = gData.candidates[0].content.parts[0].text;

        // 2. Deepgram
        const dRes = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-antonia-es", {
            method: "POST",
            headers: { "Authorization": `Token ${DEEPGRAM_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: aiText })
        });
        const buffer = await dRes.arrayBuffer();
        const base64Audio = Buffer.from(buffer).toString('base64');

        return res.status(200).json({ texto: aiText, audio: `data:audio/mp3;base64,${base64Audio}` });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
