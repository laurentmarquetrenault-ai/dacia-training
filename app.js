let messages = [];
let trust = 50;
let finished = false;

const chat = document.getElementById("chat");
const trustBar = document.getElementById("trust");
const avatar = document.getElementById("avatar");

function display(text){
  chat.innerHTML += "<p>"+text+"</p>";
  chat.scrollTop = chat.scrollHeight;
}

async function send(){
  if(finished) return;

  const input = document.getElementById("input");
  const val = input.value;
  input.value = "";

  display("<b>Vous :</b> "+val);
  messages.push({role:"user", content:val});

  const res = await fetch("/api/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages })
  });

  const data = await res.json();
  const reply = data.choices[0].message.content;

  display("<b>Cliente :</b> "+reply);
  messages.push({role:"assistant", content:reply});

  updateTrust(reply);
  updateAvatar(reply);

  detectEnd(reply);
}

function updateTrust(text){
  if(text.includes("ok") || text.includes("oui")){
    trust += 10;
  } else {
    trust -= 5;
  }
  trustBar.style.width = trust+"%";
}

function updateAvatar(text){
  if(text.includes("oui")) avatar.innerHTML = "🙂";
  else if(text.includes("non")) avatar.innerHTML = "😒";
  else avatar.innerHTML = "😐";
}

function detectEnd(text){
  if(text.includes("ok") || text.includes("non merci")){
    finished = true;
    document.getElementById("endMessage").classList.remove("hidden");
  }
}

function finishDemo(){
  if(document.getElementById("mode").value === "demo"){
    finished = true;
    document.getElementById("endMessage").classList.remove("hidden");
  }
}

async function evaluate(){
  const res = await fetch("/api/evaluate", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ conversation: JSON.stringify(messages) })
  });

  const data = await res.json();
  alert(data.choices[0].message.content);
}

function toggleHelp(){
  document.getElementById("helpBox").classList.toggle("hidden");
}
