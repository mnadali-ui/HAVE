const demoCards=[
{id:"sv3-125",name:"Charizard ex",set:"Ossidiana Infuocata",setCode:"SV3",number:"125/197",rarity:"Double Rare",language:"ITA",variant:"Holo",status:"keep",emoji:"🔥",sources:[{name:"Cardmarket",value:42.8},{name:"TCGplayer",value:45.1}],updated:"Oggi"},
{id:"sv2-151",name:"Mew ex",set:"Pokémon 151",setCode:"MEW",number:"151/165",rarity:"Ultra Rare",language:"ITA",variant:"Holo",status:"trade",emoji:"✨",sources:[{name:"Cardmarket",value:18.9},{name:"TCGplayer",value:20.4}],updated:"Oggi"},
{id:"sv1-025",name:"Pikachu",set:"Scarlatto e Violetto",setCode:"SV1",number:"025/198",rarity:"Common",language:"ITA",variant:"Reverse",status:"trade",emoji:"⚡",sources:[{name:"Cardmarket",value:2.4},{name:"TCGplayer",value:2.8}],updated:"Oggi"}
];

function robustEstimate(sources){
  const vals=sources.map(s=>s.value).filter(Number.isFinite).sort((a,b)=>a-b);
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
    document.getElementById("scanPreview").src=e.target.result;
    detected=[
      {...demoCards[0],id:"scan-"+Date.now()+"-1",status:"keep"},
      {...demoCards[1],id:"scan-"+Date.now()+"-2",status:"trade"},
      {...demoCards[2],id:"scan-"+Date.now()+"-3",status:"trade"},
      {id:"scan-"+Date.now()+"-4",name:"Gengar",set:"Fiamme Oscure",setCode:"DEMO",number:"057/100",rarity:"Rare",language:"ITA",variant:"Holo",status:"keep",emoji:"👻",sources:[{name:"Cardmarket",value:8.7},{name:"TCGplayer",value:9.4}],updated:"Oggi"},
      {id:"scan-"+Date.now()+"-5",name:"Eevee",set:"Evoluzioni Prismatiche",setCode:"PRE",number:"074/131",rarity:"Common",language:"ITA",variant:"Reverse",status:"trade",emoji:"🦊",sources:[{name:"Cardmarket",value:4.6},{name:"TCGplayer",value:5.1}],updated:"Oggi"},
      {id:"scan-"+Date.now()+"-6",name:"Lucario ex",set:"Destini di Paldea",setCode:"PAF",number:"081/091",rarity:"Ultra Rare",language:"ITA",variant:"Holo",status:"keep",emoji:"🥊",sources:[{name:"Cardmarket",value:7.2},{name:"TCGplayer",value:7.8}],updated:"Oggi"},
      {id:"scan-"+Date.now()+"-7",name:"Greninja ex",set:"Crepuscolo Mascherato",setCode:"TWM",number:"106/167",rarity:"Double Rare",language:"ITA",variant:"Holo",status:"trade",emoji:"💧",sources:[{name:"Cardmarket",value:6.1},{name:"TCGplayer",value:6.6}],updated:"Oggi"},
      {id:"scan-"+Date.now()+"-8",name:"Mewtwo",set:"Pokémon 151",setCode:"MEW",number:"150/165",rarity:"Rare",language:"ITA",variant:"Holo",status:"keep",emoji:"🧬",sources:[{name:"Cardmarket",value:3.8},{name:"TCGplayer",value:4.2}],updated:"Oggi"},
      {id:"scan-"+Date.now()+"-9",name:"Snorlax",set:"Pokémon 151",setCode:"MEW",number:"143/165",rarity:"Uncommon",language:"ITA",variant:"Reverse",status:"trade",emoji:"💤",sources:[{name:"Cardmarket",value:2.1},{name:"TCGplayer",value:2.5}],updated:"Oggi"}
    ];
    document.getElementById("detectedCards").innerHTML=detected.map(cardRow).join("");
    document.getElementById("scanResult").classList.remove("hidden");
    cameraPanel.classList.add("hidden");
    cameraFallback.classList.add("hidden");
    bindCardClicks();
    document.getElementById("scanResult").scrollIntoView({behavior:"instant",block:"start"})
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

analyzeCardBtn.addEventListener("click",()=>{
  const notice=document.getElementById("recognitionNotice");
  notice.textContent="Per questa versione conferma la carta nel catalogo reale qui sotto.";
  catalogQuery.focus();
  catalogQuery.scrollIntoView({behavior:"smooth",block:"center"});
});

function tcgdexImage(url){ return url ? url + "/high.webp" : ""; }

async function searchCatalog(){
  const q=catalogQuery.value.trim();
  if(q.length<2){catalogResults.innerHTML='<div class="catalog-status">Scrivi almeno 2 caratteri.</div>';return;}
  catalogResults.innerHTML='<div class="catalog-status">Ricerca nel catalogo…</div>';
  try{
    const url="https://api.tcgdex.net/v2/it/cards?name="+encodeURIComponent(q)+"&pagination:itemsPerPage=20";
    const res=await fetch(url,{headers:{"Accept":"application/json"}});
    if(!res.ok) throw new Error("Catalogo non disponibile");
    const cards=await res.json();
    const list=Array.isArray(cards)?cards.slice(0,20):[];
    if(!list.length){catalogResults.innerHTML='<div class="catalog-status">Nessuna carta trovata.</div>';return;}
    catalogResults.innerHTML=list.map(c=>'<button class="catalog-card" type="button" data-catalog-id="'+c.id+'"><img src="'+tcgdexImage(c.image)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"><div><strong>'+(c.name||"Carta Pokémon")+'</strong><div class="meta">Numero '+(c.localId||"—")+'</div><div class="catalog-id">'+c.id+'</div></div><span>›</span></button>').join("");
    catalogResults.querySelectorAll("[data-catalog-id]").forEach(btn=>btn.addEventListener("click",()=>loadCatalogCard(btn.dataset.catalogId)));
  }catch(err){catalogResults.innerHTML='<div class="catalog-status error">Non riesco a collegarmi al catalogo. Riprova.</div>';}
}

async function loadCatalogCard(id){
  catalogResults.innerHTML='<div class="catalog-status">Carico i dettagli…</div>';
  try{
    const res=await fetch("https://api.tcgdex.net/v2/it/cards/"+encodeURIComponent(id));
    if(!res.ok) throw new Error("Carta non disponibile");
    const c=await res.json();
    const total=(c.set&&c.set.cardCount&&(c.set.cardCount.official||c.set.cardCount.total))||"";
    selectedCatalogCard={id:"tcgdex-"+c.id,catalogId:c.id,name:c.name||"Carta Pokémon",set:(c.set&&c.set.name)||"Set sconosciuto",setCode:(c.set&&c.set.id)||"",number:total?(c.localId+"/"+total):(c.localId||"—"),rarity:c.rarity||"—",language:"ITA",variant:"Da confermare",status:"keep",emoji:"🃏",image:tcgdexImage(c.image),sources:[],updated:"Catalogo live"};
    detected=[selectedCatalogCard];
    document.getElementById("detectedCards").innerHTML=realCardRow(selectedCatalogCard);
    document.getElementById("addDetected").classList.remove("hidden");
    catalogResults.innerHTML='<div class="catalog-status success">Carta selezionata dal catalogo reale.</div>';
    bindCardClicks();
    document.getElementById("detectedCards").scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){catalogResults.innerHTML='<div class="catalog-status error">Non riesco a caricare questa carta.</div>';}
}

function realCardRow(c){
  const art=c.image?'<img class="card-thumb real-thumb" src="'+c.image+'" alt="'+c.name+'" onerror="this.style.display=\'none\'">':'<div class="card-thumb">🃏</div>';
  return '<button class="card-row" data-card="'+c.id+'" style="width:100%;text-align:left;border-style:solid">'+art+'<div><div class="card-name">'+c.name+'</div><div class="meta">'+c.set+' • '+c.number+'</div><div class="meta">'+c.language+' • '+c.rarity+'</div><span class="pill">CATALOGO REALE</span></div><div class="price"><span class="meta">Prezzo<br>da collegare</span></div></button>';
}

catalogSearchBtn.addEventListener("click",searchCatalog);
catalogQuery.addEventListener("keydown",e=>{if(e.key==="Enter")searchCatalog();});

document.getElementById("addDetected").onclick=()=>{
  const existing=new Set(collection.map(c=>c.id));
  collection=[...collection,...detected.filter(c=>!existing.has(c.id))];
  save();navigate("collection")
};

function showDetail(id){
  const c=[...collection,...detected].find(x=>x.id===id);if(!c)return;
  previousView=document.querySelector(".view.active")?.id?.replace("View","")||"home";
  document.getElementById("cardDetail").innerHTML=`<div class="detail-card">
    <div class="detail-head"><div class="detail-art">${c.emoji||"🃏"}</div><div class="detail-info">
      <h2>${c.name}</h2><div class="meta">${c.set} (${c.setCode})</div><div class="meta">N. ${c.number}</div><div class="meta">${c.rarity} • ${c.language} • ${c.variant}</div>
      <span class="pill ${c.status==="trade"?"trade":""}">${c.status==="trade"?"DISPONIBILE PER SCAMBIO":"COLLEZIONE"}</span>
    </div></div>
    <div class="market-box">
      <strong>Valori di mercato</strong>
      ${(c.sources||[]).map(s=>`<div class="market-line"><span>${s.name}</span><strong>${euro(s.value)}</strong></div>`).join("")}
      <div class="market-line estimate"><span>Stima HAVE</span><span>${euro(robustEstimate(c.sources||[]))}</span></div>
      <div class="source-note">Ultimo aggiornamento: ${c.updated||"—"}. I valori mostrati in questa versione sono demo. L'integrazione reale userà fonti legittime e mostrerà sempre provenienza e timestamp.</div>
    </div>
  </div>`;
  navigate("detail")
}
document.getElementById("backBtn").onclick=()=>navigate(previousView==="detail"?"home":previousView);
document.getElementById("refreshValues").onclick=()=>{
  document.getElementById("portfolioDelta").textContent="Aggiornamento valori eseguito • demo";
  setTimeout(()=>document.getElementById("portfolioDelta").textContent="Stima demo • aggiornamento giornaliero previsto",2200)
};
renderAll();