"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

const supabase = createClient();

export function LoginPrompt({mob}:{mob:boolean}){
  const [email,sEmail]=useState("");
  const [pass,sPass]=useState("");
  const [err,sErr]=useState("");
  const [busy,sBusy]=useState(false);
  const doLogin=async()=>{
    sErr("");sBusy(true);
    const{error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error) sErr(error.message);
    else window.location.reload();
    sBusy(false);
  };
  return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,"+T.nv+","+T.rd+")",display:"flex",alignItems:"center",justifyContent:"center",padding:mob?12:20}}>
    <div style={{maxWidth:420,width:"100%",textAlign:"center" as const}}>
      <img src="/logo.jpg" alt="Los Tordos" style={{width:mob?80:120,height:mob?80:120,objectFit:"contain",margin:"0 auto 18px",display:"block"}}/>
      <h1 style={{color:"#fff",fontSize:mob?22:30,margin:"0 0 4px",fontWeight:800}}>Módulo Deportivo</h1>
      <p style={{color:"rgba(255,255,255,.6)",fontSize:14,margin:"0 0 24px"}}>Iniciá sesión para acceder</p>
      <Card>
        <div style={{display:"flex",flexDirection:"column" as const,gap:10}}>
          <input value={email} onChange={e=>sEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const}}/>
          <input value={pass} onChange={e=>sPass(e.target.value)} placeholder="Contraseña" type="password" onKeyDown={e=>{if(e.key==="Enter"&&email&&pass)doLogin();}} style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const}}/>
          {err&&<div style={{fontSize:12,color:T.rd,fontWeight:600}}>{err}</div>}
          <Btn v="r" onClick={doLogin} disabled={busy||!email||!pass}>{busy?"Ingresando...":"Ingresar"}</Btn>
        </div>
      </Card>
    </div>
  </div>;
}
