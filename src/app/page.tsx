"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Doctor,
  Patient,
  Appointment,
  TestResult,
  LogEntry,
  SimulationMetrics,
} from "@/types";
import TechnicalExplainer from "@/components/TechnicalExplainer";
import DbAdminPanel from "@/components/DbAdminPanel";
import ConcurrencySimulator from "@/components/ConcurrencySimulator";
import LogsConsole from "@/components/LogsConsole";
import MetricsPanel from "@/components/MetricsPanel";
import AppointmentsTable from "@/components/AppointmentsTable";
import ExperimentalResults from "@/components/ExperimentalResults";
import AppointmentScheduler from "@/components/AppointmentScheduler";
import {
  Database,
  AlertCircle,
  Play,
  BookOpen,
  Activity,
  Server,
  ArrowLeftRight,
  Bug,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [simulations, setSimulations] = useState<TestResult[]>([]);
  const [hasConstraint, setHasConstraint] = useState<boolean>(false);
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
  const [currentMetrics, setCurrentMetrics] =
    useState<SimulationMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [dbUninitialized, setDbUninitialized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("simulator");
  const [viewMode, setViewMode] = useState<"laboratorio" | "agendador">("laboratorio");

  const refreshConstraintStatus = async () => {
    try {
      const res = await fetch("/api/db-admin");
      if (res.ok) {
        const data = await res.json();
        setHasConstraint(!!data.hasConstraint);
      }
    } catch (err) {
      console.error("Error al consultar estado de la restricción:", err);
    }
  };

  const refreshData = useCallback(async () => {
    try {
      const { data: appts, error: apptsError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          doctor_id,
          patient_id,
          appointment_date,
          appointment_time,
          created_at,
          doctors ( id, name, specialty ),
          patients ( id, name )
        `,
        )
        .order("id", { ascending: false });

      if (apptsError) throw apptsError;
      setAppointments((appts as unknown as Appointment[]) || []);

      const simRes = await fetch("/api/tests");
      if (simRes.ok) {
        const data = await simRes.json();
        setSimulations(data.data || []);
      }
    } catch (err) {
      console.error("Error al refrescar listados de citas:", err);
    }
  }, []);

  const initializeLaboratory = useCallback(async () => {
    setLoading(true);
    setDbUninitialized(false);

    try {
      const { data: docs, error: docsError } = await supabase
        .from("doctors")
        .select("*");
      const { data: pats, error: patsError } = await supabase
        .from("patients")
        .select("*");

      if (docsError || patsError || !docs || docs.length === 0) {
        setDbUninitialized(true);
        setLoading(false);
        return;
      }

      setDoctors(docs);
      setPatients(pats);

      await Promise.all([refreshConstraintStatus(), refreshData()]);
    } catch (err) {
      console.error("Error inicializando el laboratorio:", err);
      setDbUninitialized(true);
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  useEffect(() => {
    initializeLaboratory();
  }, [initializeLaboratory]);

  const handleDeleteAppointment = async (id: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      alert("Error al eliminar la cita: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationStart = () => {
    setSimulating(true);
    setCurrentLogs([]);
    setCurrentMetrics(null);
  };

  const handleSimulationComplete = (
    metrics: SimulationMetrics,
    logs: LogEntry[],
  ) => {
    setCurrentMetrics(metrics);
    setCurrentLogs(logs);
    setSimulating(false);
  };

  const tabs = [
    { id: "simulator", label: "Probar Concurrencia", icon: Bug },
    { id: "database", label: "Administrar Sistema", icon: ShieldCheck },
    { id: "explainer", label: "Documentacion Tecnica", icon: BookOpen },
  ];

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-[#cccccc] flex flex-col">
      {viewMode === "laboratorio" && (
        <>
          {/* VS Code Title Bar */}
          <header className="bg-[#3c3c3c] border-b border-[#1e1e1e] px-4 py-2 flex items-center justify-between select-none flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#f14c4c]" />
                <span className="w-3 h-3 rounded-full bg-[#dcdcaa]" />
                <span className="w-3 h-3 rounded-full bg-[#6a9955]" />
              </div>
              <span className="text-xs text-[#858585] font-medium ml-2">
                Hospital General
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[#569cd6] font-semibold">Caso de Soporte - Duplicacion de Citas en Produccion</span>
              <span className="text-[#858585]">-</span>
              <span className="text-[#6a9955]">v1.0.0</span>
            </div>
          </header>

          {/* VS Code Tab Bar */}
          <nav className="bg-[#252526] border-b border-[#3c3c3c] flex items-center flex-shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-r border-[#3c3c3c] transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#1e1e1e] text-[#cccccc] border-t-2 border-t-[#007acc] mt-[-1px]"
                      : "bg-[#2d2d2d] text-[#858585] hover:text-[#cccccc]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
            <div className="flex-1 bg-[#2d2d2d] h-full" />
          </nav>
        </>
      )}

      <div className="flex-1 overflow-auto">
        {viewMode === "agendador" ? (
          <AppointmentScheduler />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-6">
            {/* BANNER DE ESCENARIO */}
            {!dbUninitialized && (
              <div className="bg-[#2d2d2d] border-l-4 border-l-[#dcdcaa] border border-[#3c3c3c] p-4">
                <div className="flex items-start gap-3">
                  <Bug className="w-5 h-5 text-[#dcdcaa] flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-[#dcdcaa] mb-1">
                      Escenario de Soporte #42
                    </p>
                    <p className="text-[#858585] mb-2">
                      El Hospital General reporta que multiples pacientes aparecen agendados en el mismo horario con el mismo medico. La falla solo ocurre cuando varias secretarias agendan turnos al mismo tiempo, provocando que el sistema pierda la referencia de que citas ya fueron confirmadas.
                    </p>
                    <p className="text-[#858585]">
                      <span className="text-[#569cd6] font-semibold">Objetivo:</span> Identificar la causa raiz en el flujo de reserva bajo carga concurrente y aplicar la solucion definitiva a nivel de base de datos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ALERTA DE CONFIGURACIÓN */}
            {dbUninitialized && (
              <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-5 flex flex-col md:flex-row gap-4 items-start md:items-center text-[#dcdcaa]">
                <AlertCircle className="w-8 h-8 flex-shrink-0 text-[#f14c4c]" />
                <div className="space-y-1 flex-1 text-sm leading-relaxed">
                  <span className="font-bold text-base block text-[#cccccc]">
                    Base de Datos no inicializada
                  </span>
                  <p className="text-[#858585]">
                    No se detectaron medicos o pacientes cargados en Supabase.
                  </p>
                  <ul className="list-decimal list-inside pl-1 text-[#858585] mt-1 space-y-1 font-mono text-xs">
                    <li>
                      Configura las llaves en el archivo{" "}
                      <code className="text-[#569cd6] bg-[#1e1e1e] px-1 py-0.5">
                        .env.local
                      </code>
                      .
                    </li>
                    <li>
                      Ejecuta el script{" "}
                      <code className="text-[#569cd6] bg-[#1e1e1e] px-1 py-0.5">
                        /sql/schema.sql
                      </code>{" "}
                      en el SQL Editor de Supabase.
                    </li>
                  </ul>
                </div>
                <button
                  onClick={initializeLaboratory}
                  className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium rounded text-xs transition-colors flex-shrink-0"
                >
                  Reintentar Conexion
                </button>
              </div>
            )}

            {!dbUninitialized && (
              <div className="space-y-6">
                {(activeTab === "simulator" || activeTab === "database") && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {activeTab === "database" ? (
                      <>
                        <DbAdminPanel
                          hasConstraint={hasConstraint}
                          onRefreshStatus={refreshConstraintStatus}
                          onRefreshData={refreshData}
                        />
                        <AppointmentsTable
                          appointments={appointments}
                          onDeleteAppointment={handleDeleteAppointment}
                          loading={loading}
                        />
                      </>
                    ) : (
                      <>
                        <DbAdminPanel
                          hasConstraint={hasConstraint}
                          onRefreshStatus={refreshConstraintStatus}
                          onRefreshData={refreshData}
                        />
                        <ConcurrencySimulator
                          doctors={doctors}
                          patients={patients}
                          hasConstraint={hasConstraint}
                          testNumber={simulations.length + 1}
                          onSimulationStart={handleSimulationStart}
                          onSimulationComplete={handleSimulationComplete}
                          onRefreshData={refreshData}
                        />
                      </>
                    )}
                  </div>
                )}

                {(activeTab === "simulator") && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <LogsConsole logs={currentLogs} simulating={simulating} />
                    <MetricsPanel metrics={currentMetrics} />
                  </div>
                )}

                {activeTab === "simulator" && (
                  <AppointmentsTable
                    appointments={appointments}
                    onDeleteAppointment={handleDeleteAppointment}
                    loading={loading}
                  />
                )}

                {activeTab === "simulator" && (
                  <ExperimentalResults simulations={simulations} loading={loading} />
                )}

                {activeTab === "explainer" && (
                  <TechnicalExplainer />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VS Code Status Bar */}
      <footer className="bg-[#007acc] text-white text-xs flex items-center justify-between px-4 py-1 flex-shrink-0 select-none">
        <div className="flex items-center gap-4">
          {viewMode === "laboratorio" && (
            <>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                Sistema: {hasConstraint ? "Protegido" : "Vulnerable"}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {simulations.length} pruebas
              </span>
            </>
          )}
          <span className="flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            <button
              onClick={() => setViewMode(viewMode === "laboratorio" ? "agendador" : "laboratorio")}
              className="hover:underline focus:outline-none"
            >
              Vista: {viewMode === "laboratorio" ? "Laboratorio" : "Agendador"}
            </button>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span>TypeScript JSX</span>
        </div>
      </footer>
    </main>
  );
}
