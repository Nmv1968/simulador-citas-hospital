"use client";

import React, { useState } from "react";
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface DbAdminPanelProps {
  hasConstraint: boolean;
  onRefreshStatus: () => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export default function DbAdminPanel({
  hasConstraint,
  onRefreshStatus,
  onRefreshData,
}: DbAdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [sqlOutput, setSqlOutput] = useState<string[]>([
    "postgres=# -- Consola de PostgreSQL del Laboratorio",
    "postgres=# SELECT check_unique_constraint();",
    `has_constraint\n--------------\n${hasConstraint ? "t (true)" : "f (false)"}`,
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addTerminalLog = (command: string, result: string, isError = false) => {
    setSqlOutput((prev) => [
      ...prev,
      `postgres=# ${command}`,
      isError
        ? `[ERROR] ${result}`
        : `[RESULT] ${result}`,
    ]);
  };

  const applyConstraint = async () => {
    setLoading(true);
    setErrorMessage(null);
    const sqlCommand =
      "ALTER TABLE appointments ADD CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, appointment_time);";

    try {
      const res = await fetch("/api/db-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errText = data.academicNotice
          ? `${data.error}\n\nADVERTENCIA ACADEMICA:\n${data.academicNotice}`
          : data.error || "Error desconocido";

        setErrorMessage(data.academicNotice || data.error);
        addTerminalLog(sqlCommand, errText, true);
      } else {
        addTerminalLog(
          sqlCommand,
          "ALTER TABLE\nRestriccion UNIQUE anadida exitosamente. PostgreSQL bloqueara atomicamente combinaciones duplicadas de (medico, fecha, hora).",
          false,
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      addTerminalLog(sqlCommand, err.message || "Error de red", true);
    } finally {
      await onRefreshStatus();
      setLoading(false);
    }
  };

  const removeConstraint = async () => {
    setLoading(true);
    setErrorMessage(null);
    const sqlCommand =
      "ALTER TABLE appointments DROP CONSTRAINT IF EXISTS unique_doctor_appointment;";

    try {
      const res = await fetch("/api/db-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error);
        addTerminalLog(sqlCommand, data.error, true);
      } else {
        addTerminalLog(
          sqlCommand,
          "ALTER TABLE\nRestriccion UNIQUE eliminada con exito. La base de datos es vulnerable a race conditions en operaciones concurrentes.",
          false,
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      addTerminalLog(sqlCommand, err.message || "Error de red", true);
    } finally {
      await onRefreshStatus();
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (
      !confirm(
        "Estas seguro de que quieres purgar todas las citas? Esta accion vaciara la tabla para reiniciar el laboratorio.",
      )
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const sqlCommand = "TRUNCATE TABLE appointments RESTART IDENTITY CASCADE;";

    try {
      const res = await fetch("/api/reset-data", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error);
        addTerminalLog(sqlCommand, data.error, true);
      } else {
        addTerminalLog(
          sqlCommand,
          "TRUNCATE TABLE\nTabla de citas vaciada por completo. Secuencias numericas reiniciadas.",
          false,
        );
        await onRefreshData();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      addTerminalLog(sqlCommand, err.message || "Error de red", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#252526] border border-[#3c3c3c] p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#cccccc]">
                Estado de Base de Datos
              </h2>
              <p className="text-xs text-[#858585]">
                Esquema fisico en PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              setLoading(true);
              await onRefreshStatus();
              addTerminalLog(
                "SELECT check_unique_constraint();",
                `has_constraint\n--------------\n${!hasConstraint ? "f (false)" : "t (true)"}`,
              );
              setLoading(false);
            }}
            title="Refrescar estado de conexion"
            disabled={loading}
            className="p-1.5 text-[#858585] hover:text-[#cccccc] bg-[#2d2d2d] border border-[#3c3c3c] hover:bg-[#3c3c3c] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mb-5 p-4 border border-[#3c3c3c] bg-[#1e1e1e] flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs text-[#858585] uppercase font-semibold tracking-wider mb-1">
              Estado de Integridad
            </div>
            {hasConstraint ? (
              <div className="flex items-center gap-2 text-[#4ec9b0] font-bold text-sm">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Protegido (Restriccion UNIQUE Activa)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#f14c4c] font-bold text-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Vulnerable (Sin Restriccion UNIQUE)</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-[#858585] mb-5 leading-relaxed">
          {hasConstraint
            ? "La base de datos tiene activa la regla fisica de que un medico no puede estar en dos citas a la vez. PostgreSQL protegera la integridad atomicamente, abortando duplicados bajo concurrencia."
            : "No hay reglas en la base de datos que impidan duplicidad. El sistema depende de la validacion del codigo. Las solicitudes concurrentes pueden sobrepasar esta validacion, generando citas duplicadas reales."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {!hasConstraint ? (
            <button
              onClick={applyConstraint}
              disabled={loading}
              className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded font-medium text-xs transition-colors disabled:opacity-50"
            >
              Activar UNIQUE (Corregir)
            </button>
          ) : (
            <button
              onClick={removeConstraint}
              disabled={loading}
              className="px-4 py-2 bg-[#5a1d1d] hover:bg-[#f14c4c] hover:text-white text-[#f14c4c] rounded font-medium text-xs transition-colors disabled:opacity-50"
            >
              Desactivar UNIQUE (Exponer)
            </button>
          )}

          <button
            onClick={clearDatabase}
            disabled={loading}
            className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-[#858585] hover:text-[#cccccc] rounded font-medium text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Citas
          </button>
        </div>

        {errorMessage && !hasConstraint && (
          <div className="mb-5 p-3 bg-[#2d2d2d] border border-[#f14c4c]/30 text-[#dcdcaa] rounded text-xs leading-relaxed">
            <span className="font-bold">
              Consecuencia de Inconsistencia:
            </span>
            <p className="mt-1">
              No puedes anadir la restriccion UNIQUE porque ya existen citas
              duplicadas en la tabla appointments. PostgreSQL protege el
              esquema e impide aplicar reglas de integridad sobre datos
              corruptos. Debes presionar &quot;Limpiar Citas&quot; primero.
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#858585] uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-[#569cd6]" />
          <span>Terminal SQL de PostgreSQL</span>
        </div>
        <div className="bg-[#1e1e1e] border border-[#3c3c3c] p-3 font-mono text-[10px] sm:text-xs text-[#6a9955] h-40 overflow-y-auto space-y-1.5">
          {sqlOutput.map((line, i) => (
            <div
              key={i}
              className="whitespace-pre-wrap leading-relaxed select-text"
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
