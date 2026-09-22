export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) return res.status(500).json({error:"OPENAI_API_KEY not configured"});

  const image=req.body&&req.body.image;
  if(!image || typeof image!=="string" || !image.startsWith("data:image/")){
    return res.status(400).json({error:"Missing image"});
  }

  const prompt=[
    "You identify Pokemon trading cards from photos.",
    "Return ONLY valid JSON with keys:",
    "name, set, number, language, variant, rarity, confidence, notes.",
    "Use null when uncertain. confidence is a number from 0 to 1.",
    "Read the collector number carefully from the bottom of the card.",
    "Do not guess a set if the visible evidence is insufficient."
  ].join(" ");

  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+apiKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-5-mini",
        input:[{
          role:"user",
          content:[
            {type:"input_text",text:prompt},
            {type:"input_image",image_url:image}
          ]
        }]
      })
    });
    const raw=await response.json();
    if(!response.ok){
      return res.status(response.status).json({error:raw?.error?.message||"Vision request failed"});
    }
    const text=(raw.output_text||"").trim();
    let parsed;
    try{
      parsed=JSON.parse(text.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim());
    }catch(e){
      return res.status(502).json({error:"Could not parse recognition result",raw:text});
    }
    return res.status(200).json({recognition:parsed});
  }catch(err){
    return res.status(500).json({error:err.message||"Recognition failed"});
  }
}
