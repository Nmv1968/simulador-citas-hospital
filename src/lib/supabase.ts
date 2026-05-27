// ============================================================================
// CONFIGURACIÓN DEL CLIENTE DE SUPABASE
//
// Este archivo inicializa el cliente oficial de Supabase. El cliente nos permite
// realizar consultas (SELECT, INSERT, UPDATE, DELETE) y ejecutar funciones
// RPC de PostgreSQL desde nuestra aplicación Next.js.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

// Extraemos las variables de entorno configuradas en '.env.local'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Si las variables no están configuradas, mostramos una advertencia amigable.
// Esto ayuda a los estudiantes a diagnosticar problemas de conexión iniciales.
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("tu-proyecto")) {
  console.warn(
    "⚠️ ADVERTENCIA ACADÉMICA: Las credenciales de Supabase no están configuradas. " +
      "Por favor, copia las llaves reales de tu panel de Supabase en el archivo .env.local.",
  );
}

// Inicializamos y exportamos el cliente único de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
