"use client";
import { T } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

export function NoAccess({mob,userName,onOut}:{mob:boolean;userName:string;onOut:()=>void}){
  return <div style={{minHeight:"100vh",background:T.g1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <Card style={{maxWidth:420,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <h2 style={{fontSize:18,color:T.nv,margin:"0 0 8px"}}>Sin acceso</h2>
      <p style={{fontSize:13,color:T.g5,margin:"0 0 16px"}}>Hola {userName}, no tenés un rol deportivo asignado. Pedile al Director Deportivo que te agregue al staff.</p>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}><Btn v="r" onClick={onOut}>Cerrar sesión</Btn></div>
    </Card>
  </div>;
}
