let messages = [];
let trust = 50;
let finished = false;

const chat = document.getElementById("chat");
const trustBar = document.getElementById("trust");
const trustText = document.getElementById("trustText");
const avatar = document.getElementById("avatar");

function display(text, role = "client") {
  const empty = document.getElementById("chatEmpty");
  if (empty) empty.style.display = "none";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;

  const roleLabel = role === "seller" ? "Vendeur" : "Cliente";
  bubble.innerHTML = `<span class="role">${roleLabel}</span>${text}`;

  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  if (finished) return;

  const input = document.getElementById("input");
  const val = input.value.trim();
  if (!val) return;

  input.value = "";
  display(val, "seller");
  messages.push({ role: "user", content: val });

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      display("Erreur : réponse IA invalide.", "client");
      return;
    }

    const reply = data.choices[0].message.content;
    display(reply, "client");
    messages.push({ role: "assistant", content: reply });

    updateTrust(reply);
    updateAvatar(reply);
    detectEnd(reply);
  } catch (err) {
    console.error(err);
    display("Erreur réseau ou serveur.", "client");
  }
}

function updateTrust(text) {
  if (text.toLowerCase().includes("oui") || text.toLowerCase().includes("ok")) {
    trust = Math.min(100, trust + 10);
  } else if (text.toLowerCase().includes("non") || text.toLowerCase().includes("pas")) {
    trust = Math.max(0, trust - 10);
  }

  trustBar.style.width = trust + "%";
  if (trustText) trustText.textContent = trust + "%";
}

function updateAvatar(text) {
  const t = text.toLowerCase();

  if (t.includes("oui") || t.includes("d'accord") || t.includes("pourquoi pas")) {
    avatar.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400";
  } else if (t.includes("non") || t.includes("pas convaincue") || t.includes("trop cher")) {
    avatar.src = "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=400";
  } else {
    avatar.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400";
  }
}

function detectEnd(text) {
  const t = text.toLowerCase();

  if (t.includes("ok") || t.includes("d'accord") || t.includes("non merci")) {
    finished = true;
    document.getElementById("endMessage").classList.remove("hidden");
  }
}

function finishDemo() {
  if (document.getElementById("mode").value === "demo") {
    finished = true;
    document.getElementById("endMessage").classList.remove("hidden");
  }
}

async function evaluate() {
  try {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation: JSON.stringify(messages) })
    });

    const data = await res.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      alert("Erreur : évaluation invalide.");
      return;
    }

    alert(data.choices[0].message.content);
  } catch (err) {
    console.error(err);
    alert("Erreur pendant l’évaluation.");
  }
}

function toggleHelp() {
  document.getElementById("helpBox").classList.toggle("hidden");
}
