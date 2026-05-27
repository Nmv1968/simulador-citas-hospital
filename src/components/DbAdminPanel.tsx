// ============================================================================
// COMPONENTE: DbAdminPanel.tsx (Consola de Administración de Base de Datos)
//
// Permite a los estudiantes interactuar directamente con el esquema
// de PostgreSQL. Muestra el estado del constraint y simula una terminal SQL.
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Database, ShieldAlert, ShieldCheck, Terminal, Trash2, RefreshCw } from 'lucide-react';

interface DbAdminPanelProps {
  hasConstraint: boolean;
  onRefreshStatus: () => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export default function DbAdminPanel({ 
  hasConstraint, 
  onRefreshStatus, 
  onRefreshData 
}: DbAdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [sqlOutput, setSqlOutput] = useState<string[]>(['postgres=# -- Consola de PostgreSQL del Laboratorio', 'postgres=# SELECT check_unique_constraint();', `has_constraint\n--------------\n${hasConstraint ? 't (true)' : 'f (false)'}`]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addTerminalLog = (command: string, result: string, isError = false) => {
    setSqlOutput(prev => [
      ...prev,
      `postgres=# ${command}`,
      isError ? `🔴 [ERROR] ${result}` : `🟢 [RESULT] ${result}`
    ]);
  };

  // Función para aplicar la restricción UNIQUE
  const applyConstraint = async () => {
    setLoading(true);
    setErrorMessage(null);
    const sqlCommand = 'ALTER TABLE appointments ADD CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, appointment_time);';
    
    try {
      const res = await fetch('/api/db-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply' })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        const errText = data.academicNotice 
          ? `${data.error}\n\n🔍 ADVERTENCIA ACADÉMICA:\n${data.academicNotice}`
          : data.error || 'Error desconocido';
        
        setErrorMessage(data.academicNotice || data.error);
        addTerminalLog(sqlCommand, errText, true);
      } else {
        addTerminalLog(sqlCommand, 'ALTER TABLE\nRestricción UNIQUE añadida exitosamente. PostgreSQL ahora bloqueará atómicamente combinaciones duplicadas de (médico, fecha, hora).', false);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      addTerminalLog(sqlCommand, err.message || 'Error de red', true);
    } finally {
      await onRefreshStatus();
      setLoading(false);
    }
  };

  // Función para eliminar la restricción UNIQUE
  const removeConstraint = async () => {
    setLoading(true);
    setErrorMessage(null);
    const sqlCommand = 'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS unique_doctor_appointment;';
    
    try {
      const res = await fetch('/api/db-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove' })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setErrorMessage(data.error);
        addTerminalLog(sqlCommand, data.error, true);
      } else {
        addTerminalLog(sqlCommand, 'ALTER TABLE\nRestricción UNIQUE eliminada con éxito. La base de datos es vulnerable a race conditions en operaciones concurrentes.', false);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      addTerminalLog(sqlCommand, err.message || 'Error de red', true);
    } finally {
      await onRefreshStatus();
      setLoading(false);
    }
  };

  // Función para limpiar la base de datos de citas
  const clearDatabase = async () => {
    if (!confirm('¿Estás seguro de que quieres purgar todas las citas? Esta acción vaciará la tabla para reiniciar el laboratorio.')) {
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    const sqlCommand = 'TRUNCATE TABLE appointments RESTART IDENTITY CASCADE;';
    
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setErrorMessage(data.error);
        addTerminalLog(sqlCommand, data.error, true);
      } else {
        addTerminalLog(sqlCommand, 'TRUNCATE TABLE\nTabla de citas vaciada por completo. Secuencias numéricas reiniciadas.', false);
        await onRefreshData();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      addTerminalLog(sqlCommand, err.message || 'Error de red', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Estado de Base de Datos</h2>
              <p className="text-sm text-slate-400">Esquema físico en PostgreSQL</p>
            </div>
          </div>
          
          <button 
            onClick={async () => {
              setLoading(true);
              await onRefreshStatus();
              addTerminalLog('SELECT check_unique_constraint();', `has_constraint\n--------------\n${!hasConstraint ? 'f (false)' : 't (true)'}`);
              setLoading(false);
            }} 
            title="Refrescar estado de conexión"
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* VISUAL BADGE DE ESTADO */}
        <div className="mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 transition-all duration-300 bg-slate-950/40 border-slate-850">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs text-slate-450 uppercase font-semibold tracking-wider mb-1">Estado de Integridad</div>
            {hasConstraint ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base md:text-lg">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <span>🟢 Protegido (Restricción UNIQUE Activa)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base md:text-lg">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>🔴 Vulnerable (Sin Restricción UNIQUE)</span>
              </div>
            )}
          </div>
        </div>

        {/* EXPLICACIÓN DE ESTADO */}
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {hasConstraint ? (
            'La base de datos tiene activa la regla física de que un médico no puede estar en dos citas a la vez. PostgreSQL protegerá la integridad atómicamente, abortando duplicados bajo concurrencia.'
          ) : (
            'No hay reglas en la base de datos que impidan duplicidad. El sistema depende de la validación del código. Las solicitudes concurrentes pueden sobrepasar esta validación, generando citas duplicadas reales.'
          )}
        </p>

        {/* CONTROLES DE LA BASE DE DATOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {!hasConstraint ? (
            <button
              onClick={applyConstraint}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs md:text-sm shadow-lg shadow-emerald-900/10 transition-colors disabled:opacity-50"
            >
              Activar UNIQUE (Corregir)
            </button>
          ) : (
            <button
              onClick={removeConstraint}
              disabled={loading}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-xs md:text-sm shadow-lg shadow-rose-900/10 transition-colors disabled:opacity-50"
            >
              Desactivar UNIQUE (Exponer)
            </button>
          )}

          <button
            onClick={clearDatabase}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-700/60 text-slate-200 hover:text-white rounded-lg font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            Limpiar Citas
          </button>
        </div>

        {/* CUADRO DE NOTIFICACIÓN ACADÉMICA DE ERROR */}
        {errorMessage && !hasConstraint && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-lg text-xs leading-relaxed">
            <span className="font-bold">⚠️ Consecuencia de Inconsistencia:</span>
            <p className="mt-1">
              No puedes añadir la restricción `UNIQUE` porque ya existen citas duplicadas en la tabla `appointments`.
              PostgreSQL protege el esquema e impide aplicar reglas de integridad sobre datos corruptos. Debes presionar <span className="font-bold">"Limpiar Citas"</span> primero.
            </p>
          </div>
        )}
      </div>

      {/* TERMINAL POSTGRESQL SIMULADA */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-450 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Terminal SQL de PostgreSQL</span>
        </div>
        <div className="bg-slate-950/95 border border-slate-800 rounded-lg p-3 font-mono text-[10px] sm:text-xs text-slate-300 h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
          {sqlOutput.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap leading-relaxed select-text">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
