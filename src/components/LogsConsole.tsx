// ============================================================================
// COMPONENTE: LogsConsole.tsx (Consola de Logs de Concurrencia)
//
// Renderiza un cuadro estilo terminal retro para pintar la secuencia de eventos
// ordenados por milisegundos, evidenciando el solapamiento de los procesos.
// ============================================================================

'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu } from 'lucide-react';
import { LogEntry } from '@/types';

interface LogsConsoleProps {
  logs: LogEntry[];
  simulating: boolean;
}

export default function LogsConsole({ logs, simulating }: LogsConsoleProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final de la terminal cuando lleguen nuevos logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Terminal className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Consola de Eventos Simultáneos</h2>
          <p className="text-sm text-slate-400">Línea de tiempo de hilos de ejecución</p>
        </div>
      </div>

      {/* TERMINAL CONTENEDOR */}
      <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[10px] sm:text-xs h-96 overflow-y-auto flex flex-col justify-between scrollbar-thin select-text">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-80 text-slate-500 space-y-3">
              <Cpu className="w-8 h-8 text-slate-650 animate-pulse" />
              <p className="max-w-xs text-xs sm:text-sm">
                {simulating 
                  ? 'Gatillando peticiones concurrentes a la API...' 
                  : 'Esperando ejecución del experimento... Elige tus opciones y presiona "Simular Race Condition".'}
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              // Definir colores según el tipo de log
              let colorClass = 'text-slate-350';
              let badge = '⚙️';
              
              if (log.type === 'warn') {
                colorClass = 'text-amber-400 font-semibold';
                badge = '⏳';
              } else if (log.type === 'success') {
                colorClass = 'text-emerald-450 font-semibold';
                badge = '🟢';
              } else if (log.type === 'error') {
                colorClass = 'text-rose-400 font-bold';
                badge = '🛑';
              } else if (log.type === 'info') {
                if (log.msg.includes('CHECK')) {
                  colorClass = 'text-cyan-400';
                  badge = '🔍';
                } else if (log.msg.includes('USE')) {
                  colorClass = 'text-violet-400';
                  badge = '📝';
                }
              }

              return (
                <div key={index} className={`flex items-start gap-2 py-0.5 leading-relaxed transition-all ${colorClass}`}>
                  <span className="text-slate-500 flex-shrink-0 select-none">[{log.time}]</span>
                  <span className="flex-shrink-0 select-none">{badge}</span>
                  <span className="break-all">{log.msg}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
      
      {/* EXPLICACIÓN DIDÁCTICA AL PIE */}
      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-850 text-[10px] text-slate-400 leading-relaxed font-mono">
          <span className="font-bold text-indigo-400">💡 Pauta de Análisis para Estudiantes:</span>
          <p className="mt-1">
            Examina los milisegundos: nota cómo múltiples procesos de <span className="text-cyan-400">CHECK (Búsqueda)</span> se solaparon antes de que el primero llegara a <span className="text-violet-400">USE (Inserción)</span>. Eso expone el intervalo temporal vulnerable.
          </p>
        </div>
      )}
    </div>
  );
}
