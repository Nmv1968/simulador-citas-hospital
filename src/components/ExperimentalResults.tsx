// ============================================================================
// COMPONENTE: ExperimentalResults.tsx (Bitácora Científica del Laboratorio)
//
// Muestra el historial de todas las pruebas realizadas, facilitando el análisis
// comparativo de integridad y rendimiento para reportes de laboratorio.
// ============================================================================

'use client';

import React from 'react';
import { History, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SimulationResult } from '@/types';

interface ExperimentalResultsProps {
  simulations: SimulationResult[];
  loading: boolean;
}

export default function ExperimentalResults({
  simulations,
  loading
}: ExperimentalResultsProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Bitácora Científica de Pruebas</h2>
          <p className="text-sm text-slate-400">Historial histórico de simulaciones concurrentes</p>
        </div>
      </div>

      {simulations.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <History className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
          <p className="text-sm">La bitácora de experimentos se encuentra vacía.</p>
          <p className="text-xs text-slate-550 mt-1">
            Los resultados de cada simulación se guardarán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-850">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-850 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 text-center select-none w-20">Test #</th>
                <th className="p-4">Modo Probado</th>
                <th className="p-4 text-center">Concurrencia (Reqs)</th>
                <th className="p-4 text-center">Duplicados Generados</th>
                <th className="p-4 text-center">Citas Guardadas</th>
                <th className="p-4 text-center">Tiempo Total</th>
                <th className="p-4 text-center">Fecha y Hora de Prueba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm">
              {simulations.map((sim) => {
                const isVulnerable = sim.mode.toLowerCase() === 'vulnerable';
                const hasDuplications = sim.duplicates_generated > 0;

                return (
                  <tr
                    key={sim.id}
                    className="bg-transparent hover:bg-slate-800/20 text-slate-350 transition-colors"
                  >
                    {/* TEST NUMBER */}
                    <td className="p-4 text-center font-bold text-slate-400 font-mono">
                      #{sim.test_number}
                    </td>

                    {/* MODO PROBADO */}
                    <td className="p-4">
                      {isVulnerable ? (
                        <div className="inline-flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>🔴 Vulnerable (Sin UNIQUE)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-emerald-450 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                          <span>🟢 Corregido (UNIQUE Activo)</span>
                        </div>
                      )}
                    </td>

                    {/* CONCURRENCY */}
                    <td className="p-4 text-center font-mono font-semibold text-slate-200">
                      {sim.concurrent_requests} requests
                    </td>

                    {/* DUPLICADOS DETECTADOS */}
                    <td className={`p-4 text-center font-mono font-bold ${hasDuplications ? 'text-rose-400' : 'text-slate-450'}`}>
                      {sim.duplicates_generated}
                    </td>

                    {/* SUCCESSFUL PHYSICAL ROWS IN DB */}
                    <td className="p-4 text-center font-mono text-slate-300">
                      {sim.successful_appointments} citas
                    </td>

                    {/* TIME TAKEN */}
                    <td className="p-4 text-center font-mono text-slate-300">
                      {sim.execution_time_ms} ms
                    </td>

                    {/* DATE OF TEST */}
                    <td className="p-4 text-center font-mono text-xs text-slate-500">
                      {new Date(sim.created_at).toLocaleString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
