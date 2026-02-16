"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";

export class ErrorBoundary extends Component<{children:ReactNode},{hasError:boolean;error:Error|null}>{
  constructor(props:{children:ReactNode}){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error:Error){return{hasError:true,error};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error("ErrorBoundary caught:",error,info);}
  render(){if(this.state.hasError)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F7F8FA",fontFamily:"-apple-system,sans-serif"}}><div style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:12}}>⚠️</div><h2 style={{margin:"0 0 8px",fontSize:18,color:"#0A1628"}}>Algo salió mal</h2><p style={{fontSize:13,color:"#5A6577",marginBottom:16}}>{this.state.error?.message||"Error inesperado"}</p><button onClick={()=>this.setState({hasError:false,error:null})} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#0A1628",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Reintentar</button></div></div>);return this.props.children;}
}
