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
  window.scrollTo({top:0,behavior:"smooth"})
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));

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
    bindCardClicks()
  };
  reader.readAsDataURL(file)
}
const cameraInput=document.getElementById("cameraInput");
const galleryInput=document.getElementById("galleryInput");
const openCameraBtn=document.getElementById("openCameraBtn");
const cameraPanel=document.getElementById("cameraPanel");
const cameraVideo=document.getElementById("cameraVideo");
const cameraCanvas=document.getElementById("cameraCanvas");
const takePhotoBtn=document.getElementById("takePhotoBtn");
const closeCameraBtn=document.getElementById("closeCameraBtn");
const cameraMessage=document.getElementById("cameraMessage");
let cameraStream=null;

function showCameraMessage(text){
  cameraMessage.textContent=text;
  cameraMessage.classList.remove("hidden");
}
function stopCamera(){
  if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}
  cameraVideo.srcObject=null;
  cameraPanel.classList.add("hidden");
}
async function openLiveCamera(){
  cameraMessage.classList.add("hidden");
  if(!navigator.mediaDevices?.getUserMedia){
    cameraInput.click();
    return;
  }
  try{
    cameraStream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:"environment"}},
      audio:false
    });
    cameraVideo.srcObject=cameraStream;
    cameraPanel.classList.remove("hidden");
    await cameraVideo.play();
  }catch(err){
    showCameraMessage("Non riesco ad aprire la fotocamera direttamente. Provo con la fotocamera di iPhone.");
    cameraInput.click();
  }
}
openCameraBtn.addEventListener("click",openLiveCamera);
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
    handlePhoto(file);
  },"image/jpeg",0.92);
});
closeCameraBtn.addEventListener("click",stopCamera);
cameraInput.addEventListener("change",e=>handlePhoto(e.target.files[0]));
galleryInput.addEventListener("change",e=>handlePhoto(e.target.files[0]));
document.addEventListener("visibilitychange",()=>{if(document.hidden&&cameraStream)stopCamera()});
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