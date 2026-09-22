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
    "You are the recognition engine for HAVE, an app that identifies exact Pokemon TCG card variants from photos.",
    "Inspect the full visible card, especially the collector number, set symbol, copyright line, foil treatment and any printed stamp/logo.",
    "Return ONLY valid JSON with these keys:",
    "name, set, number, language, rarity, finish, variant, stamp, stamp_text, edition, promo, special_markings, confidence, notes.",
    "language should be the printed card language when visible, for example ITA, ENG, JPN, FRA, DEU, ESP, KOR, CHN.",
    "finish should distinguish normal, holo, reverse holo, cosmos holo, cracked ice, foil or other visible treatment when possible.",
    "stamp must describe a special printed stamp/logo if present, such as League, Regional, Championship, Prerelease, STAFF, Pokemon Center, event, store or other mark.",
    "stamp_text should transcribe visible special logo/stamp text when possible.",
    "edition should capture 1st Edition, unlimited or other edition markers when visible.",
    "promo must identify promo status or promo numbering when visible.",
    "special_markings should be an array of any other distinctive printed marks.",
    "Use null when uncertain and never invent a stamp, set, language or variant.",
    "confidence is a number from 0 to 1 for the exact variant, not just the Pokemon name.",
    "Read the collector number very carefully."
  ].join(" ");

  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+apiKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-5.6-luna",
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
