const PRODUCT_URL="https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json";
const PRICE_URL="https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json";

function rows(obj){
  if(Array.isArray(obj)) return obj;
  if(!obj || typeof obj!=="object") return [];
  for(const key of ["products","product","data","items","priceGuide","priceguide","prices"]){
    if(Array.isArray(obj[key])) return obj[key];
  }
  for(const v of Object.values(obj)){
    if(Array.isArray(v) && v.length && typeof v[0]==="object") return v;
  }
  return [];
}
function norm(s){
  return String(s||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g," ").trim();
}
function num(v){
  if(v===null||v===undefined||v==="") return null;
  const n=Number(v);
  return Number.isFinite(n)&&n>0?n:null;
}
function get(row,...keys){
  for(const k of keys) if(row && row[k]!==undefined && row[k]!==null) return row[k];
  return null;
}
function productScore(p,{name,number,set,setCode}){
  const pn=norm(get(p,"name","Name","productName"));
  const qn=norm(name);
  let s=0;
  if(pn===qn) s+=60;
  else if(pn.includes(qn)||qn.includes(pn)) s+=35;

  const wantedNum=String(number||"").split("/")[0].replace(/^0+/,"");
  const fields=[get(p,"number","cardNumber","collectorNumber","localId"), get(p,"name","Name")].filter(Boolean).map(String);
  if(wantedNum && fields.some(x=>new RegExp("(^|[^0-9])0*"+wantedNum+"([^0-9]|$)").test(x))) s+=25;

  const sc=norm(setCode);
  const sn=norm(set);
  const expansionText=norm([get(p,"expansionName","Expansion","expansion","setName"),get(p,"name","Name")].filter(Boolean).join(" "));
  if(sc && expansionText.includes(sc)) s+=15;
  if(sn && expansionText.includes(sn)) s+=15;
  return s;
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Cache-Control","s-maxage=21600, stale-while-revalidate=86400");
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const {name,number,set,setCode,finish}=req.body||{};
  if(!name) return res.status(400).json({error:"Missing card name"});

  try{
    const [pr,gr]=await Promise.all([
      fetch(PRODUCT_URL),
      fetch(PRICE_URL)
    ]);
    if(!pr.ok||!gr.ok) throw new Error("Cardmarket public files unavailable");

    const [productsRaw,pricesRaw]=await Promise.all([pr.json(),gr.json()]);
    const products=rows(productsRaw);
    const prices=rows(pricesRaw);

    const candidates=products
      .map(p=>({p,score:productScore(p,{name,number,set,setCode})}))
      .filter(x=>x.score>=35)
      .sort((a,b)=>b.score-a.score)
      .slice(0,10);

    if(!candidates.length) return res.status(200).json({match:null,source:"Cardmarket official public files"});

    const top=candidates[0];
    const second=candidates[1];
    const exactEnough=top.score>=60 && (!second || top.score-second.score>=10 || top.score>=85);
    if(!exactEnough){
      return res.status(200).json({
        match:null,
        ambiguous:true,
        candidates:candidates.slice(0,5).map(x=>({
          idProduct:get(x.p,"idProduct","id_product"),
          name:get(x.p,"name","Name"),
          score:x.score
        })),
        source:"Cardmarket official public files"
      });
    }

    const id=String(get(top.p,"idProduct","id_product")||"");
    const row=prices.find(r=>String(get(r,"idProduct","id_product"))===id);
    if(!row) return res.status(200).json({match:null,product:{idProduct:id,name:get(top.p,"name","Name")},source:"Cardmarket official public files"});

    const wantsHolo=/holo|foil|textured/i.test(String(finish||""));
    const trend=wantsHolo
      ? (num(get(row,"trend-holo","trendHolo","Foil Trend","foilTrend")) ?? num(get(row,"trend","Trend Price","trendPrice")))
      : num(get(row,"trend","Trend Price","trendPrice"));
    const avg7=wantsHolo
      ? (num(get(row,"avg7-holo","avg7Holo","Foil AVG7","foilAvg7")) ?? num(get(row,"avg7","AVG7","avg7")))
      : num(get(row,"avg7","AVG7","avg7"));
    const avg30=wantsHolo
      ? (num(get(row,"avg30-holo","avg30Holo","Foil AVG30","foilAvg30")) ?? num(get(row,"avg30","AVG30","avg30")))
      : num(get(row,"avg30","AVG30","avg30"));
    const low=wantsHolo
      ? (num(get(row,"low-holo","lowHolo","Foil Low","foilLow")) ?? num(get(row,"low","Low Price","lowPrice")))
      : num(get(row,"low","Low Price","lowPrice"));

    const value=trend ?? avg7 ?? avg30 ?? low;
    return res.status(200).json({
      match:value?{
        idProduct:id,
        name:get(top.p,"name","Name"),
        value,
        currency:"EUR",
        trend,avg7,avg30,low,
        score:top.score,
        createdAt:pricesRaw?.createdAt||null
      }:null,
      source:"Cardmarket official public files"
    });
  }catch(err){
    return res.status(502).json({error:err.message||"Cardmarket lookup failed"});
  }
}
