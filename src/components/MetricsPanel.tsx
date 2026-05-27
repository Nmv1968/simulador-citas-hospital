"use client";

import React from "react";
import {
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Server,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { SimulationMetrics } from "@/types";

interface MetricsPanelProps {
  metrics: SimulationMetrics | null;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <div className="bg-[#252526] border border-[#3c3c3c] p-5 flex flex-col justify-center items-center text-center text-[#858585] py-12">
        <BarChart3 className="w-12 h-12 text-[#6e6e6e] mb-3" />
        <h3 className="font-bold text-[#858585] text-sm md:text-base">
          Resultados de la Prueba
        </h3>
        <p className="text-xs max-w-xs mt-1 leading-relaxed">
          Las metricas de la prueba de carga apareceran aqui una vez ejecutes una simulacion concurrente.
        </p>
      </div>
    );
  }

  const hasErrors = metrics.duplicateCount > 0;

  return (
    <div className="bg-[#252526] border border-[#3c3c3c] p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#cccccc]">
              Resultados de la Prueba
            </h2>
            <p className="text-xs text-[#858585]">
              KPIs de integridad del sistema
            </p>
          </div>
        </div>

        <div className="mb-5">
          {hasErrors ? (
            <div className="p-4 bg-[#5a1d1d]/30 border border-[#f14c4c]/40 flex items-center gap-3 text-[#f14c4c]">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm">
                  Inconsistencia detectada
                </span>
                Se crearon {metrics.duplicateCount} registros duplicados para el mismo medico, fecha y hora. La validacion por software no es suficiente bajo concurrencia.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#1e3a2e]/30 border border-[#4ec9b0]/40 flex items-center gap-3 text-[#4ec9b0]">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm">
                  Operacion exitosa
                </span>
                Cero duplicados. El sistema mantuvo la integridad de los datos correctamente.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-4 text-center">
            <div className="text-[10px] text-[#858585] uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <Server className="w-3.5 h-3.5 text-[#569cd6]" />
              Solicitudes
            </div>
            <div className="text-2xl font-black text-[#cccccc] font-mono">
              {metrics.totalRequests}
            </div>
            <div className="text-[10px] text-[#858585] mt-0.5">
              Enviadas en paralelo
            </div>
          </div>

          <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-4 text-center">
            <div className="text-[10px] text-[#858585] uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ec9b0]" />
              Citas Creadas
            </div>
            <div className="text-2xl font-black text-[#cccccc] font-mono">
              {metrics.createdCount}
            </div>
            <div className="text-[10px] text-[#858585] mt-0.5">
              Registros en DB
            </div>
          </div>

          <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-4 text-center">
            <div className="text-[10px] text-[#858585] uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-[#f14c4c]" />
              Duplicados
            </div>
            <div
              className={`text-2xl font-black font-mono ${hasErrors ? "text-[#f14c4c]" : "text-[#858585]"}`}
            >
              {metrics.duplicateCount}
            </div>
            <div className="text-[10px] text-[#858585] mt-0.5">
              Fallos de integridad
            </div>
          </div>

          <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-4 text-center">
            <div className="text-[10px] text-[#858585] uppercase font-semibold tracking-wider mb-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#dcdcaa]" />
              Tasa de Error
            </div>
            <div
              className={`text-2xl font-black font-mono ${hasErrors ? "text-[#f14c4c]" : "text-[#858585]"}`}
            >
              {metrics.duplicatePercent}%
            </div>
            <div className="text-[10px] text-[#858585] mt-0.5">
              Porcentaje de inconsistencia
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-4 space-y-3 font-mono text-xs text-[#858585]">
        <div className="flex justify-between items-center pb-2 border-b border-[#3c3c3c]">
          <span className="text-[#858585]">Tiempo de respuesta promedio:</span>
          <div className="flex items-center gap-1.5 text-[#cccccc]">
            <Zap className="w-3.5 h-3.5 text-[#dcdcaa]" />
            <span>{metrics.avgTimeMs} ms / req</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#858585]">Exitosas (200 OK):</span>
          <span className="text-[#4ec9b0] font-bold">
            {metrics.successCount} peticiones
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#858585]">Rechazadas (4xx):</span>
          <span className="text-[#f14c4c] font-bold">
            {metrics.failedCount} peticiones
          </span>
        </div>
      </div>
    </div>
  );
}
