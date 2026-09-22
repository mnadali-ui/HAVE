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
    "You are the exact-variant recognition engine for HAVE, an app for collectible-card cataloging and trading.",
    "Your task is NOT merely to identify the Pokemon name. You must identify the exact physical Pokemon TCG printing visible in the photo.",
    "Before answering, inspect the entire card and cross-check all visible evidence: card name, collector number, set symbol or set code, artwork, rarity marks, copyright line, language, foil pattern, borders, promo numbering, edition marks and any printed stamp or event logo.",
    "Treat two cards with the same name and artwork as DIFFERENT variants if any stamp, logo, language, finish, promo mark, edition or special printing differs.",
    "Pay special attention to small printed marks such as League, Regional, Championship, Prerelease, STAFF, Pokemon Center, tournament, event, store, anniversary or other special stamps.",
    "If a special symbol or stamp is visible but you cannot identify it confidently, report that a special marking is present instead of silently treating the card as a normal version.",
    "Do not infer a normal version when the image may contain a special printing.",
    "Return ONLY valid JSON with exactly these keys:",
    "name, set, number, language, rarity, finish, variant, stamp, stamp_text, edition, promo, special_markings, confidence, exact_variant_confidence, needs_confirmation, confirmation_reason, notes.",
    "language must represent the printed language on the card when visible, using codes such as ITA, ENG, JPN, FRA, DEU, ESP, KOR, CHN.",
    "finish should distinguish normal, holo, reverse holo, cosmos holo, cracked ice, foil, textured foil or another visible treatment when possible.",
    "stamp should identify the type of special stamp/logo when possible.",
    "stamp_text should transcribe any visible special stamp or logo text as accurately as possible.",
    "edition should capture 1st Edition, Unlimited or another edition marker when visible.",
    "promo should capture promo status and promo numbering when visible.",
    "special_markings must be an array of other distinctive printed marks or logos.",
    "confidence is confidence that the base card identity is correct.",
    "exact_variant_confidence is confidence that the exact printing/variant is correct.",
    "needs_confirmation must be true whenever language, finish, stamp, edition, promo status, collector number or exact variant is uncertain.",
    "confirmation_reason must briefly state what the user should verify when needs_confirmation is true.",
    "Use null when a field cannot be determined from visible evidence.",
    "Never invent a set, number, language, stamp, finish, promo status or variant.",
    "Read the collector number and any tiny stamp text very carefully.",
    "A high confidence score is allowed only when the visible details support the exact variant, not just the Pokemon name."
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
        text:{
          format:{type:"json_object"}
        },
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
      return res.status(response.status).json({error:raw?.error?.message||"Vision request failed"});
    }
    const outputText=(raw.output_text||
      raw?.output?.flatMap(item=>item?.content||[])
        ?.find(part=>part?.type==="output_text")?.text||
      "").trim();

    let parsed;
    try{
      parsed=JSON.parse(outputText.replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim());
    }catch(e){
      return res.status(502).json({
        error:"Could not parse recognition result",
        raw:outputText,
        status:raw?.status||null,
        incomplete_reason:raw?.incomplete_details?.reason||null
      });
    }
    return res.status(200).json({recognition:parsed});
  }catch(err){
    return res.status(500).json({error:err.message||"Recognition failed"});
  }
}
