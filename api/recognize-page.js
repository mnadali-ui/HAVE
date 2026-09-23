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
    "You are HAVE's Pokemon binder-page recognition engine.",
    "Inspect the entire image and determine whether it contains multiple Pokemon TCG cards arranged on a binder page.",
    "Recognize every visible card separately, in reading order from top-left to bottom-right.",
    "Return ONLY valid JSON with keys: mode, card_count, cards.",
    "mode must be binder_page or single_card.",
    "cards must be an array of at most 12 objects.",
    "Each card object must contain: position, name, set, set_code, number, language, rarity, finish, variant, stamp, promo, confidence, needs_confirmation, confirmation_reason.",
    "position is 1-based reading order.",
    "Collector number is important. Read it carefully and preserve formats like 188/132.",
    "Never invent a card when the text is not legible. Use null and needs_confirmation=true instead.",
    "If a stamp, league logo, regional logo, prerelease, staff, championship or other special marking is visible, include it in stamp.",
    "Language must reflect the printed card language.",
    "confidence must be between 0 and 1.",
    "Do not merge multiple cards into one identity."
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
        text:{format:{type:"json_object"}},
        input:[{
          role:"user",
          content:[
            {type:"input_text",text:prompt},
            {type:"input_image",image_url:image,detail:"high"}
          ]
        }]
      })
    });

    const raw=await response.json();
    if(!response.ok){
      return res.status(response.status).json({error:raw?.error?.message||"Page recognition failed"});
    }

    const outputText=(raw.output_text||
      raw?.output?.flatMap(item=>item?.content||[])
        ?.find(part=>part?.type==="output_text")?.text||
      "").trim();

    let parsed;
    try{
      parsed=JSON.parse(outputText.replace(/^```json\s*/i,"").replace(/```$/,"").trim());
    }catch(e){
      return res.status(502).json({error:"Could not parse page recognition result",raw:outputText});
    }

    if(!Array.isArray(parsed.cards)) parsed.cards=[];
    parsed.cards=parsed.cards.slice(0,12);
    parsed.card_count=parsed.cards.length;

    return res.status(200).json(parsed);
  }catch(err){
    return res.status(500).json({error:err.message||"Page recognition failed"});
  }
}
