"use client";

import React from "react";
import { History, ShieldAlert, ShieldCheck } from "lucide-react";
import { SimulationResult } from "@/types";

interface ExperimentalResultsProps {
  simulations: SimulationResult[];
  loading: boolean;
}

export default function ExperimentalResults({
  simulations,
  loading,
}: ExperimentalResultsProps) {
  return (
    <div className="bg-[#252526] border border-[#3c3c3c] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#cccccc]">
            Historial de Pruebas de Carga
          </h2>
          <p className="text-xs text-[#858585]">
            Registro de pruebas de concurrencia ejecutadas
          </p>
        </div>
      </div>

      {simulations.length === 0 ? (
        <div className="text-center py-12 text-[#858585] border border-dashed border-[#3c3c3c]">
          <History className="w-8 h-8 text-[#6e6e6e] mx-auto mb-2" />
          <p className="text-sm">
            No hay pruebas registradas.
          </p>
          <p className="text-xs text-[#858585] mt-1">
            Los resultados de cada prueba de carga se guardaran automaticamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#3c3c3c]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2d2d2d] border-b border-[#3c3c3c] text-xs font-semibold text-[#858585] uppercase tracking-wider">
                <th className="p-3 text-center select-none w-20">Prueba #</th>
                <th className="p-3">Estado del Sistema</th>
                <th className="p-3 text-center">Concurrencia</th>
                <th className="p-3 text-center">Fallos de Integridad</th>
                <th className="p-3 text-center">Citas Creadas</th>
                <th className="p-3 text-center">Tiempo Total</th>
                <th className="p-3 text-center">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c3c3c]/60 text-sm">
              {simulations.map((sim) => {
                const isVulnerable = sim.mode.toLowerCase() === "vulnerable";
                const hasDuplications = sim.duplicates_generated > 0;

                return (
                  <tr
                    key={sim.id}
                    className="bg-[#1e1e1e] hover:bg-[#2a2d2e] text-[#cccccc] transition-colors"
                  >
                    <td className="p-3 text-center font-bold text-[#858585] font-mono">
                      #{sim.test_number}
                    </td>

                    <td className="p-3">
                      {isVulnerable ? (
                        <div className="inline-flex items-center gap-1.5 text-[#f14c4c] font-bold text-xs">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>Sin proteccion</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[#4ec9b0] font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                          <span>Con proteccion</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center font-mono font-semibold text-[#cccccc]">
                      {sim.concurrent_requests} requests
                    </td>

                    <td
                      className={`p-3 text-center font-mono font-bold ${hasDuplications ? "text-[#f14c4c]" : "text-[#858585]"}`}
                    >
                      {sim.duplicates_generated}
                    </td>

                    <td className="p-3 text-center font-mono text-[#cccccc]">
                      {sim.successful_appointments} citas
                    </td>

                    <td className="p-3 text-center font-mono text-[#cccccc]">
                      {sim.execution_time_ms} ms
                    </td>

                    <td className="p-3 text-center font-mono text-xs text-[#858585]">
                      {new Date(sim.created_at).toLocaleString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
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
