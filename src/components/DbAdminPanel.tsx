"use client";

import React, { useState } from "react";
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
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
  const [showSql, setShowSql] = useState(false);
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

    try {
      const res = await fetch("/api/db-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.academicNotice || data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error de red");
    } finally {
      await onRefreshStatus();
      setLoading(false);
    }
  };

  const removeConstraint = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/db-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error de red");
    } finally {
      await onRefreshStatus();
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (
      !confirm(
        "Esta accion eliminara todas las citas de prueba. Los datos de pacientes y medicos se conservaran.",
      )
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reset-data", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error);
      } else {
        await onRefreshData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error de red");
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
                Panel de Control
              </h2>
              <p className="text-xs text-[#858585]">
                Integridad de Datos
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              setLoading(true);
              await onRefreshStatus();
              setLoading(false);
            }}
            title="Refrescar estado"
            disabled={loading}
            className="p-1.5 text-[#858585] hover:text-[#cccccc] bg-[#2d2d2d] border border-[#3c3c3c] hover:bg-[#3c3c3c] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Estado de proteccion */}
        <div className="mb-5 p-4 border border-[#3c3c3c] bg-[#1e1e1e]">
          <div className="text-xs text-[#858585] uppercase font-semibold tracking-wider mb-2">
            Estado del Sistema
          </div>
          {hasConstraint ? (
            <div className="flex items-center gap-2 text-[#4ec9b0] font-bold text-sm">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Sistema protegido - Anti-duplicados activo</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#f14c4c] font-bold text-sm">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Sistema vulnerable - Sin proteccion contra duplicados</span>
            </div>
          )}
        </div>

        <p className="text-xs text-[#858585] mb-5 leading-relaxed">
          {hasConstraint
            ? "La proteccion anti-duplicados esta activa. La base de datos rechaza automaticamente cualquier intento de agendar dos citas en el mismo horario con el mismo medico."
            : "No hay proteccion activa. El sistema depende de la validacion del codigo, la cual falla bajo carga concurrente permitiendo citas duplicadas."}
        </p>

        {/* Interruptor de proteccion */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-[#2d2d2d] border border-[#3c3c3c]">
            <div className="text-xs">
              <div className="font-medium text-[#cccccc]">Proteccion Anti-duplicados</div>
              <div className="text-[#858585] mt-0.5">
                {hasConstraint ? "Activada" : "Desactivada"}
              </div>
            </div>
            <button
              onClick={hasConstraint ? removeConstraint : applyConstraint}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasConstraint ? "bg-[#4ec9b0]" : "bg-[#3c3c3c]"
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasConstraint ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {errorMessage && !hasConstraint && (
          <div className="mb-4 p-3 bg-[#2d2d2d] border border-[#f14c4c]/30 text-[#dcdcaa] rounded text-xs leading-relaxed">
            <span className="font-bold">Error al activar proteccion:</span>
            <p className="mt-1">
              No se puede activar porque ya existen citas duplicadas en la base de datos.
              Primero debes purgar los datos de prueba.
            </p>
          </div>
        )}

        {/* Botones de accion */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <button
            onClick={clearDatabase}
            disabled={loading}
            className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-[#858585] hover:text-[#cccccc] rounded font-medium text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Purgar Datos de Prueba
          </button>
        </div>

        {/* SQL Terminal colapsable */}
        <div className="border border-[#3c3c3c]">
          <button
            onClick={() => setShowSql(!showSql)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#2d2d2d] text-xs text-[#858585] hover:text-[#cccccc] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#569cd6]" />
              <span>Detalle tecnico (SQL)</span>
            </span>
            {showSql ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showSql && (
            <div className="bg-[#1e1e1e] border-t border-[#3c3c3c] p-3 font-mono text-[10px] text-[#6a9955] h-36 overflow-y-auto space-y-1.5">
              {sqlOutput.map((line, i) => (
                <div
                  key={i}
                  className="whitespace-pre-wrap leading-relaxed select-text"
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
