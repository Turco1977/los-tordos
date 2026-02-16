"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { SC, ROLES, fn } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { Badge } from "@/components/ui";

interface CmdItem {
  id: string;
  label: string;
  icon: string;
  category: "nav"|"action"|"task"|"user";
  action: () => void;
  keywords?: string;
  badge?: string;
}

export function CommandPalette({open,onClose,items}:{open:boolean;onClose:()=>void;items:CmdItem[]}){
  const{colors,isDark,cardBg}=useC();
  const [q,sQ]=useState("");
  const [idx,sIdx]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(()=>{if(open){sQ("");sIdx(0);setTimeout(()=>inputRef.current?.focus(),50);}}, [open]);

  // Close on Escape
  useEffect(()=>{
    if(!open)return;
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[open,onClose]);

  // Body scroll lock
  useEffect(()=>{
    if(open){document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};}
  },[open]);

  const filtered=useMemo(()=>{
    if(!q.trim())return items;
    const s=q.toLowerCase();
    return items.filter(i=>(i.label+i.icon+(i.keywords||"")+(i.category)).toLowerCase().includes(s));
  },[q,items]);

  // Clamp index
  useEffect(()=>{if(idx>=filtered.length)sIdx(Math.max(0,filtered.length-1));},[filtered.length,idx]);

  const handleKey=(e:React.KeyboardEvent)=>{
    if(e.key==="ArrowDown"){e.preventDefault();sIdx(i=>Math.min(i+1,filtered.length-1));}
    else if(e.key==="ArrowUp"){e.preventDefault();sIdx(i=>Math.max(i-1,0));}
    else if(e.key==="Enter"&&filtered[idx]){e.preventDefault();filtered[idx].action();onClose();}
  };

  // Scroll selected into view
  const listRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=listRef.current?.children[idx] as HTMLElement;
    if(el)el.scrollIntoView({block:"nearest"});
  },[idx]);

  if(!open)return null;

  // Group by category
  const cats:{nav:string;action:string;task:string;user:string}={nav:"Navegacion",action:"Acciones",task:"Tareas",user:"Personas"};
  const groups=filtered.reduce((acc,item)=>{
    if(!acc[item.category])acc[item.category]=[];
    acc[item.category].push(item);
    return acc;
  },{} as Record<string,CmdItem[]>);

  let globalIdx=-1;

  return(<div style={{position:"fixed",inset:0,background:"rgba(10,22,40,.55)",zIndex:2000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"min(20vh,120px)"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:cardBg,borderRadius:14,boxShadow:"0 8px 40px rgba(0,0,0,.25)",border:"1px solid "+colors.g2,overflow:"hidden"}}>
      {/* Search input */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderBottom:"1px solid "+colors.g2}}>
        <span style={{fontSize:16,color:colors.g4}}>⌘</span>
        <input ref={inputRef} value={q} onChange={e=>sQ(e.target.value)} onKeyDown={handleKey} placeholder="Buscar comando, seccion o tarea..." style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:colors.nv,fontWeight:500}} autoFocus/>
        <kbd style={{padding:"2px 6px",borderRadius:4,border:"1px solid "+colors.g3,fontSize:9,color:colors.g4,fontWeight:600}}>ESC</kbd>
      </div>
      {/* Results */}
      <div ref={listRef} style={{maxHeight:360,overflowY:"auto",padding:"6px 0"}}>
        {filtered.length===0&&<div style={{padding:"20px 16px",textAlign:"center",color:colors.g4,fontSize:12}}>Sin resultados para &ldquo;{q}&rdquo;</div>}
        {(["nav","action","task","user"] as const).map(cat=>{
          const group=groups[cat];
          if(!group||!group.length)return null;
          return(<div key={cat}>
            <div style={{padding:"6px 16px 2px",fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase",letterSpacing:1}}>{cats[cat]}</div>
            {group.map(item=>{
              globalIdx++;
              const isActive=globalIdx===idx;
              const thisIdx=globalIdx;
              return(<div key={item.id} onMouseEnter={()=>sIdx(thisIdx)} onClick={()=>{item.action();onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",cursor:"pointer",background:isActive?(isDark?"rgba(255,255,255,.08)":colors.nv+"0A"):"transparent",borderLeft:isActive?"3px solid "+colors.bl:"3px solid transparent",transition:"background .1s"}}>
                <span style={{fontSize:16,width:24,textAlign:"center"}}>{item.icon}</span>
                <span style={{flex:1,fontSize:12,fontWeight:isActive?700:500,color:colors.nv}}>{item.label}</span>
                {item.badge&&<Badge s={item.badge} sm/>}
                {item.category==="nav"&&<kbd style={{padding:"1px 5px",borderRadius:3,border:"1px solid "+colors.g3,fontSize:8,color:colors.g4}}>{item.keywords?.split(",")[0]}</kbd>}
              </div>);
            })}
          </div>);
        })}
      </div>
      {/* Footer hint */}
      <div style={{padding:"8px 16px",borderTop:"1px solid "+colors.g2,display:"flex",gap:12,justifyContent:"center"}}>
        <span style={{fontSize:9,color:colors.g4}}>↑↓ Navegar</span>
        <span style={{fontSize:9,color:colors.g4}}>Enter Seleccionar</span>
        <span style={{fontSize:9,color:colors.g4}}>Esc Cerrar</span>
      </div>
    </div>
  </div>);
}
