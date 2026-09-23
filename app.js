const demoCards=[
{id:"sv3-125",name:"Charizard ex",set:"Ossidiana Infuocata",setCode:"SV3",number:"125/197",rarity:"Double Rare",language:"ITA",variant:"Holo",status:"keep",emoji:"🔥",sources:[{name:"Cardmarket",value:42.8},{name:"TCGplayer",value:45.1}],updated:"Oggi"},
{id:"sv2-151",name:"Mew ex",set:"Pokémon 151",setCode:"MEW",number:"151/165",rarity:"Ultra Rare",language:"ITA",variant:"Holo",status:"trade",emoji:"✨",sources:[{name:"Cardmarket",value:18.9},{name:"TCGplayer",value:20.4}],updated:"Oggi"},
{id:"sv1-025",name:"Pikachu",set:"Scarlatto e Violetto",setCode:"SV1",number:"025/198",rarity:"Common",language:"ITA",variant:"Reverse",status:"trade",emoji:"⚡",sources:[{name:"Cardmarket",value:2.4},{name:"TCGplayer",value:2.8}],updated:"Oggi"}
];

function robustEstimate(sources){
  const vals=sources.map(s=>s.value).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
  if(!vals.length)return 0;
  const mid=Math.floor(vals.length/2);
  return vals.length%2?vals[mid]:(vals[mid-1]+vals[mid])/2;
}
function euro(v){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(v)}
function loadCollection(){
  try{const raw=localStorage.getItem("have_collection");return raw?JSON.parse(raw):demoCards}catch(e){return demoCards}
}
let collection=loadCollection();
let previousView="home";
let detected=[];

function save(){try{localStorage.setItem("have_collection",JSON.stringify(collection))}catch(e){} renderAll()}
function portfolio(){return collection.reduce((sum,c)=>sum+robustEstimate(c.sources||[]),0)}

function cardRow(c){
  return `<button class="card-row" data-card="${c.id}" style="width:100%;text-align:left;border-style:solid">
    <div class="card-thumb">${c.emoji||"🃏"}</div>
    <div><div class="card-name">${c.name}</div><div class="meta">${c.set} • ${c.number}</div><div class="meta">${c.language} • ${c.variant}</div><span class="pill ${c.status==="trade"?"trade":""}">${c.status==="trade"?"SCAMBIO":"TENGO"}</span></div>
    <div class="price">${euro(robustEstimate(c.sources||[]))}<div class="meta">Stima HAVE</div></div>
  </button>`;
}
function bindCardClicks(){
  document.querySelectorAll("[data-card]").forEach(el=>el.onclick=()=>showDetail(el.dataset.card))
}
function renderAll(){
  document.getElementById("portfolioValue").textContent=euro(portfolio());
  document.getElementById("collectionCount").textContent=`${collection.length} carte`;
  document.getElementById("homeCards").innerHTML=collection.slice(0,3).map(cardRow).join("")||empty();
  const current=document.querySelector(".chip.active")?.dataset.filter||"all";
  renderCollection(current);
  bindCardClicks()
}
function renderCollection(filter="all"){
  const cards=collection.filter(c=>filter==="all"||c.status===filter);
  document.getElementById("collectionList").innerHTML=cards.map(cardRow).join("")||empty();
  bindCardClicks()
}
function empty(){return '<div class="empty-card"><strong>Nessuna carta ancora.</strong><p>Scansiona una pagina per iniziare.</p></div>'}

function navigate(view){
  previousView=document.querySelector(".view.active")?.id?.replace("View","")||"home";
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(view+"View").classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
  document.body.classList.toggle("scanner-mode",view==="scan");
  window.scrollTo({top:0,behavior:"instant"});
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{
  const view=b.dataset.view;
  navigate(view);
  if(view==="scan") setTimeout(openLiveCamera,0);
}));

document.querySelectorAll(".chip").forEach(chip=>chip.onclick=()=>{
  document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));chip.classList.add("active");renderCollection(chip.dataset.filter)
});

function handlePhoto(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const original=e.target.result;
    const img=new Image();
    img.onload=()=>{
      const maxSide=1600;
      const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      currentImageDataUrl=canvas.toDataURL("image/jpeg",0.86);
      document.getElementById("scanPreview").src=currentImageDataUrl;
      detected=[];
      lastRecognition=null;
      document.getElementById("detectedCards").innerHTML="";
      document.getElementById("addDetected").classList.add("hidden");
      catalogResults.innerHTML="";
      document.getElementById("recognitionNotice").textContent="Foto pronta. Premi Riconosci carta.";

    document.getElementById("scanResult").classList.remove("hidden");
    cameraPanel.classList.add("hidden");
    cameraFallback.classList.add("hidden");
      bindCardClicks();
      document.getElementById("scanResult").scrollIntoView({behavior:"instant",block:"start"});
    };
    img.onerror=()=>showCameraMessage("Non riesco a leggere questa foto.");
    img.src=original;
  };
  reader.readAsDataURL(file)
}
const cameraInput=document.getElementById("cameraInput");
const galleryInput=document.getElementById("galleryInput");
const openCameraBtn=document.getElementById("openCameraBtn");
const cameraPanel=document.getElementById("cameraPanel");
const cameraFallback=document.getElementById("cameraFallback");
const cameraVideo=document.getElementById("cameraVideo");
const cameraCanvas=document.getElementById("cameraCanvas");
const takePhotoBtn=document.getElementById("takePhotoBtn");
const cameraMessage=document.getElementById("cameraMessage");
const scanCloseBtn=document.getElementById("scanCloseBtn");
const retakeBtn=document.getElementById("retakeBtn");
const analyzeCardBtn=document.getElementById("analyzeCardBtn");
const catalogQuery=document.getElementById("catalogQuery");
const catalogSearchBtn=document.getElementById("catalogSearchBtn");
const catalogResults=document.getElementById("catalogResults");
let cameraStream=null;
let selectedCatalogCard=null;
let lastRecognition=null;
let currentImageDataUrl=null;
const HAVE_API_BASE=(window.HAVE_API_BASE||"https://have-self.vercel.app").replace(/\/$/,"");

function showCameraMessage(text){
  cameraMessage.textContent=text;
  cameraMessage.classList.remove("hidden");
}
function stopCamera(){
  if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}
  cameraVideo.srcObject=null;
}
async function openLiveCamera(){
  document.getElementById("scanResult").classList.add("hidden");
  cameraMessage.classList.add("hidden");
  cameraFallback.classList.add("hidden");
  cameraPanel.classList.remove("hidden");
  if(!navigator.mediaDevices?.getUserMedia){
    cameraPanel.classList.add("hidden");
    cameraFallback.classList.remove("hidden");
    return;
  }
  try{
    stopCamera();
    cameraStream=await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:{ideal:"environment"},
        width:{ideal:1920},
        height:{ideal:1080}
      },
      audio:false
    });
    cameraVideo.srcObject=cameraStream;
    await cameraVideo.play();
  }catch(err){
    cameraPanel.classList.add("hidden");
    cameraFallback.classList.remove("hidden");
    showCameraMessage("Consenti l'accesso alla fotocamera oppure usa il pulsante qui sotto.");
  }
}
openCameraBtn.addEventListener("click",()=>{
  if(navigator.mediaDevices?.getUserMedia) openLiveCamera();
  else cameraInput.click();
});
takePhotoBtn.addEventListener("click",()=>{
  if(!cameraVideo.videoWidth){showCameraMessage("La fotocamera non è ancora pronta.");return}
  cameraCanvas.width=cameraVideo.videoWidth;
  cameraCanvas.height=cameraVideo.videoHeight;
  const ctx=cameraCanvas.getContext("2d");
  ctx.drawImage(cameraVideo,0,0,cameraCanvas.width,cameraCanvas.height);
  cameraCanvas.toBlob(blob=>{
    if(!blob)return;
    const file=new File([blob],"have-scan.jpg",{type:"image/jpeg"});
    stopCamera();
    cameraPanel.classList.add("hidden");
    handlePhoto(file);
  },"image/jpeg",0.94);
});
scanCloseBtn.addEventListener("click",()=>{stopCamera();navigate("home")});
retakeBtn.addEventListener("click",openLiveCamera);
cameraInput.addEventListener("change",e=>handlePhoto(e.target.files[0]));
galleryInput.addEventListener("change",e=>{
  stopCamera();
  cameraPanel.classList.add("hidden");
  handlePhoto(e.target.files[0]);
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&cameraStream)stopCamera()});

analyzeCardBtn.addEventListener("click",async()=>{
  const notice=document.getElementById("recognitionNotice");
  if(!currentImageDataUrl){
    notice.textContent="Prima scatta o scegli una foto.";
    return;
  }
  analyzeCardBtn.disabled=true;
  analyzeCardBtn.textContent="Riconoscimento in corso…";
  notice.textContent="Sto leggendo nome, set, numero, lingua e variante dalla foto.";
  try{
    const endpoint=HAVE_API_BASE+"/api/recognize";
    const res=await fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({image:currentImageDataUrl})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||"Servizio di riconoscimento non disponibile");
    const r=data.recognition||{};
    lastRecognition=r;
    const provisionalVariant=[r.finish,r.variant,r.stamp,r.stamp_text,r.edition,r.promo].filter(Boolean).join(" • ")||"Da verificare";
    const provisional={
      id:"vision-"+Date.now(),
      name:r.name||"Carta Pokémon",
      set:r.set||"Espansione da verificare",
      setCode:r.set_code||"",
      number:r.number||((r.number_candidates&&r.number_candidates[0])||"—"),
      rarity:r.rarity||"—",
      language:r.language||"Da confermare",
      finish:r.finish||null,
      stamp:r.stamp||null,
      stampText:r.stamp_text||null,
      edition:r.edition||null,
      promo:r.promo||null,
      specialMarkings:r.special_markings||[],
      variant:provisionalVariant,
      status:"keep",
      emoji:"🃏",
      image:currentImageDataUrl||"",
      sources:[],
      recognitionConfidence:Number(r.confidence)||null,
      exactVariantConfidence:Number(r.exact_variant_confidence)||null,
      catalogVerified:false,
      updated:"Riconoscimento visivo"
    };
    detected=[provisional];
    document.getElementById("detectedCards").innerHTML=realCardRow(provisional);
    document.getElementById("addDetected").classList.add("hidden");
    const confidence=Math.round((Number(r.confidence)||0)*100);
    const details=[r.language,r.finish,r.stamp||r.stamp_text,r.edition,r.promo].filter(Boolean).join(" • ");
    const uncertain=r.needs_confirmation===true||String(r.needs_confirmation).toLowerCase()==="true";
    notice.textContent="Riconoscimento: "+(r.name||"carta non certa")+(r.number?" • "+r.number:"")+(confidence?" • "+confidence+"%":"")+(details?"\n"+details:"")+(uncertain&&r.confirmation_reason?"\nDa confermare: "+r.confirmation_reason:"")+". Verifico nel catalogo Pokémon…";
    catalogQuery.value=r.name||"";
    await searchCatalog(r);
  }catch(err){
    notice.textContent="Errore riconoscimento: "+(err&&err.message?err.message:"errore sconosciuto");
    catalogQuery.focus();
  }finally{
    analyzeCardBtn.disabled=false;
    analyzeCardBtn.textContent="Riconosci carta";
  }
});

function tcgdexImage(url){ return url ? url + "/high.webp" : ""; }

function tcgdexPriceValue(v){
  if(v===null || v===undefined || v==="") return null;
  const n=Number(v);
  return Number.isFinite(n) && n>0 ? n : null;
}

let usdEurCache={rate:null,ts:0};
async function usdToEurRate(){
  const now=Date.now();
  if(usdEurCache.rate && now-usdEurCache.ts<3600000) return usdEurCache.rate;
  try{
    const res=await fetch(HAVE_API_BASE+"/api/fx");
    if(!res.ok) throw new Error("FX unavailable");
    const data=await res.json();
    const rate=Number(data?.rate);
    if(Number.isFinite(rate)&&rate>0){
      usdEurCache={rate,ts:now};
      return rate;
    }
  }catch(e){}
  return null;
}

async function priceSourcesFromTcgdex(c, recognition=null){
  const sources=[];
  const p=c&&c.pricing?c.pricing:{};
  const cm=p.cardmarket||null;
  const tp=p.tcgplayer||null;
  const finish=String((recognition&&recognition.finish)||"").toLowerCase();
  const wantsHolo=/holo|foil|textured/.test(finish);

  if(cm){
    const raw=wantsHolo
      ? (cm["trend-holo"] ?? cm["avg7-holo"] ?? cm["avg-holo"] ?? cm["low-holo"] ?? cm.trend ?? cm.avg7 ?? cm.avg ?? cm.low)
      : (cm.trend ?? cm.avg7 ?? cm.avg ?? cm.low);
    const value=tcgdexPriceValue(raw);
    if(value!==null){
      sources.push({
        name:"Cardmarket",
        value,
        currency:"EUR",
        originalValue:value,
        originalCurrency:"EUR",
        updated:cm.updated||null
      });
    }
  }

  if(tp){
    const variant=wantsHolo
      ? (tp.holofoil || tp["reverse-holofoil"] || tp["1st-edition-holofoil"] || tp["unlimited-holofoil"] || tp.normal || tp.unlimited || tp["1st-edition"])
      : (tp.normal || tp.unlimited || tp["1st-edition"] || tp.holofoil || tp["reverse-holofoil"]);
    if(variant){
      const usd=tcgdexPriceValue(variant.marketPrice ?? variant.midPrice ?? variant.lowPrice);
      if(usd!==null){
        const rate=await usdToEurRate();
        if(rate!==null){
          sources.push({
            name:"TCGplayer",
            value:usd*rate,
            currency:"EUR",
            originalValue:usd,
            originalCurrency:"USD",
            fxRate:rate,
            updated:tp.updated||null
          });
        }else{
          sources.push({
            name:"TCGplayer",
            value:null,
            currency:"USD",
            originalValue:usd,
            originalCurrency:"USD",
            updated:tp.updated||null
          });
        }
      }
    }
  }
  return sources;
}
function latestPriceUpdate(sources){
  const ts=sources.map(s=>Number(s.updated)).filter(Number.isFinite);
  if(!ts.length) return "Prezzi live";
  const max=Math.max(...ts);
  const ms=max<1e12?max*1000:max;
  try{return new Intl.DateTimeFormat("it-IT",{dateStyle:"short",timeStyle:"short"}).format(new Date(ms));}
  catch(e){return "Prezzi live";}
}

async function searchCatalog(recognition=null){
  const q=(recognition&&recognition.name?recognition.name:catalogQuery.value).trim();
  if(q.length<2){catalogResults.innerHTML='<div class="catalog-status">Scrivi almeno 2 caratteri.</div>';return;}
  catalogResults.innerHTML='<div class="catalog-status">Ricerca nel catalogo…</div>';
  try{
    async function fetchCatalog(locale){
      const urls=[];
      if(recognition&&recognition.number){
        const localId=String(recognition.number).split("/")[0];
        urls.push("https://api.tcgdex.net/v2/"+locale+"/cards?localId="+encodeURIComponent(localId)+"&pagination:itemsPerPage=100");
      }
      urls.push("https://api.tcgdex.net/v2/"+locale+"/cards?name="+encodeURIComponent(q)+"&pagination:itemsPerPage=100");

      const merged=new Map();
      for(const url of urls){
        const res=await fetch(url,{headers:{"Accept":"application/json"}});
        if(!res.ok) continue;
        const cards=await res.json();
        if(Array.isArray(cards)){
          cards.forEach(c=>merged.set(c.id,{...c,_locale:locale}));
        }
      }
      return [...merged.values()];
    }
    let list=await fetchCatalog("it");
    if(!list.length) list=await fetchCatalog("en");
    list=list.slice(0,100);
    let exact=[];
    if(recognition){
      const rawNumbers=[
        ...(Array.isArray(recognition.number_candidates)?recognition.number_candidates:[]),
        recognition.number
      ].filter(Boolean);
      const wantedNumbers=[...new Set(rawNumbers.map(n=>String(n).split("/")[0].replace(/^0+/,"")))];
      exact=list.filter(c=>wantedNumbers.includes(String(c.localId||"").replace(/^0+/,"")));
      if(exact.length) list=[...exact,...list.filter(c=>!exact.includes(c))];
    }
    list=list.slice(0,20);
    if(!list.length){
      catalogResults.innerHTML='<div class="catalog-status">Nessuna corrispondenza nel catalogo. Puoi comunque aggiungere la carta riconosciuta e verificarla dopo.</div>';
      document.getElementById("addDetected").classList.remove("hidden");
      bindCardClicks();
      return;
    }
    if(recognition && exact.length===1 && recognition.needs_confirmation!==true && String(recognition.needs_confirmation).toLowerCase()!=="true"){
      catalogResults.innerHTML='<div class="catalog-status success">Corrispondenza esatta trovata. Carico la carta…</div>';
      await loadCatalogCard(exact[0].id,exact[0]._locale||"it");
      return;
    }
    catalogResults.innerHTML=list.map(c=>'<button class="catalog-card" type="button" data-catalog-id="'+c.id+'" data-catalog-locale="'+(c._locale||"it")+'"><img src="'+tcgdexImage(c.image)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"><div><strong>'+(c.name||"Carta Pokémon")+'</strong><div class="meta">Numero '+(c.localId||"—")+'</div><div class="catalog-id">Codice catalogo '+c.id+'</div></div><span>›</span></button>').join("");
    catalogResults.querySelectorAll("[data-catalog-id]").forEach(btn=>btn.addEventListener("click",()=>loadCatalogCard(btn.dataset.catalogId,btn.dataset.catalogLocale||"it")));
    document.getElementById("addDetected").classList.remove("hidden");
    bindCardClicks();
  }catch(err){catalogResults.innerHTML='<div class="catalog-status error">Non riesco a collegarmi al catalogo. Riprova.</div>';}
}

async function fetchDirectCardmarketPrice(card){
  try{
    const res=await fetch(HAVE_API_BASE+"/api/cardmarket-price",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        name:card.name,
        number:card.number,
        set:card.set,
        setCode:card.setCode,
        finish:card.finish,
        idProduct:card.idProduct||null
      })
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok || !data.match) return null;
    return {
      name:"Cardmarket",
      value:Number(data.match.value),
      currency:"EUR",
      originalValue:Number(data.match.value),
      originalCurrency:"EUR",
      updated:data.match.createdAt||null,
      details:{
        trend:data.match.trend,
        avg7:data.match.avg7,
        avg30:data.match.avg30,
        low:data.match.low,
        idProduct:data.match.idProduct
      }
    };
  }catch(e){
    return null;
  }
}

async function loadCatalogCard(id,locale="it"){
  catalogResults.innerHTML='<div class="catalog-status">Carico carta e prezzi…</div>';
  try{
    let res=await fetch("https://api.tcgdex.net/v2/"+locale+"/cards/"+encodeURIComponent(id));
    if(!res.ok && locale!=="en") res=await fetch("https://api.tcgdex.net/v2/en/cards/"+encodeURIComponent(id));
    if(!res.ok) throw new Error("Carta non disponibile");
    const c=await res.json();
    let sources=await priceSourcesFromTcgdex(c,lastRecognition);
    const directCm=await fetchDirectCardmarketPrice({
      name:c.name||lastRecognition?.name,
      number:(c.localId||lastRecognition?.number||""),
      set:(c.set&&c.set.name)||lastRecognition?.set,
      setCode:(c.set&&c.set.id)||lastRecognition?.set_code,
      finish:lastRecognition?.finish,
      idProduct:c?.pricing?.cardmarket?.idProduct||null
    });
    sources=sources.filter(s=>s.name!=="Cardmarket");
    if(directCm && Number.isFinite(directCm.value) && directCm.value>0) sources.unshift(directCm);
    const priceUpdated=latestPriceUpdate(sources);
    const total=(c.set&&c.set.cardCount&&(c.set.cardCount.official||c.set.cardCount.total))||"";
    const r=lastRecognition||{};
    const variantParts=[r.finish,r.variant,r.stamp,r.stamp_text,r.edition,r.promo].filter(Boolean);
    selectedCatalogCard={
      id:"tcgdex-"+c.id+"-"+Date.now(),
      catalogId:c.id,
      cardmarketIdProduct:c?.pricing?.cardmarket?.idProduct||null,
      name:c.name||r.name||"Carta Pokémon",
      set:(c.set&&c.set.name)||r.set||"Set sconosciuto",
      setCode:(c.set&&c.set.id)||"",
      number:total?(c.localId+"/"+total):(c.localId||r.number||"—"),
      rarity:c.rarity||r.rarity||"—",
      language:r.language||"Da confermare",
      finish:r.finish||null,
      stamp:r.stamp||null,
      stampText:r.stamp_text||null,
      edition:r.edition||null,
      promo:r.promo||null,
      specialMarkings:Array.isArray(r.special_markings)?r.special_markings:[],
      variant:variantParts.length?variantParts.join(" • "):"Da confermare",
      status:"keep",
      emoji:"🃏",
      image:tcgdexImage(c.image),
      sources,
      recognitionConfidence:Number(r.confidence)||null,
      catalogVerified:true,
      updated:priceUpdated
    };
    detected=[selectedCatalogCard];
    document.getElementById("detectedCards").innerHTML=realCardRow(selectedCatalogCard);
    document.getElementById("addDetected").classList.remove("hidden");
    catalogResults.innerHTML='<div class="catalog-status success">Carta verificata nel catalogo. Ora puoi aggiungerla alla collezione.</div>';
    bindCardClicks();
    document.getElementById("detectedCards").scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){
    catalogResults.innerHTML='<div class="catalog-status error">Non riesco a caricare questa carta. Puoi aggiungerla come DA VERIFICARE.</div>';
    document.getElementById("addDetected").classList.remove("hidden");
    if(detected[0]) detected[0].catalogVerified=false;
  }
}

async function enrichSavedCardPrices(card){
  try{
    const q=String(card.name||"").trim();
    if(q.length<2) return card;
    async function search(locale){
      const url="https://api.tcgdex.net/v2/"+locale+"/cards?name="+encodeURIComponent(q)+"&pagination:itemsPerPage=50";
      const res=await fetch(url,{headers:{"Accept":"application/json"}});
      if(!res.ok) return [];
      const list=await res.json();
      return Array.isArray(list)?list.map(x=>({...x,_locale:locale})):[];
    }
    let list=await search("it");
    if(!list.length) list=await search("en");
    const wanted=String(card.number||"").split("/")[0].replace(/^0+/,"");
    let exact=list.filter(x=>String(x.localId||"").replace(/^0+/,"")===wanted);
    if(!exact.length) return card;
    let candidate=exact[0];
    if(exact.length>1 && card.setCode){
      const sc=String(card.setCode).toLowerCase();
      candidate=exact.find(x=>String(x.id||"").toLowerCase().includes(sc))||candidate;
    }
    let res=await fetch("https://api.tcgdex.net/v2/"+(candidate._locale||"it")+"/cards/"+encodeURIComponent(candidate.id));
    if(!res.ok && candidate._locale!=="en") res=await fetch("https://api.tcgdex.net/v2/en/cards/"+encodeURIComponent(candidate.id));
    if(!res.ok) return card;
    const full=await res.json();
    const recognition={finish:card.finish||card.variant||"",language:card.language,number:card.number,name:card.name,set:card.set,set_code:card.setCode};
    let sources=await priceSourcesFromTcgdex(full,recognition);
    const directCm=await fetchDirectCardmarketPrice({name:full.name||card.name,number:full.localId||card.number,set:(full.set&&full.set.name)||card.set,setCode:(full.set&&full.set.id)||card.setCode,finish:card.finish||card.variant,idProduct:full?.pricing?.cardmarket?.idProduct||card.cardmarketIdProduct||null});
    sources=sources.filter(s=>s.name!=="Cardmarket");
    if(directCm && Number.isFinite(directCm.value) && directCm.value>0) sources.unshift(directCm);
    const total=(full.set&&full.set.cardCount&&(full.set.cardCount.official||full.set.cardCount.total))||"";
    const updatedCard={...card,catalogId:full.id||candidate.id,cardmarketIdProduct:full?.pricing?.cardmarket?.idProduct||card.cardmarketIdProduct||null,set:(full.set&&full.set.name)||card.set,setCode:(full.set&&full.set.id)||card.setCode,number:total?(full.localId+"/"+total):(full.localId||card.number),rarity:full.rarity||card.rarity,image:tcgdexImage(full.image)||card.image,catalogVerified:true,sources,updated:latestPriceUpdate(sources)};
    const idx=collection.findIndex(x=>x.id===card.id);
    if(idx>=0){collection[idx]=updatedCard;try{localStorage.setItem("have_collection",JSON.stringify(collection))}catch(e){} renderAll();}
    return updatedCard;
  }catch(e){return card;}
}
function realCardRow(c){
  const art=c.image?'<img class="card-thumb real-thumb" src="'+c.image+'" alt="'+c.name+'" onerror="this.style.display=\'none\'">':'<div class="card-thumb">🃏</div>';
  const pending=c.catalogVerified===false;
  return '<button class="card-row" '+(pending?'disabled aria-disabled="true"':'data-card="'+c.id+'"')+' style="width:100%;text-align:left;border-style:solid;'+(pending?'opacity:.82;cursor:default;':'')+'">'+art+'<div><div class="card-name">'+c.name+'</div><div class="meta">'+c.set+' • '+c.number+'</div><div class="meta">Codice espansione: '+(c.setCode||"—")+'</div><div class="meta">'+c.language+' • '+c.rarity+'</div><div class="meta">'+(c.variant||"Variante da confermare")+'</div><span class="pill">'+(c.catalogVerified===false?"DA VERIFICARE":"CATALOGO REALE")+'</span></div><div class="price">'+((c.sources&&c.sources.length)?euro(robustEstimate(c.sources))+'<div class="meta">Stima HAVE</div>':'<span class="meta">Prezzo<br>da verificare</span>')+'</div></button>';
}

catalogSearchBtn.addEventListener("click",searchCatalog);
catalogQuery.addEventListener("keydown",e=>{if(e.key==="Enter")searchCatalog();});

document.getElementById("addDetected").onclick=()=>{
  const existing=new Set(collection.map(c=>c.id));
  collection=[...collection,...detected.filter(c=>!existing.has(c.id))];
  save();navigate("collection")
};

async function showDetail(id){
  let c=[...collection,...detected].find(x=>x.id===id);if(!c)return;
  previousView=document.querySelector(".view.active")?.id?.replace("View","")||"home";
  function renderDetail(card,loading){
    const sourceLines=(card.sources||[]).map(s=>{
      const original=(s.originalCurrency==="USD"&&Number.isFinite(s.originalValue))?" ($"+s.originalValue.toFixed(2)+" → EUR)":"";
      const val=Number.isFinite(s.value)?euro(s.value):"Cambio EUR non disponibile";
      return '<div class="market-line"><span>'+s.name+original+'</span><strong>'+val+'</strong></div>';
    }).join("");
    const estimate=robustEstimate(card.sources||[]);
    const art=card.image?'<img class="real-thumb" src="'+card.image+'" alt="">':(card.emoji||"🃏");
    const marks=card.specialMarkings&&card.specialMarkings.length?'<div class="meta">Segni speciali: '+card.specialMarkings.join(", ")+'</div>':"";
    const note=loading?"Sto verificando automaticamente catalogo e prezzi.":((card.sources||[]).length?"Ultimo aggiornamento: "+(card.updated||"—")+". Fonti mancanti escluse dalla Stima HAVE.":"Prezzo non ancora disponibile per questa variante.");
    document.getElementById("cardDetail").innerHTML='<div class="detail-card">'+
      '<div class="detail-head"><div class="detail-art">'+art+'</div><div class="detail-info">'+
      '<h2>'+card.name+'</h2><div class="meta">'+card.set+' ('+(card.setCode||"—")+')</div><div class="meta">N. '+card.number+'</div><div class="meta">'+card.rarity+' • '+card.language+'</div><div class="meta">'+(card.variant||"Variante da confermare")+'</div>'+marks+
      '<span class="pill '+(card.status==="trade"?"trade":"")+'">'+(card.status==="trade"?"DISPONIBILE PER SCAMBIO":"COLLEZIONE")+'</span></div></div>'+
      '<div class="market-box"><strong>Valori di mercato</strong>'+(loading?'<div class="market-line"><span>Aggiornamento prezzi</span><strong>in corso…</strong></div>':sourceLines)+
      '<div class="market-line estimate"><span>Stima HAVE</span><span>'+(estimate>0?euro(estimate):"—")+'</span></div><div class="source-note">'+note+'</div></div></div>';
  }
  const hasAnyPrice=(c.sources||[]).some(s=>Number.isFinite(s.value)&&s.value>0);
  const needsFx=(c.sources||[]).some(s=>s.name==="TCGplayer"&&s.originalCurrency==="USD"&&Number.isFinite(s.originalValue)&&!Number.isFinite(s.value));
  const needsRefresh=!hasAnyPrice||needsFx;
  renderDetail(c,needsRefresh);
  navigate("detail");
  if(needsRefresh){c=await enrichSavedCardPrices(c);renderDetail(c,false);}
}
document.getElementById("backBtn").onclick=()=>navigate(previousView==="detail"?"home":previousView);
document.getElementById("refreshValues").onclick=async()=>{
  const delta=document.getElementById("portfolioDelta");
  delta.textContent="Aggiornamento prezzi in corso…";
  let updated=0;
  for(const card of [...collection]){
    const before=robustEstimate(card.sources||[]);
    const refreshed=await enrichSavedCardPrices(card);
    const after=robustEstimate(refreshed.sources||[]);
    if(after>0 && after!==before) updated++;
  }
  delta.textContent=updated?("Aggiornati "+updated+" valori • fonti reali"):"Valori controllati • nessun nuovo prezzo";
};
renderAll();