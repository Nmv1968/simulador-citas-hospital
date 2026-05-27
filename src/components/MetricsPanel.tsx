// ============================================================================
// COMPONENTE: MetricsPanel.tsx (Panel de Métricas Científicas)
//
// Muestra las métricas agregadas obtenidas tras ejecutar el experimento.
// Cuantifica de forma inequívoca el nivel de corrupción de datos.
// ============================================================================

'use client';

import React from 'react';
import { BarChart3, AlertTriangle, ShieldCheck, Zap, Server, CheckCircle2, XCircle } from 'lucide-react';
import { SimulationMetrics } from '@/types';

interface MetricsPanelProps {
  metrics: SimulationMetrics | null;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md h-full flex flex-col justify-center items-center text-center text-slate-500 py-12">
        <BarChart3 className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
        <h3 className="font-bold text-slate-350 text-sm md:text-base">Métricas del Experimento</h3>
        <p className="text-xs max-w-xs mt-1 leading-relaxed">
          Los resultados analíticos y las mediciones de integridad de datos aparecerán aquí una vez inicies una simulación.
        </p>
      </div>
    );
  }

  const isCorrupted = metrics.duplicateCount > 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Resultados del Experimento</h2>
            <p className="text-sm text-slate-400">Análisis cuantitativo de consistencia</p>
          </div>
        </div>

        {/* ALERTA DE INTEGRIDAD */}
        <div className="mb-6">
          {isCorrupted ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/35 rounded-xl flex items-center gap-3 text-rose-350 animate-pulse">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm">⚠️ BASE DE DATOS INCONSISTENTE</span>
                Se permitieron {metrics.duplicateCount} registros físicamente idénticos de cita para el mismo médico, misma fecha y hora. ¡Datos corruptos!
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/35 rounded-xl flex items-center gap-3 text-emerald-350">
              <ShieldCheck className="w-6 h-6 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm">🟢 INTEGRIDAD ABSOLUTA</span>
                La base de datos rechazó con éxito todas las peticiones redundantes. Cero duplicados creados. ¡Consistencia total garantizada!
              </div>
            </div>
          )}
        </div>

        {/* GRILLA DE TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* TOTAL REQUESTS */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center">
            <div className="text-[10px] text-slate-450 uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Solicitudes
            </div>
            <div className="text-2xl font-black text-slate-100 font-mono">{metrics.totalRequests}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Enviadas en paralelo</div>
          </div>

          {/* TOTAL APPOINTMENTS IN DB */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center">
            <div className="text-[10px] text-slate-450 uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Filas Creadas
            </div>
            <div className="text-2xl font-black text-slate-100 font-mono">{metrics.createdCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Registros físicos en DB</div>
          </div>

          {/* DUPLICATES DETECTED */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center">
            <div className="text-[10px] text-slate-450 uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-450" />
              Duplicados
            </div>
            <div className={`text-2xl font-black font-mono ${isCorrupted ? 'text-rose-400' : 'text-slate-400'}`}>
              {metrics.duplicateCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Registros redundantes</div>
          </div>

          {/* PERCENTAGE OF CORRUPTION */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center">
            <div className="text-[10px] text-slate-450 uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Duplicidad %
            </div>
            <div className={`text-2xl font-black font-mono ${isCorrupted ? 'text-rose-400' : 'text-slate-400'}`}>
              {metrics.duplicatePercent}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Tasa de corrupción</div>
          </div>
        </div>
      </div>

      {/* METRICAS DE PROCESAMIENTO SECUNDARIAS */}
      <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3 font-mono text-xs text-slate-350">
        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
          <span className="text-slate-450">Velocidad de Lote:</span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-350 fill-amber-350/15" />
            <span>{metrics.avgTimeMs} ms / req</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-450">Éxitos de API (200 OK):</span>
          <span className="text-emerald-450 font-bold">{metrics.successCount} peticiones</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-450">Bloqueos de API (4xx):</span>
          <span className="text-rose-400 font-bold">{metrics.failedCount} peticiones</span>
        </div>
      </div>
    </div>
  );
}
