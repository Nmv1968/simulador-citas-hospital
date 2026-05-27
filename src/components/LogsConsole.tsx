"use client";

import React, { useEffect, useRef } from "react";
import { Terminal, Cpu } from "lucide-react";
import { LogEntry } from "@/types";

interface LogsConsoleProps {
  logs: LogEntry[];
  simulating: boolean;
}

export default function LogsConsole({ logs, simulating }: LogsConsoleProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="bg-[#252526] border border-[#3c3c3c] p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#cccccc]">
            Registro de Actividad
          </h2>
          <p className="text-xs text-[#858585]">
            Logs del servidor de reservas
          </p>
        </div>
      </div>

      <div className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] p-4 font-mono text-[10px] sm:text-xs h-96 overflow-y-auto flex flex-col justify-between select-text">
        <div className="space-y-1.5">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-80 text-[#858585] space-y-3">
              <Cpu className="w-8 h-8 text-[#6e6e6e]" />
              <p className="max-w-xs text-xs sm:text-sm">
                {simulating
                  ? "Procesando solicitudes concurrentes..."
                  : 'Esperando prueba de carga... Usa el panel "Probar Concurrencia" para simular multiples reservas simultaneas.'}
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              let colorClass = "text-[#858585]";

              if (log.type === "warn") {
                colorClass = "text-[#dcdcaa]";
              } else if (log.type === "success") {
                colorClass = "text-[#4ec9b0]";
              } else if (log.type === "error") {
                colorClass = "text-[#f14c4c]";
              } else if (log.type === "info") {
                colorClass = "text-[#569cd6]";
              }

              let level = "INFO";
              if (log.type === "warn") level = "WARN";
              else if (log.type === "success") level = "OK";
              else if (log.type === "error") level = "ERROR";

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 py-0.5 leading-relaxed transition-all ${colorClass}`}
                >
                  <span className="text-[#6e6e6e] flex-shrink-0 select-none">
                    [{log.time}]
                  </span>
                  <span className="text-[#6e6e6e] flex-shrink-0 select-none w-10">
                    {level}
                  </span>
                  <span className="break-all">{log.msg}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-[#2d2d2d] border border-[#3c3c3c] text-[10px] text-[#858585] leading-relaxed font-mono">
          <span className="text-[#858585]">
            Para depuracion: observa los timestamps y busca solicitudes que se solapen en el mismo milisegundo. Esa es la ventana donde ocurre la condicion de carrera.
          </span>
        </div>
      )}
    </div>
  );
}
