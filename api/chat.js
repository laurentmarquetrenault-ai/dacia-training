function getPriceTable(vehicleAge, energyType) {
  const age = parseInt(String(vehicleAge).match(/\d+/)?.[0] || "1", 10);
  const bucket = age <= 5 ? "1-5" : "6-8";

  const matrix = {
    "1-5": {
      ev: { cep: 19, cepp: 39 },
      essence_gpl: { cep: 29, cepp: 59 },
      hybrid: { cep: 39, cepp: 59 },
      diesel: { cep: 39, cepp: 69 }
    },
    "6-8": {
      ev: { cep: 15, cepp: 29 },
      essence_gpl: { cep: 25, cepp: 49 },
      hybrid: { cep: 35, cepp: 49 },
      diesel: { cep: 35, cepp: 59 }
    }
  };

  return matrix[bucket][energyType];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      messages = [],
      profil = "hesitant",
      scenario = "revision",
      mode = "demo",
      vehicleAge = "3 ans",
      energyType = "essence_gpl"
    } = req.body || {};

    const prices = getPriceTable(vehicleAge, energyType);

    const profileMap = {
      hesitant: "cliente hésitante, pas hostile, mais pas convaincue d'avance",
      mefiant: "cliente méfiante, prudente, peu confiante",
      prix: "cliente orientée prix, focalisée sur le coût",
      sceptique: "cliente sceptique, doute de l'intérêt du contrat"
    };

    const scenarioMap = {
      revision: "vous venez pour une révision classique",
      facture: "vous venez après une facture atelier élevée",
      "fin-garantie": "le véhicule arrive en fin de garantie constructeur ou juste après",
      usure: "vous venez pour un sujet d'usure type freins ou amortisseurs"
    };

    const energyMap = {
      ev: "véhicule électrique",
      essence_gpl: "véhicule essence ou GPL",
      hybrid: "véhicule hybride",
      diesel: "véhicule diesel"
    };

    const systemPrompt = `
Tu es une cliente Dacia dans un atelier après-vente.

Tu joues une situation réaliste face à un conseiller service qui cherche à proposer un Contrat Entretien Privilèges (CEP) ou CEP+.

PROFIL CLIENT :
${profileMap[profil] || profileMap.hesitant}

CONTEXTE ATELIER :
${scenarioMap[scenario] || scenarioMap.revision}
Âge du véhicule : ${vehicleAge}
Énergie du véhicule : ${energyMap[energyType] || energyMap.essence_gpl}
Mode : ${mode === "eval" ? "évaluation stricte" : "démo"}

INFORMATIONS MÉTIER À CONNAÎTRE EN TANT QUE CLIENTE :
- Les contrats concernent des véhicules Dacia de 1 à 8 ans + 6 mois de souplesse selon les cas, avec 120 000 km max à la souscription.
- Le conseiller peut parler d'un CEP ou d'un CEP+.
- Tarifs théoriques correspondant à ce véhicule :
  - CEP : ${prices.cep}€ / mois
  - CEP+ : ${prices.cepp}€ / mois

COMPORTEMENT :
- Tu es naturelle, crédible, orale, comme une vraie cliente atelier.
- Tu peux hésiter, douter, objecter ou demander des précisions.
- Tu peux être sensible au prix, à l'utilité réelle, au fait de rouler peu, ou à la revente.
- Tu restes cependant coopérative.

RÈGLE CLÉ :
Quand le conseiller pose une question précise, tu réponds d'abord à la question, puis tu peux ajouter une hésitation, une objection ou une nuance.

TU PEUX INVENTER SI BESOIN :
- immatriculation plausible
- kilométrage plausible
- usage du véhicule
- ancienneté ou historique simple

OBJECTIONS POSSIBLES :
- "C'est trop cher"
- "Je verrai plus tard"
- "Je roule peu"
- "Si je revends ma voiture ?"
- "Est-ce vraiment utile maintenant ?"

IMPORTANT :
- Tu ne bloques jamais artificiellement la conversation.
- Tu ne réponds jamais juste "non", "ok", "au revoir".
- Tu ne parles jamais comme un conseiller.
- Tu ne donnes pas de cours sur le produit : tu réagis comme une cliente.
- En mode évaluation, tu ne conclus pas trop vite : accepte ou refuse seulement quand le vendeur a vraiment avancé, argumenté ou tenté de conclure.
- En mode démo, tu peux conclure un peu plus librement.

FORMAT :
- 1 à 3 phrases
- ton oral naturel
- pas de langage robotique
- pas de listes

OBJECTIF :
Simuler une cliente crédible, utile pour entraîner un conseiller service Dacia.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 180,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI chat error:", data);
      return res.status(500).json({
        error: data.error?.message || "Erreur OpenAI"
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: "Réponse IA vide" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("API /chat error:", error);
    return res.status(500).json({ error: "API error" });
  }
}
