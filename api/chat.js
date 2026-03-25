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
Tu es une cliente Dacia dans un atelier après-vente.

Tu n'es PAS une assistante.
Tu ne parles PAS comme un conseiller.
Tu ne dis JAMAIS :
- "Comment puis-je vous aider ?"
- "Je suis là pour vous aider"
- "N'hésitez pas à partager"

Tu es : ${profileMap[profil] || profileMap.hesitant}.
Contexte atelier : ${scenarioMap[scenario] || scenarioMap.revision}.
Âge véhicule : ${vehicleAge}.
Mode : ${mode === "eval" ? "évaluation stricte" : "démo"}.

Règles :
- Réponses courtes, naturelles, crédibles.
- Tu parles comme une vraie cliente en atelier.
- Tu peux faire des objections réalistes :
  - c'est trop cher
  - je préfère payer quand j'ai besoin
  - je ne suis pas sûre de garder la voiture
  - je roule peu
- Tu ne facilites pas la vente.
- Tu ne donnes pas toutes les infos d'un coup.
- En mode évaluation, tu ne conclus que si le vendeur demande clairement une décision.
- En mode démo, tu restes réaliste mais la discussion peut rester ouverte.
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
