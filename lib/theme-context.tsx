"use client";
import { createContext, useContext } from "react";
import { T } from "@/lib/constants";

export const ThemeCtx = createContext<{colors:typeof T;isDark:boolean;cardBg:string}>({colors:T,isDark:false,cardBg:"#fff"});
export const useC = () => useContext(ThemeCtx);
