 let messages = [];
let trust = 50;
let finished = false;

const chat = document.getElementById("chat");
const trustBar = document.getElementById("trust");
const trustText = document.getElementById("trustText");
const avatar = document.getElementById("avatar");
const input = document.getElementById("input");

const avatarMap = {
  hesitant: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
  mefiant: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=400",
  prix: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400",
  sceptique: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400"
};

function setAvatarByProfile() {
  const profil = document.getElementById("profil").value;
  avatar.src = avatarMap[profil] || avatarMap.hesitant;
}

document.getElementById("profil").addEventListener("change", setAvatarByProfile);
setAvatarByProfile();

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

function updateTrust(text){
  text = text.toLowerCase();

  if(text.includes("prix") || text.includes("expliquer") || text.includes("proposer")){
    trust += 10; // bon vendeur
  }
  else if(text.includes("non") || text.includes("plus tard") || text.includes("pas maintenant")){
    trust -= 15; // mauvais vendeur
  }
  else{
    trust -= 5; // neutre mais pas engageant
  }

  if(trust > 100) trust = 100;
  if(trust < 0) trust = 0;

  trustBar.style.width = trust + "%";
}

function updateAvatar(){
  const img = document.querySelector("#avatar img");

  if(trust > 70){
    img.src = "https://randomuser.me/api/portraits/women/44.jpg"; // très contente
  }
  else if(trust > 40){
    img.src = "https://randomuser.me/api/portraits/women/45.jpg"; // neutre
  }
  else{
    img.src = "https://randomuser.me/api/portraits/women/46.jpg"; // pas contente
  }
}

function detectEnd(text) {
  const t = text.toLowerCase();

  if (
    t.includes("non merci") ||
    t.includes("d'accord") ||
    t.includes("allons-y") ||
    t.includes("ça me va") ||
    t.includes("ok")
  ) {
    finished = true;
    input.disabled = true;
    document.getElementById("endMessage").classList.remove("hidden");
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

  const profil = document.getElementById("profil").value;
  const scenario = document.getElementById("scenario").value;
  const mode = document.getElementById("mode").value;
  const vehicleAge = document.getElementById("vehicleAge").value;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        profil,
        scenario,
        mode,
        vehicleAge
      })
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

   updateTrust(reply);
updateAvatar();

  
    if (mode === "eval") {
      detectEnd(reply);
    }
  } catch (err) {
    console.error(err);
    display("Erreur réseau ou serveur.", "client");
  }
}

function finishDemo() {
  if (document.getElementById("mode").value === "demo") {
    finished = true;
    input.disabled = true;
    document.getElementById("endMessage").classList.remove("hidden");
  }
}

async function evaluate() {
  try {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation: JSON.stringify(messages)
      })
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
