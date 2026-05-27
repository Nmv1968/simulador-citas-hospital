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
            Consola de Eventos Simultaneos
          </h2>
          <p className="text-xs text-[#858585]">
            Linea de tiempo de hilos de ejecucion
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
                  ? "Gatillando peticiones concurrentes a la API..."
                  : 'Esperando ejecucion del experimento... Elige tus opciones y presiona "Simular Race Condition".'}
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              let colorClass = "text-[#858585]";

              if (log.type === "warn") {
                colorClass = "text-[#dcdcaa]";
              } else if (log.type === "success") {
                colorClass = "text-[#6a9955]";
              } else if (log.type === "error") {
                colorClass = "text-[#f14c4c]";
              } else if (log.type === "info") {
                if (log.msg.includes("CHECK")) {
                  colorClass = "text-[#569cd6]";
                } else if (log.msg.includes("USE")) {
                  colorClass = "text-[#ce9178]";
                }
              }

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 py-0.5 leading-relaxed transition-all ${colorClass}`}
                >
                  <span className="text-[#6e6e6e] flex-shrink-0 select-none">
                    [{log.time}]
                  </span>
                  <span className="text-[#858585] select-none shrink-0">$</span>
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
          <span className="font-bold text-[#569cd6]">
            Pauta de Analisis para Estudiantes:
          </span>
          <p className="mt-1">
            Examina los milisegundos: nota como multiples procesos de{" "}
            <span className="text-[#569cd6]">CHECK (Busqueda)</span> se solaparon
            antes de que el primero llegara a{" "}
            <span className="text-[#ce9178]">USE (Insercion)</span>. Eso expone
            el intervalo temporal vulnerable.
          </p>
        </div>
      )}
    </div>
  );
}
