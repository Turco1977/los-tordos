"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import type { Profile } from "@/lib/supabase/types";

const supabase = createClient();

const profileToUser = (p: Profile) => ({ id: p.id, n: p.first_name, a: p.last_name, role: p.role, dId: p.dept_id, div: p.division, mail: p.email, tel: p.phone });

export function Login({onLogin,mob}:{onLogin:(user:any)=>void;mob?:boolean}){
  const [email,sEmail]=useState("");const [pw,sPw]=useState("");const [err,sErr]=useState("");const [loading,sLoading]=useState(false);
  const bg={minHeight:"100vh",background:"linear-gradient(160deg,"+T.nv+","+T.rd+")",display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,padding:mob?12:20};
  const logo=<><img src="/logo.jpg" alt="Los Tordos Rugby Club" style={{width:mob?80:120,height:mob?80:120,objectFit:"contain",margin:"0 auto 18px",display:"block"}}/><h1 style={{color:"#fff",fontSize:mob?22:30,margin:"0 0 4px",fontWeight:800,letterSpacing:1}}>Los Tordos Rugby Club</h1><p style={{color:"rgba(255,255,255,.6)",fontSize:mob?12:14,margin:"0 0 32px",fontWeight:500}}>Sistema de Gestion</p></>;
  const submit=async(e:any)=>{e.preventDefault();sErr("");sLoading(true);
    const{error}=await supabase.auth.signInWithPassword({email,password:pw});
    if(error){sErr(error.message);sLoading(false);return;}
    const{data:{user:au}}=await supabase.auth.getUser();
    if(!au){sErr("Error de autenticacion");sLoading(false);return;}
    const{data:profile}=await supabase.from("profiles").select("*").eq("id",au.id).single();
    if(!profile){sErr("Perfil no encontrado");sLoading(false);return;}
    onLogin(profileToUser(profile));
  };
  return(<div style={bg}><div style={{maxWidth:420,width:"100%",textAlign:"center" as const}}>{logo}<Card>
    <h2 style={{margin:"0 0 14px",fontSize:16,color:T.nv}}>Ingresa al sistema</h2>
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column" as const,gap:10}}>
      <input type="email" value={email} onChange={e=>sEmail(e.target.value)} placeholder="Email" required style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+T.g3,fontSize:13,outline:"none"}}/>
      <input type="password" value={pw} onChange={e=>sPw(e.target.value)} placeholder="Contrasena" required style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+T.g3,fontSize:13,outline:"none"}}/>
      {err&&<div style={{color:T.rd,fontSize:12,textAlign:"left" as const}}>{err}</div>}
      <Btn v="r" disabled={loading}>{loading?"Ingresando...":"Ingresar"}</Btn>
    </form>
  </Card></div></div>);
}
