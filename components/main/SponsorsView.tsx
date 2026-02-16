"use client";
import { useState, useMemo } from "react";
import { SPON_TIER, SPON_ST, MONEDAS, fn } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";

const TODAY=new Date().toISOString().slice(0,10);
const daysLeft=(d:string)=>{if(!d)return Infinity;return Math.round((new Date(d).getTime()-new Date(TODAY).getTime())/864e5);};
const emptyForm=()=>({nombre:"",tier:"oro",monto:"",moneda:"ARS",contacto_nombre:"",contacto_email:"",contacto_tel:"",status:"negociando",start_date:TODAY,end_date:"",notas:""});

export function SponsorsView({sponsors,user,mob,onAdd,onUpd,onDel}:any){
  const{colors,isDark,cardBg}=useC();
  const [search,sSr]=useState("");const [fTier,sFTier]=useState("all");const [fSt,sFSt]=useState("all");
  const [showForm,sShowForm]=useState(false);const [editId,sEditId]=useState<string|null>(null);
  const [expandId,sExpandId]=useState<string|null>(null);
  const [form,sForm]=useState(emptyForm());
  const [confirmDel,sConfirmDel]=useState<string|null>(null);

  /* ── Derived data ── */
  const all:any[]=sponsors||[];
  const active=useMemo(()=>all.filter((s:any)=>s.status==="activo"),[all]);
  const totalRev=useMemo(()=>active.reduce((s:number,sp:any)=>s+Number(sp.monto||0),0),[active]);
  const expiring=useMemo(()=>all.filter((s:any)=>{const dl=daysLeft(s.end_date);return dl>=0&&dl<=30&&s.status==="activo";}),[all]);

  /* Revenue by tier */
  const revByTier=useMemo(()=>{const m:Record<string,number>={};active.forEach((s:any)=>{m[s.tier]=(m[s.tier]||0)+Number(s.monto||0);});return m;},[active]);
  const maxTierRev=useMemo(()=>Math.max(...Object.values(revByTier),1),[revByTier]);

  /* Filter */
  const vis=useMemo(()=>{let v=[...all];if(fTier!=="all")v=v.filter((s:any)=>s.tier===fTier);if(fSt!=="all")v=v.filter((s:any)=>s.status===fSt);if(search){const q=search.toLowerCase();v=v.filter((s:any)=>(s.nombre+s.contacto_nombre+s.contacto_email+s.notas+(s.id||"")).toLowerCase().includes(q));}return v;},[all,fTier,fSt,search]);

  /* ── Form helpers ── */
  const openAdd=()=>{sForm(emptyForm());sEditId(null);sShowForm(true);};
  const openEdit=(sp:any)=>{sForm({nombre:sp.nombre||"",tier:sp.tier||"oro",monto:String(sp.monto||""),moneda:sp.moneda||"ARS",contacto_nombre:sp.contacto_nombre||"",contacto_email:sp.contacto_email||"",contacto_tel:sp.contacto_tel||"",status:sp.status||"negociando",start_date:sp.start_date||"",end_date:sp.end_date||"",notas:sp.notas||""});sEditId(sp.id);sShowForm(true);};
  const closeForm=()=>{sShowForm(false);sEditId(null);sForm(emptyForm());};
  const saveForm=()=>{const payload={...form,monto:Number(form.monto)||0};if(editId){onUpd(editId,payload);}else{onAdd(payload);}closeForm();};

  /* ── Inline edit helpers ── */
  const inlineUpd=(sp:any,field:string,val:any)=>{onUpd(sp.id,{...sp,[field]:val});};

  /* ── Styles ── */
  const lbl:React.CSSProperties={fontSize:10,fontWeight:600,color:colors.g5,marginBottom:2,display:"block"};
  const inp:React.CSSProperties={width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2,background:cardBg,color:colors.nv};

  return(<div style={{maxWidth:900}}>
    {/* ── Header ── */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
      <div><h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>🤝 Sponsors CRM</h2><p style={{color:colors.g4,fontSize:12,margin:0}}>Gestion de patrocinadores y sponsors del club</p></div>
      <Btn v="pu" s="s" onClick={openAdd}>+ Nuevo Sponsor</Btn>
    </div>

    {/* ── KPI Dashboard ── */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,margin:"14px 0"}}>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.pr}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🤝</span><span style={{fontSize:17,fontWeight:800,color:colors.pr}}>{all.length}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Total Sponsors</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #10B981"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>✅</span><span style={{fontSize:17,fontWeight:800,color:"#10B981"}}>{active.length}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Activos</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.gn}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>💰</span><span style={{fontSize:17,fontWeight:800,color:colors.gn}}>${totalRev.toLocaleString()}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Revenue Activos</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+(expiring.length>0?"#DC2626":colors.yl)}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>{expiring.length>0?"⚠️":"📅"}</span><span style={{fontSize:17,fontWeight:800,color:expiring.length>0?"#DC2626":colors.yl}}>{expiring.length}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Vencen en 30d</div>
      </Card>
    </div>

    {/* Revenue by tier mini bars */}
    {Object.keys(revByTier).length>0&&<Card style={{padding:"10px 14px",marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:colors.nv,marginBottom:8}}>Revenue por Tier</div>
      <div style={{display:"flex",gap:mob?6:12,alignItems:"flex-end",height:48}}>
        {Object.keys(SPON_TIER).map(k=>{const val=revByTier[k]||0;const t=SPON_TIER[k];return <div key={k} style={{flex:1,display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2}}>
          {val>0&&<span style={{fontSize:8,fontWeight:700,color:t.c}}>${val>=1000?(val/1000).toFixed(0)+"k":val}</span>}
          <div style={{width:"100%",height:Math.max(4,Math.round(val/maxTierRev*36)),background:t.c,borderRadius:4,transition:"height .3s"}}/>
          <span style={{fontSize:8,color:colors.g5,fontWeight:600}}>{t.i} {t.l}</span>
        </div>;})}
      </div>
    </Card>}

    {/* ── Filter bar ── */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
      <input value={search} onChange={e=>sSr(e.target.value)} placeholder="🔍 Buscar sponsor..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,width:mob?120:160,background:cardBg,color:colors.nv}}/>
      <select value={fTier} onChange={e=>sFTier(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:colors.nv}}>
        <option value="all">Todos los tiers</option>{Object.keys(SPON_TIER).map(k=><option key={k} value={k}>{SPON_TIER[k].i} {SPON_TIER[k].l}</option>)}
      </select>
      <select value={fSt} onChange={e=>sFSt(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:colors.nv}}>
        <option value="all">Todos los estados</option>{Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}
      </select>
    </div>

    {/* ── Status summary chips ── */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const}}>
      {Object.keys(SPON_TIER).map(k=>{const cnt=all.filter((s:any)=>s.tier===k).length;return <span key={k} onClick={()=>sFTier(fTier===k?"all":k)} style={{padding:"3px 10px",borderRadius:14,background:fTier===k?SPON_TIER[k].bg:cardBg,border:"1px solid "+(fTier===k?SPON_TIER[k].c:colors.g3),fontSize:10,fontWeight:600,color:SPON_TIER[k].c,cursor:"pointer"}}>{SPON_TIER[k].i} {cnt}</span>;})}
      <span style={{width:1,background:colors.g3,margin:"0 2px"}}/>
      {Object.keys(SPON_ST).map(k=>{const cnt=all.filter((s:any)=>s.status===k).length;return <span key={k} onClick={()=>sFSt(fSt===k?"all":k)} style={{padding:"3px 10px",borderRadius:14,background:fSt===k?SPON_ST[k].bg:cardBg,border:"1px solid "+(fSt===k?SPON_ST[k].c:colors.g3),fontSize:10,fontWeight:600,color:SPON_ST[k].c,cursor:"pointer"}}>{SPON_ST[k].l} {cnt}</span>;})}
    </div>

    {/* ── Modal overlay – Add/Edit form ── */}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={closeForm}>
      <div style={{background:cardBg,borderRadius:16,padding:mob?16:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>{editId?"✏️ Editar Sponsor":"➕ Nuevo Sponsor"}</div>
          <button onClick={closeForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:colors.g4}}>✕</button>
        </div>
        {/* Name + tier */}
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"2fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Nombre / Empresa *</label><input value={form.nombre} onChange={e=>sForm(p=>({...p,nombre:e.target.value}))} style={inp} placeholder="Ej: Cerveceria Quilmes"/></div>
          <div><label style={lbl}>Tier</label><select value={form.tier} onChange={e=>sForm(p=>({...p,tier:e.target.value}))} style={inp}>{Object.keys(SPON_TIER).map(k=><option key={k} value={k}>{SPON_TIER[k].i} {SPON_TIER[k].l}</option>)}</select></div>
        </div>
        {/* Amount + currency */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Monto ($)</label><input type="number" value={form.monto} onChange={e=>sForm(p=>({...p,monto:e.target.value}))} style={inp} placeholder="0"/></div>
          <div><label style={lbl}>Moneda</label><select value={form.moneda} onChange={e=>sForm(p=>({...p,moneda:e.target.value}))} style={inp}>{MONEDAS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        {/* Contact info */}
        <div style={{fontSize:11,fontWeight:700,color:colors.g5,margin:"8px 0 4px"}}>Contacto</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Nombre</label><input value={form.contacto_nombre} onChange={e=>sForm(p=>({...p,contacto_nombre:e.target.value}))} style={inp} placeholder="Juan Perez"/></div>
          <div><label style={lbl}>Email</label><input type="email" value={form.contacto_email} onChange={e=>sForm(p=>({...p,contacto_email:e.target.value}))} style={inp} placeholder="email@empresa.com"/></div>
          <div><label style={lbl}>Telefono</label><input value={form.contacto_tel} onChange={e=>sForm(p=>({...p,contacto_tel:e.target.value}))} style={inp} placeholder="+54 9 ..."/></div>
        </div>
        {/* Status + dates */}
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Estado</label><select value={form.status} onChange={e=>sForm(p=>({...p,status:e.target.value}))} style={inp}>{Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}</select></div>
          <div><label style={lbl}>Inicio contrato</label><input type="date" value={form.start_date} onChange={e=>sForm(p=>({...p,start_date:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Fin contrato</label><input type="date" value={form.end_date} onChange={e=>sForm(p=>({...p,end_date:e.target.value}))} style={inp}/></div>
        </div>
        {/* Notes */}
        <div style={{marginBottom:12}}><label style={lbl}>Notas</label><textarea value={form.notas} onChange={e=>sForm(p=>({...p,notas:e.target.value}))} rows={3} style={{...inp,resize:"vertical" as const}} placeholder="Detalles adicionales..."/></div>
        {/* Actions */}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn>
          <Btn v="pu" s="s" disabled={!form.nombre.trim()} onClick={saveForm}>{editId?"💾 Guardar Cambios":"✅ Crear Sponsor"}</Btn>
        </div>
      </div>
    </div>}

    {/* ── Sponsor Cards Grid ── */}
    {vis.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin sponsors{(fTier!=="all"||fSt!=="all"||search)?" con esos filtros":""}</div></Card>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
      {vis.map((sp:any)=>{const t=SPON_TIER[sp.tier]||SPON_TIER.colaborador;const st=SPON_ST[sp.status]||SPON_ST.inactivo;const dl=daysLeft(sp.end_date);const isExp=dl>=0&&dl<=30&&sp.status==="activo";const isOpen=expandId===sp.id;
        return(<Card key={sp.id} style={{padding:0,overflow:"hidden",borderLeft:"4px solid "+t.c,cursor:"pointer",transition:"box-shadow .2s",boxShadow:isOpen?"0 4px 16px rgba(0,0,0,.1)":"none"}} onClick={()=>sExpandId(isOpen?null:sp.id)}>
          <div style={{padding:"12px 14px"}}>
            {/* Top row: tier badge + status */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{background:t.bg,color:t.c,padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700}}>{t.i} {t.l}</span>
              <span style={{background:st.bg,color:st.c,padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{st.l}</span>
            </div>
            {/* Company name */}
            <div style={{fontSize:15,fontWeight:800,color:colors.nv,marginBottom:2}}>{sp.nombre}</div>
            {/* Contact info */}
            {sp.contacto_nombre&&<div style={{fontSize:11,color:colors.g5}}>👤 {sp.contacto_nombre}{sp.contacto_email?" · "+sp.contacto_email:""}</div>}
            {/* Amount */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
              <span style={{fontSize:16,fontWeight:800,color:sp.status==="activo"?colors.gn:colors.nv}}>${Number(sp.monto||0).toLocaleString()} <span style={{fontSize:10,fontWeight:600,color:colors.g4}}>{sp.moneda||"ARS"}</span></span>
              {/* Contract dates */}
              {sp.start_date&&<span style={{fontSize:10,color:colors.g5}}>{fmtD(sp.start_date)} → {sp.end_date?fmtD(sp.end_date):"∞"}</span>}
            </div>
            {/* Days remaining + expiry warning */}
            {sp.end_date&&sp.status==="activo"&&<div style={{marginTop:4}}>
              {dl<0?<span style={{fontSize:10,fontWeight:700,color:"#DC2626",background:"#FEE2E2",padding:"2px 6px",borderRadius:8}}>⛔ Vencido hace {Math.abs(dl)} dias</span>
              :isExp?<span style={{fontSize:10,fontWeight:700,color:"#D97706",background:"#FEF3C7",padding:"2px 6px",borderRadius:8}}>⚠️ Vence en {dl} dias</span>
              :<span style={{fontSize:10,color:colors.g4}}>{dl} dias restantes</span>}
            </div>}
          </div>

          {/* ── Expanded inline edit ── */}
          {isOpen&&<div style={{borderTop:"1px solid "+colors.g2,padding:"12px 14px",background:isDark?"rgba(255,255,255,.03)":"#FAFAFA"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
              <div><label style={lbl}>Tier</label><select value={sp.tier} onChange={e=>inlineUpd(sp,"tier",e.target.value)} style={inp}>{Object.keys(SPON_TIER).map(k=><option key={k} value={k}>{SPON_TIER[k].i} {SPON_TIER[k].l}</option>)}</select></div>
              <div><label style={lbl}>Estado</label><select value={sp.status} onChange={e=>inlineUpd(sp,"status",e.target.value)} style={inp}>{Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:8}}>
              <div><label style={lbl}>Monto</label><input type="number" value={sp.monto||""} onChange={e=>inlineUpd(sp,"monto",Number(e.target.value)||0)} style={inp}/></div>
              <div><label style={lbl}>Moneda</label><select value={sp.moneda||"ARS"} onChange={e=>inlineUpd(sp,"moneda",e.target.value)} style={inp}>{MONEDAS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
              <div><label style={lbl}>Inicio</label><input type="date" value={sp.start_date||""} onChange={e=>inlineUpd(sp,"start_date",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Fin</label><input type="date" value={sp.end_date||""} onChange={e=>inlineUpd(sp,"end_date",e.target.value)} style={inp}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
              <div><label style={lbl}>Contacto</label><input value={sp.contacto_nombre||""} onChange={e=>inlineUpd(sp,"contacto_nombre",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Email</label><input value={sp.contacto_email||""} onChange={e=>inlineUpd(sp,"contacto_email",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Telefono</label><input value={sp.contacto_tel||""} onChange={e=>inlineUpd(sp,"contacto_tel",e.target.value)} style={inp}/></div>
            </div>
            <div style={{marginBottom:8}}><label style={lbl}>Notas</label><textarea value={sp.notas||""} onChange={e=>inlineUpd(sp,"notas",e.target.value)} rows={2} style={{...inp,resize:"vertical" as const}}/></div>
            <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
              {confirmDel===sp.id
                ?<div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:11,color:"#DC2626",fontWeight:600}}>Confirmar?</span><Btn v="r" s="s" onClick={()=>{onDel(sp.id);sConfirmDel(null);sExpandId(null);}}>Si, eliminar</Btn><Btn v="g" s="s" onClick={()=>sConfirmDel(null)}>No</Btn></div>
                :<Btn v="r" s="s" onClick={()=>sConfirmDel(sp.id)}>🗑️ Eliminar</Btn>}
              <Btn v="pu" s="s" onClick={()=>openEdit(sp)}>✏️ Editar completo</Btn>
            </div>
          </div>}
        </Card>);})}
    </div>

    {/* ── Summary: Revenue breakdown by tier ── */}
    {all.length>0&&<Card style={{padding:14,marginTop:18}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:12}}>📊 Resumen de Revenue por Tier</div>
      {Object.keys(SPON_TIER).map(k=>{const t=SPON_TIER[k];const tierSpons=all.filter((s:any)=>s.tier===k);const tierActive=tierSpons.filter((s:any)=>s.status==="activo");const tierRev=tierActive.reduce((s:number,sp:any)=>s+Number(sp.monto||0),0);const totalAll=all.filter((s:any)=>s.status==="activo").reduce((s:number,sp:any)=>s+Number(sp.monto||0),0)||1;const pct=Math.round(tierRev/totalAll*100);
        return(<div key={k} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
            <span style={{fontWeight:600,color:colors.nv}}>{t.i} {t.l} <span style={{color:colors.g4,fontWeight:400}}>({tierSpons.length} sponsors, {tierActive.length} activos)</span></span>
            <span style={{fontWeight:700,color:t.c}}>${tierRev.toLocaleString()} <span style={{fontSize:9,fontWeight:500,color:colors.g4}}>({pct}%)</span></span>
          </div>
          <div style={{height:10,background:isDark?"rgba(255,255,255,.06)":colors.g2,borderRadius:5,overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:t.c,borderRadius:5,transition:"width .4s"}}/>
          </div>
        </div>);})}
      <div style={{borderTop:"1px solid "+colors.g2,paddingTop:8,marginTop:4,display:"flex",justifyContent:"space-between",fontSize:12}}>
        <span style={{fontWeight:700,color:colors.nv}}>Total Revenue Activos</span>
        <span style={{fontWeight:800,color:colors.gn}}>${totalRev.toLocaleString()}</span>
      </div>
    </Card>}
  </div>);
}
