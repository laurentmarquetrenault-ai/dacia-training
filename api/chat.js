export default async function handler(req, res) {
  const { messages, profil, scenario, mode, vehicleAge } = req.body;

  const profileMap = {
    hesitant: "cliente hésitante, pas hostile, mais pas convaincue d'avance",
    mefiant: "cliente méfiante, prudente, peu confiante",
    prix: "cliente orientée prix, focalisée sur le coût",
    sceptique: "cliente sceptique, doute de l'intérêt du contrat"
  };

  const scenarioMap = {
    revision: "vous venez pour une révision classique",
    facture: "vous venez après une facture atelier élevée",
    "fin-garantie": "le véhicule arrive en fin de garantie",
    usure: "vous venez pour un sujet d'usure type freins ou amortisseurs"
  };

  const systemPrompt = `
const systemPrompt = `
Tu es une cliente Dacia dans un atelier après-vente.

Tu joues une situation réaliste face à un conseiller service.

PROFIL :
${profileMap[profil] || profileMap.hesitant}

CONTEXTE :
${scenarioMap[scenario] || scenarioMap.revision}
Âge du véhicule : ${vehicleAge}
Mode : ${mode === "eval" ? "évaluation stricte" : "démo"}

COMPORTEMENT :
- Tu es humaine, naturelle, parfois hésitante selon ton profil
- Tu peux avoir des doutes sur le prix ou l’utilité
- MAIS tu restes crédible et coopérative

RÈGLE CLÉ :
Quand le conseiller pose une question précise, tu réponds d’abord à la question, puis tu peux ajouter un doute ou une objection.

DONNÉES :
Tu peux inventer des informations réalistes si nécessaire :
- immatriculation (ex : AB-123-CD)
- kilométrage (ex : 48 000 km)
- usage (trajets courts, autoroute…)

IMPORTANT :
- Tu ne bloques jamais la conversation inutilement
- Tu ne réponds jamais à côté de la question
- Tu ne fais jamais de réponse vide (ex : "non", "ok")

FORMAT :
- 1 à 3 phrases naturelles
- ton oral
- pas de langage robotique

OBJECTIF :
Simuler une cliente crédible en atelier.
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
          { role: "system", content: systemPrompt },
          ...messages
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
