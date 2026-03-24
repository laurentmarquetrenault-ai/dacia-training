export default async function handler(req,res){
  const { conversation } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{
      "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      model:"gpt-4o-mini",
      messages:[
        {role:"system",content:"Note sur 20 avec analyse"},
        {role:"user",content:conversation}
      ]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}