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

  async function callVision(textPrompt){
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
            {type:"input_text",text:textPrompt},
            {type:"input_image",image_url:image,detail:"high"}
          ]
        }]
      })
    });
    const raw=await response.json();
    if(!response.ok) throw new Error(raw?.error?.message||"Vision request failed");
    const outputText=(raw.output_text||
      raw?.output?.flatMap(item=>item?.content||[])
        ?.find(part=>part?.type==="output_text")?.text||
      "").trim();
    try{
      return JSON.parse(outputText.replace(/^```json\s*/i,"").replace(/```$/,"").trim());
    }catch(e){
      const err=new Error("Could not parse recognition result");
      err.raw=outputText;
      throw err;
    }
  }

  const transcriptionPrompt=[
    "You are doing visual transcription of a Pokemon TCG card photo.",
    "Do NOT identify the card from memory unless the text is visibly supported.",
    "Read only what is actually visible on the physical card.",
    "Return ONLY JSON with keys: visible_name, visible_number, number_candidates, visible_set_code, visible_set_symbol_description, visible_language, visible_hp, visible_rarity_text, visible_stamp_text, visible_promo_text, visible_finish, visible_clues, transcription_confidence.",
    "visible_name is the printed Pokemon/card name if legible, otherwise null.",
    "visible_number is the printed collector number exactly as seen, like 188/132, otherwise null.",
    "number_candidates must contain up to three plausible readings if any digit is uncertain.",
    "visible_set_code must be null unless an actual code is printed visibly.",
    "visible_language is the printed language inferred from readable card text.",
    "visible_clues must be an array of short literal observations from the image, such as attack names, HP, copyright year, regulation mark, special logo or distinctive printed text.",
    "Do not guess a set or card identity. If uncertain, use null."
  ].join(" ");

  try{
    const evidence=await callVision(transcriptionPrompt);

    const identifyPrompt=[
      "You are the exact-variant recognition engine for HAVE.",
      "Use the attached card photo AND the prior visual transcription below.",
      "You must identify the exact physical Pokemon TCG printing, but only when the visible evidence is coherent.",
      "PRIOR TRANSCRIPTION JSON: "+JSON.stringify(evidence),
      "Hard rules:",
      "1. Collector number is a hard constraint. Never output a card whose collector number conflicts with a clearly read visible_number.",
      "2. Printed card name is a hard constraint when clearly legible.",
      "3. If name, number, set clues or artwork are inconsistent, do NOT force a match. Set needs_confirmation=true and explain the conflict.",
      "4. Never substitute a famous or visually similar card.",
      "5. Set code may be inferred only when the exact card identity is otherwise strongly supported.",
      "6. Treat language, finish, stamp, promo, edition and special printing as part of the exact variant.",
      "Return ONLY JSON with exactly these keys:",
      "name, set, set_code, number, number_candidates, language, rarity, finish, variant, stamp, stamp_text, edition, promo, special_markings, confidence, exact_variant_confidence, needs_confirmation, confirmation_reason, notes.",
      "If exact identity is not supported, use null for uncertain identity fields instead of guessing.",
      "confidence is confidence in base card identity; exact_variant_confidence is confidence in exact printing."
    ].join(" ");

    const identified=await callVision(identifyPrompt);

    if(evidence?.visible_number){
      const ev=String(evidence.visible_number).trim();
      const out=identified?.number?String(identified.number).trim():"";
      if(out && ev!==out){
        identified.needs_confirmation=true;
        identified.confirmation_reason="Il numero letto dalla carta ("+ev+") non coincide con l'identificazione proposta ("+out+").";
        identified.number=ev;
        identified.number_candidates=Array.from(new Set([ev,...(Array.isArray(evidence.number_candidates)?evidence.number_candidates:[])]));
        identified.exact_variant_confidence=Math.min(Number(identified.exact_variant_confidence)||0,0.49);
      }
    }
    if(evidence?.visible_name && identified?.name){
      const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"").trim();
      if(norm(evidence.visible_name)!==norm(identified.name)){
        identified.needs_confirmation=true;
        identified.confirmation_reason=(identified.confirmation_reason?identified.confirmation_reason+" ":"")+"Il nome letto dalla carta non coincide con l'identificazione proposta.";
        identified.exact_variant_confidence=Math.min(Number(identified.exact_variant_confidence)||0,0.49);
      }
    }

    return res.status(200).json({recognition:identified,evidence});
  }catch(err){
    return res.status(500).json({
      error:err.message||"Recognition failed",
      raw:err.raw||undefined
    });
  }
}
