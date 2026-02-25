"use client";
import { useState } from "react";
import { DIV } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";

const TODAY=new Date().toISOString().slice(0,10);

export function SponDelivery({sponsor,user,mob,onSave,onClose}:any){
  const{colors,isDark,cardBg}=useC();
  const [desc,sDesc]=useState("");
  const [qty,sQty]=useState("1");
  const [unitVal,sUnitVal]=useState("");
  const [dest,sDest]=useState<"division"|"consumo"|"venta">("division");
  const [div,sDiv]=useState(DIV[0]);
  const [personName,sPersonName]=useState("");
  const [receivedDate,sReceivedDate]=useState(TODAY);
  const [notes,sNotes]=useState("");
  const [saving,sSaving]=useState(false);

  const total=(Number(qty)||0)*(Number(unitVal)||0);

  const canSave=desc.trim()&&(Number(qty)||0)>0;

  const handleSave=async()=>{
    if(!canSave||saving)return;
    sSaving(true);
    try{
      await onSave({
        sponsor_id:sponsor.id,
        description:desc.trim(),
        quantity:Number(qty)||1,
        unit_value:Number(unitVal)||0,
        total_value:total,
        destination:dest,
        division:dest==="division"?div:null,
        person_id:null,
        person_name:dest==="consumo"?personName.trim():null,
        received_by:user.id,
        received_by_name:(user.n||user.first_name||"")+" "+(user.a||user.last_name||""),
        received_date:receivedDate||TODAY,
        notes:notes.trim(),
      });
      onClose();
    }catch(e:any){
      alert(e.message||"Error al guardar");
    }finally{sSaving(false);}
  };

  const lbl:React.CSSProperties={fontSize:10,fontWeight:600,color:colors.g5,marginBottom:2,display:"block"};
  const inp:React.CSSProperties={width:"100%",padding:mob?10:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:mob?14:12,boxSizing:"border-box" as const,marginTop:2,background:cardBg,color:colors.nv,minHeight:mob?44:undefined};

  const destOpts:[string,string,string][]=[ ["division","Division","#3B82F6"], ["consumo","Consumo interno","#8B5CF6"], ["venta","Venta","#10B981"] ];

  return(
    <div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:cardBg,borderRadius:16,padding:mob?16:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={(e:any)=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>Nueva Entrega — {sponsor.name}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:colors.g4}} title="Cerrar">✕</button>
        </div>

        {/* Descripción */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Descripción *</label>
          <input value={desc} onChange={e=>sDesc(e.target.value)} style={inp} placeholder="Ej: Proteínas ENA, Camisetas Canterbury"/>
        </div>

        {/* Cantidad + Valor unitario */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <label style={lbl}>Cantidad</label>
            <input type="number" value={qty} onChange={e=>sQty(e.target.value)} style={inp} min="1"/>
          </div>
          <div>
            <label style={lbl}>Valor unitario $</label>
            <input type="number" value={unitVal} onChange={e=>sUnitVal(e.target.value)} style={inp} placeholder="0"/>
          </div>
        </div>

        {/* Total */}
        {total>0&&<div style={{marginBottom:10,padding:"8px 12px",borderRadius:8,background:isDark?"rgba(16,185,129,.1)":"#ECFDF5",border:"1px solid #10B981"}}>
          <div style={{fontSize:10,color:"#10B981",fontWeight:600}}>Total</div>
          <div style={{fontSize:16,fontWeight:800,color:"#10B981"}}>${Math.round(total).toLocaleString("es-AR")}</div>
        </div>}

        {/* Destino */}
        <div style={{marginBottom:10}}>
          <label style={lbl}>Destino *</label>
          <div style={{display:"flex",gap:6,marginTop:4}}>
            {destOpts.map(([val,label,color])=>(
              <button key={val} onClick={()=>sDest(val as any)} style={{flex:1,padding:mob?"10px 6px":"7px 6px",borderRadius:8,border:"2px solid "+(dest===val?color:colors.g3),background:dest===val?(isDark?color+"20":color+"15"):"transparent",color:dest===val?color:colors.g5,fontSize:mob?12:11,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional fields by destination */}
        {dest==="division"&&<div style={{marginBottom:8}}>
          <label style={lbl}>División</label>
          <select value={div} onChange={e=>sDiv(e.target.value)} style={inp}>
            {DIV.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>}

        {dest==="consumo"&&<div style={{marginBottom:8}}>
          <label style={lbl}>Uso / Destino</label>
          <input value={personName} onChange={e=>sPersonName(e.target.value)} style={inp} placeholder='Ej: "Tercer tiempo M19", "Reunión CD", "Juan Pérez"'/>
        </div>}

        {/* Fecha recepción */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Fecha de recepción</label>
          <input type="date" value={receivedDate} onChange={e=>sReceivedDate(e.target.value)} style={inp}/>
        </div>

        {/* Notas */}
        <div style={{marginBottom:12}}>
          <label style={lbl}>Notas</label>
          <textarea value={notes} onChange={e=>sNotes(e.target.value)} rows={2} style={{...inp,resize:"vertical" as const}} placeholder="Observaciones adicionales..."/>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={onClose}>Cancelar</Btn>
          <Btn v="s" s="s" disabled={!canSave||saving} onClick={handleSave}>{saving?"Guardando...":"Registrar Entrega"}</Btn>
        </div>
      </div>
    </div>
  );
}
