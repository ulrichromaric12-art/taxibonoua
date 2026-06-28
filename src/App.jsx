import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL  = "https://usinhlxehcaiqvyyqixq.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaW5obHhlaGNhaXF2eXlxaXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDE1NzMsImV4cCI6MjA5ODA3NzU3M30.eXPpIbjJqfaaFljM-dlJ-yAVe1PKy1AIVXs7jEkkVFc";

// Supabase client léger sans dépendance externe
const sb = {
  headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
  from: (table) => ({
    select: async (cols="*", filter="") => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}${filter}`, { headers: sb.headers });
      return { data: await r.json(), error: r.ok ? null : "err" };
    },
    insert: async (body) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method:"POST", headers:{...sb.headers,"Prefer":"return=representation"}, body: JSON.stringify(body) });
      return { data: await r.json(), error: r.ok ? null : "err" };
    },
    update: async (body, filter="") => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { method:"PATCH", headers:{...sb.headers,"Prefer":"return=representation"}, body: JSON.stringify(body) });
      return { data: await r.json(), error: r.ok ? null : "err" };
    },
    delete: async (filter="") => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { method:"DELETE", headers: sb.headers });
      return { error: r.ok ? null : "err" };
    },
  }),
  auth: {
    signIn: async (email, password) => {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_ANON}, body: JSON.stringify({email,password}) });
      const d = await r.json();
      if(d.access_token){ localStorage.setItem("tb_token", d.access_token); return { user: d.user, error: null }; }
      return { user: null, error: d.error_description || "Erreur" };
    },
    signOut: () => { localStorage.removeItem("tb_token"); },
    getUser: () => { const t = localStorage.getItem("tb_token"); return t ? {token:t} : null; },
  }
};

const C = {
  brand:"#00C853", brandDim:"#00C85318", brandBorder:"#00C85340",
  night:"#080C12", card:"#111820", border:"#1E2A38",
  sub:"#8A97AA", muted:"#4A5568",
  white:"#FFFFFF", gold:"#FFB800", goldDim:"#FFB80018",
  danger:"#FF4757", orange:"#FF6B2B", wave:"#0090FF",
};
const PRICE = { total:1000, margin:300, driver:700 };
const ZONES = ["Centre-ville","Marché Central","Gare routière","École Publique","Hôpital","Mairie","Quartier Résidentiel","Carrefour AGIP","Plage","Mosquée Centrale"];
const fcfa  = n => Number(n).toLocaleString("fr-FR") + " FCFA";

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [toast,  setToast]  = useState(null);
  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  useEffect(()=>{ const t=setTimeout(()=>setScreen("home"),2000); return()=>clearTimeout(t); },[]);
  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:C.night,minHeight:"100vh",color:C.white,maxWidth:430,margin:"0 auto"}}>
      <style>{css}</style>
      {toast && <Toast {...toast}/>}
      {screen==="splash"   && <Splash/>}
      {screen==="home"     && <Home     go={setScreen} notify={notify}/>}
      {screen==="client"   && <ClientFlow  go={setScreen} notify={notify}/>}
      {screen==="driver"   && <DriverFlow  go={setScreen} notify={notify}/>}
      {screen==="admin"    && <AdminFlow   go={setScreen} notify={notify}/>}
      {screen==="register" && <RegisterFlow go={setScreen} notify={notify}/>}
    </div>
  );
}

function Splash() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:`radial-gradient(ellipse at 50% 30%,${C.brand}18,transparent 70%),${C.night}`}}>
      <div style={{fontSize:80,filter:`drop-shadow(0 0 32px ${C.brand}60)`,animation:"float 3s ease-in-out infinite"}}>🚕</div>
      <h1 style={{fontSize:40,fontWeight:900,letterSpacing:-1,margin:"18px 0 8px"}}>Taxi<span style={{color:C.brand}}>Bonoua</span></h1>
      <p style={{color:C.sub,fontSize:14,margin:0}}>Bonoua · Côte d'Ivoire</p>
      <div style={{marginTop:52,width:52,height:4,borderRadius:99,background:C.border,overflow:"hidden"}}>
        <div style={{height:"100%",background:C.brand,animation:"loadbar 1.8s linear forwards"}}/>
      </div>
    </div>
  );
}

function Home({ go, notify }) {
  const [stats, setStats] = useState({dispo:0,active:0,done:0});
  useEffect(()=>{
    const load = async () => {
      try {
        const [r1,r2,r3] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/drivers?available=eq.true&approved=eq.true&select=id`, {headers:sb.headers}),
          fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.en%20cours&select=id`, {headers:sb.headers}),
          fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.terminée&select=id`, {headers:sb.headers}),
        ]);
        const [d1,d2,d3] = await Promise.all([r1.json(),r2.json(),r3.json()]);
        setStats({dispo:d1.length||0,active:d2.length||0,done:d3.length||0});
      } catch(e){}
    };
    load();
    const t = setInterval(load, 10000);
    return()=>clearInterval(t);
  },[]);

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:`linear-gradient(160deg,#0A1628,${C.night})`,padding:"52px 24px 36px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:`${C.brand}0E`,filter:"blur(50px)"}}/>
        <div style={{position:"absolute",top:22,right:24,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.brand,animation:"pulse 2s ease-in-out infinite"}}/>
          <span style={{fontSize:11,color:C.brand,fontWeight:700,letterSpacing:2}}>LIVE</span>
        </div>
        <p style={{fontSize:13,color:C.sub,margin:"0 0 6px"}}>Bienvenue sur</p>
        <h1 style={{fontSize:36,fontWeight:900,letterSpacing:-1,margin:"0 0 6px"}}>Taxi<span style={{color:C.brand}}>Bonoua</span></h1>
        <p style={{fontSize:13,color:C.sub,margin:"0 0 24px"}}>Bonoua · Côte d'Ivoire</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Pill icon="🚗" val={stats.dispo}  label="chauffeurs libres" color={C.brand}/>
          <Pill icon="⚡" val={stats.active} label="en cours"          color={C.orange}/>
          <Pill icon="✅" val={stats.done}   label="terminées"         color={C.wave}/>
        </div>
      </div>
      <div style={{padding:"24px 20px",flex:1,display:"flex",flexDirection:"column",gap:14}}>
        <MenuCard emoji="👤" title="Commander un taxi"  sub="Paiement Mobile Money à la fin" tag="1 000 FCFA" tc={C.brand}  bg="linear-gradient(135deg,#081A0E,#040F07)" bd={C.brandBorder} onClick={()=>go("client")}/>
        <MenuCard emoji="🚗" title="Espace Chauffeur"   sub="Voir mes courses · Gérer ma dispo" tag="Chauffeur" tc={C.wave} bg="linear-gradient(135deg,#070F1A,#040810)" bd={`${C.wave}40`}  onClick={()=>go("driver")}/>
        <MenuCard emoji="📊" title="Administration"     sub="Revenus · Chauffeurs · Courses" tag="Admin" tc={C.gold}        bg="linear-gradient(135deg,#140E00,#0A0900)" bd={`${C.gold}35`}  onClick={()=>go("admin")}/>
      </div>
      <div style={{margin:"0 20px 16px"}}>
        <button onClick={()=>go("register")} style={{width:"100%",padding:"13px 0",background:"transparent",border:`1px dashed ${C.border}`,borderRadius:14,color:C.sub,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          🔗 Formulaire inscription chauffeur (lien privé)
        </button>
      </div>
      <p style={{textAlign:"center",padding:"0 0 28px",color:C.muted,fontSize:12,margin:0}}>Wave · Orange Money · MTN Money</p>
    </div>
  );
}

function ClientFlow({ go, notify }) {
  const [step,   setStep]   = useState("form");
  const [form,   setForm]   = useState({name:"",phone:"",from:"",to:""});
  const [method, setMethod] = useState(null);
  const [driver, setDriver] = useState(null);
  const [dots,   setDots]   = useState(0);
  const [busy,   setBusy]   = useState(false);

  useEffect(()=>{
    if(step!=="searching") return;
    const t=setInterval(()=>setDots(d=>(d+1)%4),500);
    return()=>clearInterval(t);
  },[step]);

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const goPayment=()=>{
    if(!form.name||!form.phone||!form.from||!form.to) return notify("Remplis tous les champs","err");
    if(form.from===form.to) return notify("Départ = Destination ?","err");
    setStep("payment");
  };

  const confirm=async()=>{
    if(!method) return notify("Choisis un moyen de paiement","err");
    setStep("searching"); setBusy(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/drivers?available=eq.true&approved=eq.true&select=*&limit=10`,{headers:sb.headers});
      const drivers = await r.json();
      if(!drivers?.length){ setStep("payment"); setBusy(false); return notify("Aucun chauffeur disponible","err"); }
      const d=drivers[Math.floor(Math.random()*drivers.length)];
      await fetch(`${SUPABASE_URL}/rest/v1/orders`,{method:"POST",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({
        client_name:form.name,client_phone:form.phone,from_zone:form.from,to_zone:form.to,
        driver_id:d.id,driver_name:d.full_name,payment_method:method,status:"en cours",
        total:PRICE.total,margin:PRICE.margin,driver_pay:PRICE.driver,
      })});
      await fetch(`${SUPABASE_URL}/rest/v1/drivers?id=eq.${d.id}`,{method:"PATCH",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({available:false})});
      setDriver(d); setStep("found");
    } catch { notify("Erreur réseau","err"); setStep("payment"); }
    setBusy(false);
  };

  const reset=()=>{ setStep("form"); setForm({name:"",phone:"",from:"",to:""}); setMethod(null); setDriver(null); go("home"); };

  const MM=[{id:"wave",label:"Wave",color:C.wave,icon:"〰️"},{id:"orange",label:"Orange Money",color:"#FF6600",icon:"🟠"},{id:"mtn",label:"MTN Money",color:C.gold,icon:"🟡"}];

  return (
    <Wrap>
      <Bar title="Commander un taxi" onBack={reset}/>
      {step==="form"&&<>
        <Box>
          <Fld label="Votre nom complet" icon="👤"><Inp placeholder="Ex : Kouadio Yves" value={form.name} onChange={v=>f("name",v)}/></Fld>
          <Fld label="Numéro Mobile Money" icon="📱"><Inp placeholder="07 00 00 00 00" value={form.phone} onChange={v=>f("phone",v)} type="tel"/></Fld>
          <Fld label="Point de départ" icon="📍"><Sel value={form.from} onChange={v=>f("from",v)} opts={ZONES} ph="Où êtes-vous ?"/></Fld>
          <Fld label="Destination" icon="🏁"><Sel value={form.to} onChange={v=>f("to",v)} opts={ZONES} ph="Où allez-vous ?"/></Fld>
        </Box>
        <PriceBar/>
        <Btn onClick={goPayment}>Continuer →</Btn>
      </>}
      {step==="payment"&&<>
        <Box title="Récapitulatif">
          <Row l="Client" v={form.name}/><Row l="De" v={form.from}/><Row l="Vers" v={form.to}/><Row l="Prix" v={fcfa(PRICE.total)} hi/>
        </Box>
        <Box title="Mode de paiement">
          <p style={{fontSize:12,color:C.sub,margin:"0 0 14px"}}>Vous payez <strong style={{color:C.white}}>1 000 FCFA</strong> à la <strong style={{color:C.white}}>fin de la course</strong></p>
          {MM.map(m=>(
            <button key={m.id} onClick={()=>setMethod(m.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",width:"100%",marginBottom:10,cursor:"pointer",background:method===m.id?`${m.color}20`:"#ffffff06",border:`2px solid ${method===m.id?m.color:C.border}`,borderRadius:14,transition:"all .15s"}}>
              <span style={{fontSize:24}}>{m.icon}</span>
              <span style={{fontWeight:700,fontSize:15,color:C.white}}>{m.label}</span>
              {method===m.id&&<span style={{marginLeft:"auto",color:m.color,fontSize:20,fontWeight:900}}>✓</span>}
            </button>
          ))}
        </Box>
        <div style={{display:"flex",gap:10}}>
          <Ghost onClick={()=>setStep("form")}>← Retour</Ghost>
          <Btn onClick={confirm} disabled={busy} style={{flex:1}}>{busy?"...":"Confirmer"}</Btn>
        </div>
      </>}
      {step==="searching"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"62vh",gap:24}}>
          <div style={{position:"relative",width:110,height:110}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid ${C.brand}20`}}/>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid transparent`,borderTopColor:C.brand,animation:"spin 1s linear infinite"}}/>
            <div style={{position:"absolute",inset:16,borderRadius:"50%",background:`${C.brand}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38}}>🚕</div>
          </div>
          <div style={{textAlign:"center"}}>
            <p style={{fontWeight:800,fontSize:22,margin:"0 0 8px"}}>Recherche{".".repeat(dots)}</p>
            <p style={{color:C.sub,fontSize:13,margin:0}}>Nous cherchons le chauffeur le plus proche</p>
          </div>
        </div>
      )}
      {step==="found"&&driver&&<>
        <div style={{background:C.brandDim,border:`1px solid ${C.brandBorder}`,borderRadius:20,padding:22,textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:44}}>✅</div>
          <p style={{fontWeight:900,fontSize:22,color:C.brand,margin:"10px 0 4px"}}>Chauffeur trouvé !</p>
          <p style={{color:C.sub,fontSize:13,margin:0}}>Il arrive dans quelques minutes</p>
        </div>
        <Box>
          <div style={{display:"flex",alignItems:"center",gap:14,paddingBottom:14,marginBottom:4,borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:58,height:58,borderRadius:"50%",background:`${C.brand}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:`2px solid ${C.brandBorder}`,flexShrink:0}}>🧑🏿</div>
            <div>
              <p style={{fontWeight:800,fontSize:18,margin:"0 0 4px"}}>{driver.full_name}</p>
              <p style={{color:C.gold,fontSize:13,margin:0}}>{driver.rating?`★ ${driver.rating}`:"★ Nouveau"} · {driver.zone}</p>
            </div>
          </div>
          <Row l="Départ"   v={form.from}/>
          <Row l="Arrivée"  v={form.to}/>
          <Row l="Paiement" v={{wave:"Wave",orange:"Orange Money",mtn:"MTN Money"}[method]}/>
          <Row l="À payer"  v={fcfa(PRICE.total)} hi/>
          <div style={{marginTop:12,padding:"10px 14px",background:C.goldDim,border:`1px solid ${C.gold}35`,borderRadius:12,fontSize:12,color:C.gold}}>
            💡 Payez <strong>1 000 FCFA</strong> au chauffeur à la fin de la course
          </div>
        </Box>
        <a href={`tel:${driver.phone}`} style={{display:"block",padding:"15px 0",background:C.brand,borderRadius:14,textAlign:"center",textDecoration:"none",color:C.night,fontWeight:800,fontSize:16,marginBottom:10}}>📞 Appeler le chauffeur</a>
        <Ghost onClick={reset}>Nouvelle commande</Ghost>
      </>}
    </Wrap>
  );
}

function DriverFlow({ go, notify }) {
  const [phone,  setPhone]  = useState("");
  const [driver, setDriver] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tab,    setTab]    = useState("active");
  const [busy,   setBusy]   = useState(false);

  const login=async()=>{
    if(!phone.trim()) return notify("Entre ton numéro","err");
    setBusy(true);
    const r=await fetch(`${SUPABASE_URL}/rest/v1/drivers?phone=eq.${encodeURIComponent(phone.trim())}&approved=eq.true&select=*`,{headers:sb.headers});
    const data=await r.json();
    setBusy(false);
    if(!data?.length) return notify("Numéro non reconnu ou compte non approuvé","err");
    setDriver(data[0]); notify("Connecté ✓");
  };

  const loadOrders=useCallback(async()=>{
    if(!driver) return;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/orders?driver_id=eq.${driver.id}&select=*&order=created_at.desc`,{headers:sb.headers});
    setOrders(await r.json()||[]);
  },[driver]);

  useEffect(()=>{ loadOrders(); const t=setInterval(loadOrders,8000); return()=>clearInterval(t); },[loadOrders]);

  const toggle=async()=>{
    const next=!driver.available;
    await fetch(`${SUPABASE_URL}/rest/v1/drivers?id=eq.${driver.id}`,{method:"PATCH",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({available:next})});
    setDriver(d=>({...d,available:next}));
    notify(next?"Tu es disponible ✓":"Tu es hors ligne");
  };

  const finish=async(o)=>{
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${o.id}`,{method:"PATCH",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({status:"terminée"})});
    await fetch(`${SUPABASE_URL}/rest/v1/drivers?id=eq.${driver.id}`,{method:"PATCH",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({available:true,trips:(driver.trips||0)+1})});
    setDriver(d=>({...d,available:true,trips:(d.trips||0)+1}));
    notify(`+${fcfa(PRICE.driver)} à encaisser 🎉`);
    loadOrders();
  };

  if(!driver) return (
    <Wrap>
      <Bar title="Espace Chauffeur" onBack={()=>go("home")}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:48}}>
        <div style={{fontSize:56,marginBottom:16}}>🚗</div>
        <p style={{fontWeight:800,fontSize:22,margin:"0 0 6px"}}>Connexion chauffeur</p>
        <p style={{color:C.sub,fontSize:13,margin:"0 0 28px",textAlign:"center"}}>Entre le numéro avec lequel tu t'es inscrit</p>
        <Box style={{width:"100%"}}>
          <Fld label="Ton numéro de téléphone" icon="📱"><Inp placeholder="07 00 00 00 00" value={phone} onChange={setPhone} type="tel"/></Fld>
          <Btn onClick={login} disabled={busy}>{busy?"Vérification...":"Accéder à mes courses"}</Btn>
        </Box>
        <p style={{fontSize:12,color:C.muted,marginTop:16,textAlign:"center"}}>
          Pas encore inscrit ?{" "}
          <button onClick={()=>go("register")} style={{background:"none",border:"none",color:C.brand,fontWeight:700,cursor:"pointer",fontSize:12}}>S'inscrire →</button>
        </p>
      </div>
    </Wrap>
  );

  const active  = orders.filter(o=>o.status==="en cours");
  const history = orders.filter(o=>o.status==="terminée");

  return (
    <Wrap>
      <Bar title={driver.full_name} onBack={()=>setDriver(null)}/>
      <div style={{display:"flex",gap:12,marginBottom:18}}>
        <div style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"15px 16px"}}>
          <p style={{fontSize:11,color:C.sub,margin:"0 0 4px"}}>Gains totaux</p>
          <p style={{fontSize:20,fontWeight:900,color:C.wave,margin:"0 0 2px"}}>{fcfa(history.length*PRICE.driver)}</p>
          <p style={{fontSize:11,color:C.sub,margin:0}}>{history.length} course{history.length>1?"s":""}</p>
        </div>
        <button onClick={toggle} style={{flex:1,borderRadius:16,padding:"15px 16px",cursor:"pointer",background:driver.available?`${C.brand}18`:`${C.danger}15`,border:`2px solid ${driver.available?C.brand:C.danger}`}}>
          <p style={{fontSize:11,color:C.sub,margin:"0 0 4px"}}>Mon statut</p>
          <p style={{fontSize:14,fontWeight:800,color:driver.available?C.brand:C.danger,margin:"0 0 2px"}}>{driver.available?"● Disponible":"○ Hors ligne"}</p>
          <p style={{fontSize:11,color:C.sub,margin:0}}>Appuie pour changer</p>
        </button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {[{id:"active",l:`Actives (${active.length})`},{id:"history",l:`Historique (${history.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0",borderRadius:30,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===t.id?C.wave:"#ffffff08",color:tab===t.id?C.night:C.sub}}>{t.l}</button>
        ))}
      </div>
      {tab==="active"&&(active.length===0?<Empty icon="🕐" text="Aucune course active — active ta disponibilité"/>:active.map(o=>(
        <div key={o.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"18px 20px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div><p style={{fontWeight:800,fontSize:16,margin:"0 0 3px"}}>{o.client_name}</p><p style={{fontSize:12,color:C.sub,margin:0}}>📞 {o.client_phone}</p></div>
            <span style={{background:`${C.orange}20`,color:C.orange,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20}}>EN COURS</span>
          </div>
          <Row l="De"       v={o.from_zone}/>
          <Row l="Vers"     v={o.to_zone}/>
          <Row l="Paiement" v={{wave:"Wave",orange:"Orange Money",mtn:"MTN Money"}[o.payment_method]}/>
          <div style={{marginTop:12,background:`${C.brand}12`,border:`1px solid ${C.brandBorder}`,borderRadius:12,padding:"12px 14px"}}>
            <p style={{fontSize:11,color:C.sub,margin:"0 0 2px"}}>Votre rémunération</p>
            <p style={{fontSize:24,fontWeight:900,color:C.brand,margin:0}}>{fcfa(PRICE.driver)}</p>
          </div>
          <p style={{fontSize:11,color:C.sub,background:"#ffffff06",borderRadius:10,padding:"8px 12px",margin:"8px 0 0",lineHeight:1.5}}>
            💡 Demandez au client <strong style={{color:C.white}}>1 000 FCFA</strong>. Vous recevrez <strong style={{color:C.brand}}>700 FCFA</strong> après commission.
          </p>
          <button onClick={()=>finish(o)} style={{...btnBase,background:C.brand,color:C.night,marginTop:12}}>✅ Course terminée — Recevoir {fcfa(PRICE.driver)}</button>
        </div>
      )))}
      {tab==="history"&&(history.length===0?<Empty icon="📋" text="Pas encore de courses terminées"/>:history.map(o=>(
        <div key={o.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><p style={{fontWeight:700,margin:"0 0 3px"}}>{o.from_zone} → {o.to_zone}</p><p style={{fontSize:12,color:C.sub,margin:0}}>{o.client_name}</p></div>
            <p style={{color:C.brand,fontWeight:900,fontSize:16,margin:0}}>+{fcfa(PRICE.driver)}</p>
          </div>
        </div>
      )))}
    </Wrap>
  );
}

function AdminFlow({ go, notify }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [logged,   setLogged]   = useState(false);
  const [tab,      setTab]      = useState("orders");
  const [orders,   setOrders]   = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [busy,     setBusy]     = useState(false);

  useEffect(()=>{ const t=localStorage.getItem("tb_token"); if(t) setLogged(true); },[]);

  const load=useCallback(async()=>{
    const [r1,r2]=await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,{headers:sb.headers}),
      fetch(`${SUPABASE_URL}/rest/v1/drivers?select=*&order=created_at.desc`,{headers:sb.headers}),
    ]);
    setOrders(await r1.json()||[]);
    setDrivers(await r2.json()||[]);
  },[]);

  useEffect(()=>{ if(logged){ load(); const t=setInterval(load,10000); return()=>clearInterval(t); } },[logged,load]);

  const login=async()=>{
    if(!email||!password) return notify("Remplis email et mot de passe","err");
    setBusy(true);
    const {user,error}=await sb.auth.signIn(email,password);
    setBusy(false);
    if(error) return notify("Email ou mot de passe incorrect","err");
    setLogged(true); notify("Connecté ✓");
  };

  const logout=()=>{ sb.auth.signOut(); setLogged(false); };

  const approve=async(id,cur)=>{
    await fetch(`${SUPABASE_URL}/rest/v1/drivers?id=eq.${id}`,{method:"PATCH",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({approved:!cur})});
    notify(!cur?"Chauffeur approuvé ✓":"Accès retiré"); load();
  };

  const delDriver=async(id)=>{
    await fetch(`${SUPABASE_URL}/rest/v1/drivers?id=eq.${id}`,{method:"DELETE",headers:sb.headers});
    notify("Supprimé"); load();
  };

  if(!logged) return (
    <Wrap>
      <Bar title="Administration" onBack={()=>go("home")}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:40}}>
        <div style={{fontSize:52,marginBottom:14}}>🔐</div>
        <p style={{fontWeight:800,fontSize:22,margin:"0 0 6px"}}>Espace privé</p>
        <p style={{color:C.sub,fontSize:13,margin:"0 0 28px",textAlign:"center"}}>Accès réservé à l'administrateur TaxiBonoua</p>
        <Box style={{width:"100%"}}>
          <Fld label="Email admin" icon="✉️"><Inp placeholder="ulrichromaric12@gmail.com" value={email} onChange={setEmail} type="email"/></Fld>
          <Fld label="Mot de passe" icon="🔑"><Inp placeholder="••••••••" value={password} onChange={setPassword} type="password"/></Fld>
          <Btn onClick={login} disabled={busy}>{busy?"Connexion...":"Accéder au tableau de bord"}</Btn>
        </Box>
      </div>
    </Wrap>
  );

  const done   =orders.filter(o=>o.status==="terminée");
  const active =orders.filter(o=>o.status==="en cours");
  const pending=drivers.filter(d=>!d.approved);
  const revenue=done.length*PRICE.margin;

  return (
    <Wrap>
      <Bar title="Tableau de bord" onBack={()=>go("home")} right={<button onClick={logout} style={{background:"none",border:"none",color:C.danger,fontSize:12,fontWeight:700,cursor:"pointer"}}>Déconnexion</button>}/>
      <div style={{background:"linear-gradient(135deg,#1A1400,#0D0F05)",border:`1px solid ${C.gold}30`,borderRadius:20,padding:22,marginBottom:20}}>
        <p style={{fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:1.5,margin:"0 0 6px"}}>Revenus plateforme</p>
        <p style={{fontSize:42,fontWeight:900,color:C.gold,margin:"0 0 4px"}}>{fcfa(revenue)}</p>
        <p style={{color:C.sub,fontSize:13,margin:"0 0 16px"}}>{done.length} course{done.length>1?"s":""} × {fcfa(PRICE.margin)}</p>
        <div style={{display:"flex",gap:8}}>
          <Mini l="En cours"   v={active.length}  c={C.orange}/>
          <Mini l="Terminées"  v={done.length}    c={C.brand}/>
          <Mini l="Chauffeurs" v={drivers.filter(d=>d.approved).length} c={C.wave}/>
          {pending.length>0&&<Mini l="En attente" v={pending.length} c={C.danger}/>}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:18,overflowX:"auto"}}>
        {[{id:"orders",l:"Courses"},{id:"drivers",l:`Chauffeurs${pending.length>0?` (${pending.length}⚠️)`:""}`},{id:"split",l:"Paiements"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 16px",borderRadius:30,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap",background:tab===t.id?C.gold:"#ffffff08",color:tab===t.id?C.night:C.sub}}>{t.l}</button>
        ))}
      </div>
      {tab==="orders"&&(orders.length===0?<Empty icon="📦" text="Aucune course enregistrée"/>:orders.map(o=>(
        <div key={o.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <p style={{fontWeight:700,fontSize:14,margin:0}}>{o.client_name}</p>
            <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:o.status==="terminée"?`${C.brand}20`:`${C.orange}20`,color:o.status==="terminée"?C.brand:C.orange}}>{o.status.toUpperCase()}</span>
          </div>
          <Row l="Trajet"    v={`${o.from_zone} → ${o.to_zone}`}/>
          <Row l="Chauffeur" v={o.driver_name}/>
          <Row l="Paiement"  v={{wave:"Wave",orange:"Orange Money",mtn:"MTN Money"}[o.payment_method]}/>
          <Row l="Date"      v={new Date(o.created_at).toLocaleDateString("fr-FR")}/>
          {o.status==="terminée"&&<Row l="Commission" v={`+${fcfa(PRICE.margin)}`} hi/>}
        </div>
      )))}
      {tab==="drivers"&&(drivers.length===0?<Empty icon="🚗" text="Aucun chauffeur inscrit"/>:drivers.map(d=>(
        <div key={d.id} style={{background:C.card,border:`1px solid ${d.approved?C.border:`${C.danger}40`}`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
          {!d.approved&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}30`,borderRadius:8,padding:"6px 12px",fontSize:11,color:C.danger,fontWeight:700,marginBottom:10}}>⏳ EN ATTENTE D'APPROBATION</div>}
          <p style={{fontWeight:800,fontSize:15,margin:"0 0 10px"}}>{d.full_name}</p>
          <Row l="Téléphone"    v={d.phone}/>
          <Row l="Zone"         v={d.zone}/>
          <Row l="Mobile Money" v={`${d.mobile_money_operator} · ${d.mobile_money_number}`}/>
          <Row l="CNI"          v={d.cni}/>
          <Row l="Courses"      v={d.trips||0}/>
          <Row l="Statut"       v={d.available?"🟢 Disponible":"🔴 Hors ligne"}/>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>approve(d.id,d.approved)} style={{flex:2,padding:"10px 0",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:d.approved?`${C.danger}20`:C.brand,color:d.approved?C.danger:C.night}}>{d.approved?"Suspendre":"✓ Approuver"}</button>
            <button onClick={()=>delDriver(d.id)} style={{flex:1,padding:"10px 0",borderRadius:12,border:`1px solid ${C.danger}40`,background:"transparent",color:C.danger,fontWeight:700,fontSize:13,cursor:"pointer"}}>Supprimer</button>
          </div>
        </div>
      )))}
      {tab==="split"&&<>
        <Box title="Répartition par course">
          {[{l:"Client paie",v:fcfa(PRICE.total),c:C.white},{l:"→ Chauffeur reçoit",v:fcfa(PRICE.driver),c:C.brand},{l:"→ TaxiBonoua (toi)",v:fcfa(PRICE.margin),c:C.gold}].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"13px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
              <span style={{color:C.sub,fontSize:14}}>{r.l}</span><span style={{fontWeight:800,color:r.c,fontSize:15}}>{r.v}</span>
            </div>
          ))}
        </Box>
        <Box title="Automatiser avec CinetPay">
          <div style={{background:`${C.wave}10`,border:`1px solid ${C.wave}25`,borderRadius:14,padding:"14px 16px",fontSize:13,color:C.sub,lineHeight:1.8}}>
            <p style={{color:C.wave,fontWeight:700,margin:"0 0 8px"}}>🔗 CinetPay — Abidjan, Côte d'Ivoire</p>
            <strong style={{color:C.white}}>1.</strong> Compte Business sur <strong style={{color:C.white}}>cinetpay.com</strong><br/>
            <strong style={{color:C.white}}>2.</strong> API Mass Payout → 700 FCFA envoyés au chauffeur automatiquement<br/>
            <strong style={{color:C.white}}>3.</strong> 300 FCFA restent dans ton solde CinetPay<br/>
            <strong style={{color:C.white}}>4.</strong> Frais : ~3,5% par transaction
          </div>
        </Box>
        <div style={{height:32}}/>
      </>}
    </Wrap>
  );
}

function RegisterFlow({ go, notify }) {
  const [step,setStep]=useState("form");
  const [busy,setBusy]=useState(false);
  const [form,setForm]=useState({full_name:"",phone:"",zone:"",mobile_money_operator:"",mobile_money_number:"",cni:"",agree:false});
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const validate=()=>{
    if(!form.full_name.trim()) return "Entre ton nom complet";
    if(!form.phone.trim()) return "Entre ton numéro de téléphone";
    if(form.phone.trim().length<10) return "Numéro invalide";
    if(!form.zone) return "Choisis ta zone de travail";
    if(!form.mobile_money_operator) return "Choisis ton opérateur Mobile Money";
    if(!form.mobile_money_number.trim()) return "Entre ton numéro Mobile Money";
    if(!form.cni.trim()) return "Entre ton numéro de pièce d'identité";
    if(!form.agree) return "Accepte les conditions pour continuer";
    return null;
  };

  const submit=async()=>{
    const err=validate();
    if(err) return notify(err,"err");
    setBusy(true);
    const check=await fetch(`${SUPABASE_URL}/rest/v1/drivers?phone=eq.${encodeURIComponent(form.phone.trim())}&select=id`,{headers:sb.headers});
    const existing=await check.json();
    if(existing?.length){ setBusy(false); return notify("Ce numéro est déjà enregistré","err"); }
    const r=await fetch(`${SUPABASE_URL}/rest/v1/drivers`,{method:"POST",headers:{...sb.headers,"Prefer":"return=minimal"},body:JSON.stringify({
      full_name:form.full_name.trim(),phone:form.phone.trim(),zone:form.zone,
      mobile_money_operator:form.mobile_money_operator,mobile_money_number:form.mobile_money_number.trim(),
      cni:form.cni.trim(),approved:false,available:false,trips:0,
    })});
    setBusy(false);
    if(!r.ok) return notify("Erreur, réessaie","err");
    setStep("success");
  };

  if(step==="success") return (
    <Wrap>
      <Bar title="Inscription Chauffeur" onBack={()=>go("home")}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:32,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16,filter:`drop-shadow(0 0 20px ${C.brand}50)`}}>✅</div>
        <p style={{fontSize:26,fontWeight:900,color:C.brand,margin:"0 0 12px"}}>Inscription envoyée !</p>
        <p style={{color:C.sub,fontSize:14,lineHeight:1.7,margin:"0 0 28px"}}>Ton dossier a bien été reçu.<br/>L'administrateur va vérifier tes informations<br/>et t'appeler pour confirmer ton accès.</p>
        <Box style={{width:"100%",textAlign:"left"}}>
          {[["Nom",form.full_name],["Téléphone",form.phone],["Zone",form.zone],["Opérateur",form.mobile_money_operator],["N° MM",form.mobile_money_number]].map(([l,v])=><Row key={l} l={l} v={v}/>)}
        </Box>
        <button onClick={()=>go("home")} style={{...btnBase,background:C.brand,color:C.night,marginTop:8}}>Retour à l'accueil</button>
      </div>
    </Wrap>
  );

  const MM_OPS=["Wave","Orange Money","MTN Money"];
  return (
    <Wrap>
      <Bar title="Inscription Chauffeur" onBack={()=>go("home")}/>
      <div style={{background:`${C.brand}10`,border:`1px solid ${C.brandBorder}`,borderRadius:12,padding:"10px 14px",marginBottom:18,display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.brand,fontWeight:600}}>
        🔒 Formulaire privé · TaxiBonoua · Bonoua uniquement
      </div>
      <STitle>Informations personnelles</STitle>
      <Box>
        <Fld label="Nom complet" icon="👤"><Inp placeholder="Ex : Kouamé Brou Yves" value={form.full_name} onChange={v=>f("full_name",v)}/></Fld>
        <Fld label="Numéro de téléphone" icon="📱"><Inp placeholder="07 00 00 00 00" value={form.phone} onChange={v=>f("phone",v)} type="tel"/></Fld>
        <Fld label="Numéro CNI / Pièce d'identité" icon="🪪"><Inp placeholder="Ex : CI0123456789" value={form.cni} onChange={v=>f("cni",v)}/></Fld>
      </Box>
      <STitle>Zone de travail principale</STitle>
      <Box>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {ZONES.map(z=>(
            <button key={z} onClick={()=>f("zone",z)} style={{padding:"10px 8px",borderRadius:12,cursor:"pointer",fontSize:12,textAlign:"center",border:`2px solid ${form.zone===z?C.brand:C.border}`,background:form.zone===z?`${C.brand}18`:"#ffffff06",color:form.zone===z?C.brand:C.sub,fontWeight:form.zone===z?700:500}}>{z}</button>
          ))}
        </div>
      </Box>
      <STitle>Compte Mobile Money (pour recevoir tes 700 FCFA)</STitle>
      <Box>
        <Fld label="Opérateur" icon="💳">
          <div style={{display:"flex",gap:8}}>
            {MM_OPS.map(op=>(
              <button key={op} onClick={()=>f("mobile_money_operator",op)} style={{flex:1,padding:"10px 6px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:11,border:`2px solid ${form.mobile_money_operator===op?C.brand:C.border}`,background:form.mobile_money_operator===op?`${C.brand}18`:"#ffffff06",color:form.mobile_money_operator===op?C.brand:C.sub}}>{op}</button>
            ))}
          </div>
        </Fld>
        <Fld label="Numéro Mobile Money" icon="📲">
          <Inp placeholder="07 00 00 00 00" value={form.mobile_money_number} onChange={v=>f("mobile_money_number",v)} type="tel"/>
          <p style={{fontSize:11,color:C.sub,margin:"6px 0 0"}}>Tu recevras <strong style={{color:C.white}}>700 FCFA</strong> par course sur ce numéro</p>
        </Fld>
      </Box>
      <Box>
        <button onClick={()=>f("agree",!form.agree)} style={{display:"flex",alignItems:"flex-start",gap:12,background:"none",border:"none",cursor:"pointer",padding:0,width:"100%",textAlign:"left"}}>
          <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${form.agree?C.brand:C.border}`,background:form.agree?C.brand:"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {form.agree&&<span style={{color:C.night,fontSize:13,fontWeight:900}}>✓</span>}
          </div>
          <p style={{fontSize:13,color:C.sub,lineHeight:1.6,margin:0}}>Je certifie que mes informations sont exactes. J'accepte : prix fixe <strong style={{color:C.white}}>1 000 FCFA</strong>/course · je reçois <strong style={{color:C.brand}}>700 FCFA</strong> après commission de 300 FCFA.</p>
        </button>
      </Box>
      <Btn onClick={submit} disabled={busy}>{busy?"Envoi en cours...":"Soumettre mon inscription →"}</Btn>
      <p style={{textAlign:"center",fontSize:12,color:C.muted,margin:"14px 0 0",lineHeight:1.6}}>Ton dossier sera examiné par l'administrateur.<br/>Tu seras contacté par téléphone.</p>
      <div style={{height:40}}/>
    </Wrap>
  );
}

// ── UI ATOMS ──────────────────────────────────────────────────
const btnBase={width:"100%",padding:"15px 0",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer"};
function useCallback(fn,deps){return fn;}
function Wrap({children}){return <div style={{padding:"0 18px 100px",minHeight:"100vh"}}>{children}</div>;}
function Bar({title,onBack,right}){return(<div style={{display:"flex",alignItems:"center",padding:"22px 0 18px",position:"sticky",top:0,background:`${C.night}F5`,backdropFilter:"blur(12px)",zIndex:10,borderBottom:`1px solid ${C.border}`}}><button onClick={onBack} style={{background:"#ffffff0E",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",color:C.white,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",marginRight:14,flexShrink:0}}>‹</button><p style={{fontWeight:800,fontSize:18,flex:1,margin:0}}>{title}</p>{right}</div>);}
function Box({title,children,style}){return(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:14,...style}}>{title&&<p style={{fontWeight:700,fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,margin:"0 0 14px"}}>{title}</p>}{children}</div>);}
function Fld({label,icon,children}){return(<div style={{marginBottom:14}}><p style={{fontSize:12,fontWeight:600,color:C.sub,margin:"0 0 6px",display:"flex",alignItems:"center",gap:6}}><span>{icon}</span>{label}</p>{children}</div>);}
function STitle({children}){return <p style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,margin:"20px 0 10px 2px"}}>{children}</p>;}
function Inp({placeholder,value,onChange,type="text"}){return <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#ffffff08",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px",color:C.white,fontSize:15,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>;}
function Sel({value,onChange,opts,ph}){return(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#111820",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px",color:value?C.white:C.muted,fontSize:15,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}><option value="">{ph}</option>{opts.map(o=><option key={o} value={o} style={{background:C.card}}>{o}</option>)}</select>);}
function Row({l,v,hi}){return(<div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.sub,fontSize:13}}>{l}</span><span style={{fontWeight:700,fontSize:13,color:hi?C.brand:C.white,maxWidth:"60%",textAlign:"right"}}>{v}</span></div>);}
function Btn({onClick,children,disabled,style}){return <button onClick={onClick} disabled={disabled} style={{...btnBase,background:disabled?C.muted:C.brand,color:C.night,opacity:disabled?.6:1,...style}}>{children}</button>;}
function Ghost({onClick,children}){return <button onClick={onClick} style={{...btnBase,background:"#ffffff08",color:C.sub,border:`1px solid ${C.border}`,marginTop:8}}>{children}</button>;}
function Pill({icon,val,label,color}){return(<div style={{display:"flex",alignItems:"center",gap:6,background:`${color}18`,border:`1px solid ${color}30`,borderRadius:30,padding:"6px 12px"}}><span style={{fontSize:12}}>{icon}</span><span style={{fontWeight:800,fontSize:14,color}}>{val}</span><span style={{fontSize:11,color:C.sub}}>{label}</span></div>);}
function MenuCard({emoji,title,sub,tag,tc,bg,bd,onClick}){return(<button onClick={onClick} style={{background:bg,border:`1px solid ${bd}`,borderRadius:20,padding:"20px 22px",width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}><div style={{width:52,height:52,borderRadius:16,background:"#ffffff0E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{emoji}</div><div style={{flex:1}}><p style={{fontWeight:800,fontSize:17,color:C.white,margin:"0 0 3px"}}>{title}</p><p style={{fontSize:12,color:C.sub,margin:0}}>{sub}</p></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}><span style={{background:`${tc}20`,color:tc,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{tag}</span><span style={{color:C.muted,fontSize:20}}>›</span></div></button>);}
function PriceBar(){return(<div style={{background:"#0A1A0C",border:`1px solid ${C.brandBorder}`,borderRadius:16,padding:"14px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><p style={{fontSize:11,color:C.sub,margin:"0 0 2px"}}>Prix de la course</p><p style={{fontSize:26,fontWeight:900,color:C.brand,margin:0}}>{fcfa(PRICE.total)}</p></div><div style={{textAlign:"right",fontSize:12,color:C.sub}}><p style={{margin:"0 0 2px"}}>Paiement à la fin</p><p style={{color:C.white,fontWeight:700,margin:0}}>Wave · Orange · MTN</p></div></div>);}
function Mini({l,v,c}){return(<div style={{flex:1,background:"#ffffff06",borderRadius:12,padding:"10px 12px"}}><p style={{fontSize:18,fontWeight:900,color:c,margin:"0 0 2px"}}>{v}</p><p style={{fontSize:10,color:C.sub,margin:0}}>{l}</p></div>);}
function Empty({icon,text}){return(<div style={{textAlign:"center",padding:"52px 0",color:C.muted}}><div style={{fontSize:46,marginBottom:10}}>{icon}</div><p style={{fontSize:14,margin:0}}>{text}</p></div>);}
function Toast({msg,type}){return(<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:type==="err"?C.danger:C.brand,color:type==="err"?C.white:C.night,padding:"12px 22px",borderRadius:30,zIndex:9999,fontWeight:700,fontSize:14,boxShadow:"0 8px 30px rgba(0,0,0,0.5)",whiteSpace:"nowrap",maxWidth:"88vw",textAlign:"center"}}>{msg}</div>);}
const css=`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes loadbar{from{width:0}to{width:100%}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}select option{background:#111820;color:#fff;}::-webkit-scrollbar{display:none;}button{font-family:inherit;}`;
