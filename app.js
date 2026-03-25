let messages = [];
let trust = 50;
let finished = false;

const chat = document.getElementById("chat");
const trustBar = document.getElementById("trust");
const trustText = document.getElementById("trustText");
const avatar = document.getElementById("avatar");
const input = document.getElementById("input");
const modeSelect = document.getElementById("mode");
const profilSelect = document.getElementById("profil");
const scenarioSelect = document.getElementById("scenario");
const vehicleAgeSelect = document.getElementById("vehicleAge");
const endMessage = document.getElementById("endMessage");

const avatarByState = {
  happy: "/images/happy.jpg",
  neutral: "/images/neutral.jpg",
  angry: "/images/angry.jpg"
};

function display(text, role = "client") {
  const empty = document.getElementById("chatEmpty");
  if (empty) empty.style.display = "none";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;

  const roleLabel =
    role === "seller" ? "Vendeur" :
    role === "coach" ? "Coach" :
    "Cliente";

  bubble.innerHTML = `<span class="role">${roleLabel}</span>${text}`;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function resetTrustUI() {
  trustBar.style.width = trust + "%";
  trustText.textContent = trust + "%";
}

function updateAvatar() {
  if (trust > 70) {
    avatar.src = avatarByState.happy;
  } else if (trust > 40) {
    avatar.src = avatarByState.neutral;
  } else {
    avatar.src = avatarByState.angry;
  }
}

function resetDemo() {
  messages = [];
  trust = 50;
  finished = false;
  chat.innerHTML = `<div class="chat-empty" id="chatEmpty">
    Lance l’échange avec une première phrase vendeur.<br />
    En mode démo, tu peux sortir quand tu veux. En mode évaluation, la cliente devra conclure.
  </div>`;
  input.disabled = false;
  input.value = "";
  endMessage.classList.add("hidden");
  resetTrustUI();
  updateAvatar();
}

function toggleHelp() {
  document.getElementById("helpBox").classList.toggle("hidden");
}

function updateTrustFromSellerMessage(text) {
  const t = text.toLowerCase();

  let delta = -8;

  const goodSignals = [
    "prix", "budget", "mensual", "48 mois", "garantie", "assistance",
    "révision", "entretien", "usure", "tranquille", "tranquillité",
    "revente", "protéger", "éviter", "facture", "cep", "cep+",
    "qu'est-ce qui", "combien", "vous gardez", "vous roulez", "quel usage"
  ];

  const badSignals = [
    "non", "plus tard", "repassez", "je sais pas", "comme vous voulez",
    "aucune idée", "c'est vous qui voyez"
  ];

  const hasGood = goodSignals.some(word => t.includes(word));
  const hasBad = badSignals.some(word => t.includes(word));

  if (hasGood) delta = +8;
  if (hasBad) delta = -15;

  trust += delta;
  if (trust > 100) trust = 100;
  if (trust < 0) trust = 0;

  resetTrustUI();
  updateAvatar();
}

function detectEnd(reply) {
  const t = reply.toLowerCase();

  const accepted = [
    "d'accord", "ok", "allons-y", "ça me va", "on le met en place"
  ];

  const refused = [
    "non merci", "je préfère sans", "je vais en rester là"
  ];

  if (
    accepted.some(x => t.includes(x)) ||
    refused.some(x => t.includes(x))
  ) {
    finished = true;
    input.disabled = true;
    endMessage.classList.remove("hidden");
  }
}

async function send() {
  if (finished) return;

  const val = input.value.trim();
  if (!val) return;

  input.value = "";

  display(val, "seller");
  messages.push({
    role: "user",
    content: val
  });

  updateTrustFromSellerMessage(val);

  const payload = {
    messages,
    profil: profilSelect.value,
    scenario: scenarioSelect.value,
    mode: modeSelect.value,
    vehicleAge: vehicleAgeSelect.value
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      display("Erreur : réponse IA invalide.", "client");
      return;
    }

    const reply = data.choices[0].message.content;
    display(reply, "client");
    messages.push({
      role: "assistant",
      content: reply
    });

    if (modeSelect.value === "eval") {
      detectEnd(reply);
    }
  } catch (err) {
    console.error(err);
    display("Erreur réseau ou serveur.", "client");
  }
}

function finishDemo() {
  if (modeSelect.value !== "demo") return;

  finished = true;
  input.disabled = true;
  endMessage.classList.remove("hidden");
}

async function evaluate() {
  try {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        conversation: messages,
        trust,
        mode: modeSelect.value,
        profil: profilSelect.value,
        scenario: scenarioSelect.value,
        vehicleAge: vehicleAgeSelect.value
      })
    });

    const data = await res.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      display("Erreur : évaluation invalide.", "coach");
      return;
    }

    display(data.choices[0].message.content, "coach");
  } catch (err) {
    console.error(err);
    display("Erreur pendant l’évaluation.", "coach");
  }
}

resetDemo();
