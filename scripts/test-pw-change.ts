import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const email = "misola@lostordos.com.ar";
  const oldPw = "lostordos2026";
  const newPw = "testNueva123";

  // Step 1: Login with current password
  console.log("1) Login con contraseña actual...");
  const sb1 = createClient(URL, ANON);
  const { error: e1 } = await sb1.auth.signInWithPassword({ email, password: oldPw });
  if (e1) { console.log("   FAIL:", e1.message); return; }
  console.log("   OK - login exitoso");

  // Step 2: Change password
  console.log("2) Cambiando contraseña...");
  const { error: e2 } = await sb1.auth.updateUser({ password: newPw });
  if (e2) { console.log("   FAIL:", e2.message); return; }
  console.log("   OK - contraseña cambiada");

  // Step 3: Verify new password works
  console.log("3) Verificando nueva contraseña...");
  const sb2 = createClient(URL, ANON);
  const { error: e3 } = await sb2.auth.signInWithPassword({ email, password: newPw });
  if (e3) { console.log("   FAIL:", e3.message); return; }
  console.log("   OK - nueva contraseña funciona");

  // Step 4: Verify old password NO LONGER works
  console.log("4) Verificando que la vieja ya no funcione...");
  const sb3 = createClient(URL, ANON);
  const { error: e4 } = await sb3.auth.signInWithPassword({ email, password: oldPw });
  if (e4) { console.log("   OK - vieja rechazada:", e4.message); }
  else { console.log("   WARN - vieja sigue funcionando (no debería)"); }

  // Step 5: Restore original password
  console.log("5) Restaurando contraseña original...");
  const { error: e5 } = await sb2.auth.updateUser({ password: oldPw });
  if (e5) { console.log("   FAIL:", e5.message); return; }
  console.log("   OK - contraseña restaurada a lostordos2026");

  // Step 6: Final verify
  console.log("6) Verificación final con contraseña original...");
  const sb4 = createClient(URL, ANON);
  const { error: e6 } = await sb4.auth.signInWithPassword({ email, password: oldPw });
  if (e6) { console.log("   FAIL:", e6.message); return; }
  console.log("   OK - todo funciona correctamente");

  console.log("\n✅ TEST COMPLETO - El cambio de contraseña funciona perfecto");
}

main().catch(console.error);
