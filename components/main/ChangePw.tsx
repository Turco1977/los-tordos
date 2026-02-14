"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useC } from "@/lib/theme-context";
import { Btn } from "@/components/ui";

const supabase = createClient();

export function ChangePw({onX}:{onX:()=>void}){
  const{colors,cardBg}=useC();
  const [cur,sCur]=useState("");const [np,sNp]=useState("");const [np2,sNp2]=useState("");const [err,sErr]=useState("");const [ok,sOk]=useState(false);const [loading,sLoading]=useState(false);
  const submit=async(e:any)=>{e.preventDefault();sErr("");
    if(np.length<6){sErr("La nueva contrasena debe tener al menos 6 caracteres");return;}
    if(np!==np2){sErr("Las contrasenas no coinciden");return;}
    sLoading(true);
    const{data:{session}}=await supabase.auth.getSession();
    const email=session?.user?.email;
    if(!email){sErr("No se pudo verificar la sesion");sLoading(false);return;}
    const{error:signErr}=await supabase.auth.signInWithPassword({email,password:cur});
    if(signErr){sErr("Contrasena actual incorrecta");sLoading(false);return;}
    const{error}=await supabase.auth.updateUser({password:np});
    sLoading(false);
    if(error){sErr(error.message);return;}
    sOk(true);
  };
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={onX}>
    <div onClick={e=>e.stopPropagation()} style={{background:cardBg,borderRadius:14,padding:24,width:360,maxWidth:"90vw",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16,color:colors.nv}}>Cambiar contrasena</h3><button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:colors.g4}}>✕</button></div>
      {ok?<div><div style={{textAlign:"center" as const,padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontSize:14,fontWeight:600,color:colors.gn}}>Contrasena actualizada</div></div><div style={{textAlign:"center" as const,marginTop:12}}><Btn v="p" onClick={onX}>Cerrar</Btn></div></div>
      :<form onSubmit={submit} style={{display:"flex",flexDirection:"column" as const,gap:10}}>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Contrasena actual</label><input type="password" value={cur} onChange={e=>sCur(e.target.value)} required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Nueva contrasena</label><input type="password" value={np} onChange={e=>sNp(e.target.value)} required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Confirmar nueva contrasena</label><input type="password" value={np2} onChange={e=>sNp2(e.target.value)} required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const}}/></div>
        {err&&<div style={{color:colors.rd,fontSize:11}}>{err}</div>}
        <Btn v="p" disabled={loading}>{loading?"Guardando...":"Cambiar contrasena"}</Btn>
      </form>}
    </div>
  </div>);
}
