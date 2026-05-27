// ============================================================================
// COMPONENTE: TechnicalExplainer.tsx (Explicador Teórico del Laboratorio)
//
// Provee una guía interactiva y visual para los estudiantes.
// Explica qué es una Race Condition, TOCTOU y cómo el UNIQUE Constraint
// de PostgreSQL actúa como un validador atómico e infalible.
// ============================================================================

'use client';

import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Cpu, Database, ChevronDown, ChevronUp } from 'lucide-react';

export default function TechnicalExplainer() {
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Guía Teórica de Laboratorio</h2>
          <p className="text-sm text-slate-400">Conceptos de Concurrencia e Integridad de Datos</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* CONCEPTO 1: ¿QUÉ ES UNA RACE CONDITION? */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection(1)}
            className="w-full flex justify-between items-center p-4 bg-slate-800/25 hover:bg-slate-800/40 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-slate-200 text-sm md:text-base">
                1. ¿Qué es una Condición de Carrera (Race Condition)?
              </span>
            </div>
            {openSection === 1 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {openSection === 1 && (
            <div className="p-4 bg-slate-950/40 border-t border-slate-800/50 text-slate-300 text-sm space-y-3 leading-relaxed">
              <p>
                Una <strong>Condición de Carrera</strong> ocurre en sistemas concurrentes cuando el resultado de una operación depende del orden o la sincronización en que se ejecutan los procesos independientes.
              </p>
              <p>
                En desarrollo web, si dos usuarios (o peticiones HTTP) intentan modificar el mismo recurso simultáneamente y el servidor procesa las peticiones en hilos paralelos sin una debida sincronización, el sistema puede terminar en un estado inconsistente e inesperado.
              </p>
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-300/90 rounded-md">
                <strong>💡 Ejemplo de la vida real:</strong> Dos personas ingresando al mismo cajero automático usando la misma cuenta corriente compartida al mismo tiempo, logrando retirar $100 cada uno a pesar de que el saldo de la cuenta era de solo $100.
              </div>
            </div>
          )}
        </div>

        {/* CONCEPTO 2: ¿QUÉ ES EL ANTIPATRÓN TOCTOU? */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection(2)}
            className="w-full flex justify-between items-center p-4 bg-slate-800/25 hover:bg-slate-800/40 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-slate-200 text-sm md:text-base">
                2. ¿Qué significa TOCTOU (Time-of-Check to Time-of-Use)?
              </span>
            </div>
            {openSection === 2 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {openSection === 2 && (
            <div className="p-4 bg-slate-950/40 border-t border-slate-800/50 text-slate-300 text-sm space-y-4 leading-relaxed">
              <p>
                <strong>TOCTOU</strong> es una clase específica de bug de concurrencia y vulnerabilidad lógica. Se traduce como <em>"Tiempo de Verificación al Tiempo de Uso"</em>. Representa la separación temporal entre:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Time-of-Check (Verificación):</strong> El sistema consulta el estado ("¿El horario está disponible?").</li>
                <li><strong className="text-slate-300">Time-of-Use (Uso/Inserción):</strong> El sistema actúa basándose en esa verificación ("Guarda la cita").</li>
              </ul>
              <p>
                Si existe una ventana de tiempo (incluso de unos pocos milisegundos, amplificada por nuestro delay artificial de 1500ms) entre la verificación y el uso, el estado verificado puede cambiar en segundo plano antes de que se ejecute la acción.
              </p>
              
              {/* DIAGRAMA VISUAL HTML */}
              <div className="mt-4 border border-slate-800 rounded-lg p-4 bg-slate-900/80">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">Línea de Tiempo del Conflicto TOCTOU (Modo Vulnerable)</p>
                <div className="space-y-4 text-xs font-mono">
                  {/* FASE 1 */}
                  <div className="flex justify-between items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-indigo-400">0.00s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-slate-200">Petición 1: CHECK (Verifica)</p>
                      <p className="text-[10px] text-slate-500">¿Cita para Dr. Carlos a las 10:00? &rarr; "No existe, LIBRE"</p>
                    </div>
                  </div>
                  {/* FASE 2 */}
                  <div className="flex justify-between items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-pink-400">0.01s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-slate-200">Petición 2: CHECK (Verifica)</p>
                      <p className="text-[10px] text-slate-500">¿Cita para Dr. Carlos a las 10:00? &rarr; "No existe, LIBRE"</p>
                    </div>
                  </div>
                  {/* FASE 3 (DELAY) */}
                  <div className="p-1.5 text-center bg-amber-500/10 border border-amber-500/25 rounded text-amber-300/80 text-[10px]">
                    ⏳ VENTANA DE VULNERABILIDAD (Ambos hilos están esperando y asumen que el horario está libre)
                  </div>
                  {/* FASE 4 */}
                  <div className="flex justify-between items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-indigo-400">1.50s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-slate-200">Petición 1: USE (Inserta)</p>
                      <p className="text-[10px] text-emerald-400">✓ Cita insertada exitosamente</p>
                    </div>
                  </div>
                  {/* FASE 5 */}
                  <div className="flex justify-between items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-pink-400">1.51s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-slate-200">Petición 2: USE (Inserta)</p>
                      <p className="text-[10px] text-amber-400">⚠️ ¡Inserta la cita también! (Nace el Duplicado)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONCEPTO 3: LA SOLUCIÓN UNIQUE */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection(3)}
            className="w-full flex justify-between items-center p-4 bg-slate-800/25 hover:bg-slate-800/40 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-sm md:text-base">
                3. ¿Cómo soluciona esto la Restricción UNIQUE de PostgreSQL?
              </span>
            </div>
            {openSection === 3 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {openSection === 3 && (
            <div className="p-4 bg-slate-950/40 border-t border-slate-800/50 text-slate-300 text-sm space-y-3 leading-relaxed">
              <p>
                Aunque validemos en el código de Next.js, esa validación <strong>no es atómica</strong>. La base de datos es el único árbitro centralizado y concurrente real capaz de garantizar la integridad física de los datos.
              </p>
              <p>
                Al aplicar una **restricción `UNIQUE`** sobre la tupla `(doctor_id, appointment_date, appointment_time)`:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                <li>PostgreSQL crea un índice único bajo el capó.</li>
                <li>Cada intento de inserción bloquea internamente la clave de índice durante la transacción.</li>
                <li>Si dos hilos intentan insertar los mismos valores exactos, el motor de la base de datos permite pasar solo al primero. El segundo hilo chocará atómicamente contra la validación del índice y será rechazado instantáneamente arrojando el error <strong className="text-slate-300">SQLSTATE 23505 (Unique Violation)</strong>.</li>
              </ul>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-300/90 rounded-md">
                <strong>📝 Conclusión Pedagógica:</strong> La seguridad de la información debe estar resguardada en la capa de datos. Las validaciones de software (frontend/backend) son útiles para la experiencia de usuario, pero las restricciones de base de datos son la única garantía real de consistencia en entornos de alto tráfico concurrente.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
