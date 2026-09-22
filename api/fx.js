export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
  res.setHeader("Cache-Control","s-maxage=3600, stale-while-revalidate=86400");
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});

  const sources=[
    async()=>{
      const r=await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR");
      if(!r.ok) return null;
      const d=await r.json();
      const rate=Number(d?.rates?.EUR);
      return Number.isFinite(rate)&&rate>0?rate:null;
    },
    async()=>{
      const r=await fetch("https://open.er-api.com/v6/latest/USD");
      if(!r.ok) return null;
      const d=await r.json();
      const rate=Number(d?.rates?.EUR);
      return Number.isFinite(rate)&&rate>0?rate:null;
    }
  ];

  for(const getRate of sources){
    try{
      const rate=await getRate();
      if(rate) return res.status(200).json({from:"USD",to:"EUR",rate});
    }catch(e){}
  }

  return res.status(502).json({error:"FX rate unavailable"});
}
