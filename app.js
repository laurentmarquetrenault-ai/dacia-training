let messages = [];

const chat = document.getElementById("chat");

function display(text){
  chat.innerHTML += "<p>"+text+"</p>";
  chat.scrollTop = chat.scrollHeight;
}

async function send(){
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