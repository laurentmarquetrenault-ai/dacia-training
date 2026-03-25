export default async function handler(req, res) {
  const { conversation, trust, mode, profil, scenario, vehicleAge } = req.body;

  const prompt = `
Tu es un formateur expert en vente de contrats de service Dacia.

Analyse cette simulation commerciale atelier.

Contexte :
- Mode : ${mode}
- Profil client : ${profil}
- Scénario : ${scenario}
- Âge véhicule : ${vehicleAge}
- Indice final de confiance : ${trust}/100

Conversation :
${JSON.stringify(conversation, null, 2)}

Donne une évaluation structurée en français, concise et professionnelle, au format :

NOTE GLOBALE : x/20

Points forts :
- ...
- ...

Points faibles :
- ...
- ...

Axes d'amélioration :
- ...
- ...

Verdict :
...

Sois exigeant, terrain, concret.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API error" });
  }
}
