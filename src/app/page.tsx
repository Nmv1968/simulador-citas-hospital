// ============================================================================
// PÁGINA PRINCIPAL: /src/app/page.tsx (Dashboard Académico)
//
// Es el ensamblador principal del laboratorio. Administra el estado,
// realiza las consultas a Supabase y distribuye la información a los
// componentes visuales de la interfaz.
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Doctor, Patient, Appointment, SimulationResult, LogEntry, SimulationMetrics } from '@/types';
import TechnicalExplainer from '@/components/TechnicalExplainer';
import DbAdminPanel from '@/components/DbAdminPanel';
import ConcurrencySimulator from '@/components/ConcurrencySimulator';
import LogsConsole from '@/components/LogsConsole';
import MetricsPanel from '@/components/MetricsPanel';
import AppointmentsTable from '@/components/AppointmentsTable';
import ExperimentalResults from '@/components/ExperimentalResults';
import { Database, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export default function Home() {
  // --- ESTADOS DE DATOS DE BASE DE DATOS ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  
  // --- ESTADOS DE CONTROL Y COMPORTAMIENTO ---
  const [hasConstraint, setHasConstraint] = useState<boolean>(false);
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SimulationMetrics | null>(null);
  
  // --- ESTADOS DE CARGA ---
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [dbUninitialized, setDbUninitialized] = useState<boolean>(false);

  // --- REFRESCAR EL ESTADO DE LA RESTRICCIÓN UNIQUE ---
  const refreshConstraintStatus = async () => {
    try {
      const res = await fetch('/api/db-admin');
      if (res.ok) {
        const data = await res.json();
        setHasConstraint(!!data.hasConstraint);
      }
    } catch (err) {
      console.error('Error al consultar estado de la restricción:', err);
    }
  };

  // --- REFRESCAR LOS DATOS DE CITAS Y EXPERIMENTOS ---
  const refreshData = useCallback(async () => {
    try {
      // 1. Citas Físicas en DB (cruzadas con médicos y pacientes para pintar nombres)
      const { data: appts, error: apptsError } = await supabase
        .from('appointments')
        .select(`
          id,
          doctor_id,
          patient_id,
          appointment_date,
          appointment_time,
          created_at,
          doctors ( id, name, specialty ),
          patients ( id, name )
        `)
        .order('id', { ascending: false });

      if (apptsError) throw apptsError;
      setAppointments((appts as unknown as Appointment[]) || []);

      // 2. Historial de simulaciones
      const simRes = await fetch('/api/simulations');
      if (simRes.ok) {
        const data = await simRes.json();
        setSimulations(data.data || []);
      }
    } catch (err) {
      console.error('Error al refrescar listados de citas:', err);
    }
  }, []);

  // --- INICIALIZACIÓN: CARGA COMPLETA ---
  const initializeLaboratory = useCallback(async () => {
    setLoading(true);
    setDbUninitialized(false);

    try {
      // Intentamos cargar Médicos y Pacientes (datos semilla)
      const { data: docs, error: docsError } = await supabase.from('doctors').select('*');
      const { data: pats, error: patsError } = await supabase.from('patients').select('*');

      // Si arroja error o vienen vacíos, indica que el alumno no ha corrido el script SQL
      if (docsError || patsError || !docs || docs.length === 0) {
        setDbUninitialized(true);
        setLoading(false);
        return;
      }

      setDoctors(docs);
      setPatients(pats);

      // Cargar citas, simulaciones y restricciones
      await Promise.all([
        refreshConstraintStatus(),
        refreshData()
      ]);
    } catch (err) {
      console.error('Error inicializando el laboratorio:', err);
      setDbUninitialized(true);
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  useEffect(() => {
    initializeLaboratory();
  }, [initializeLaboratory]);

  // --- ELIMINAR CITA INDIVIDUAL ---
  const handleDeleteAppointment = async (id: number) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      alert('Error al eliminar la cita: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADORES DE SIMULACIÓN ---
  const handleSimulationStart = () => {
    setSimulating(true);
    setCurrentLogs([]);
    setCurrentMetrics(null);
  };

  const handleSimulationComplete = (metrics: SimulationMetrics, logs: LogEntry[]) => {
    setCurrentMetrics(metrics);
    setCurrentLogs(logs);
    setSimulating(false);
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0b0f19] to-[#0a0c10] text-slate-100 p-4 md:p-8 selection:bg-indigo-500/30 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO PRINCIPAL (ACADÉMICO) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prototipo Académico de Concurrencia</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-250 to-slate-100">
              Simulador Científico de Race Conditions
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Analiza cómo la separación entre validación e inserción por software (TOCTOU) produce duplicidades de citas médicas, y experimenta cómo las restricciones de base de datos garantizan atomicidad.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="font-mono text-xs bg-slate-900 border border-slate-800 text-slate-450 px-3 py-1.5 rounded-lg select-none">
              v1.0.0-academic
            </span>
          </div>
        </header>

        {/* ALERTA DE CONFIGURACIÓN DE BASE DE DATOS FALTANTE */}
        {dbUninitialized && (
          <div className="p-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center text-amber-300">
            <AlertCircle className="w-8 h-8 flex-shrink-0 text-amber-400 animate-bounce" />
            <div className="space-y-1 flex-1 text-sm leading-relaxed">
              <span className="font-bold text-base block text-amber-200">🔌 Base de Datos no inicializada o credenciales incorrectas</span>
              <p>
                No se detectaron médicos o pacientes cargados en Supabase. Sigue estos dos pasos sencillos para arrancar:
              </p>
              <ul className="list-decimal list-inside pl-1 text-amber-300/85 mt-1 space-y-1 font-mono text-xs">
                <li>Asegúrate de haber configurado las llaves en el archivo <code className="text-white bg-slate-900 px-1 py-0.5 rounded">.env.local</code>.</li>
                <li>Copia y ejecuta el contenido del script <code className="text-white bg-slate-900 px-1 py-0.5 rounded">/sql/schema.sql</code> en el **SQL Editor** de tu cuenta de Supabase.</li>
              </ul>
            </div>
            <button
              onClick={initializeLaboratory}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-950/20"
            >
              Reintentar Conexión
            </button>
          </div>
        )}

        {!dbUninitialized && (
          <div className="space-y-8 animate-fade-in">
            {/* GRID SECCIÓN A: ADMINISTRACIÓN Y PARÁMETROS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* PANEL DE POSTGRESQL (ADMIN) */}
              <DbAdminPanel
                hasConstraint={hasConstraint}
                onRefreshStatus={refreshConstraintStatus}
                onRefreshData={refreshData}
              />

              {/* PANEL DE CONCURRENCIA */}
              <ConcurrencySimulator
                doctors={doctors}
                patients={patients}
                hasConstraint={hasConstraint}
                testNumber={simulations.length + 1}
                onSimulationStart={handleSimulationStart}
                onSimulationComplete={handleSimulationComplete}
                onRefreshData={refreshData}
              />
            </div>

            {/* GRID SECCIÓN B: RESULTADOS Y TERMINAL LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* CONSOLA RETRO TERMINAL */}
              <LogsConsole
                logs={currentLogs}
                simulating={simulating}
              />

              {/* PANEL DE MÉTRICAS */}
              <MetricsPanel
                metrics={currentMetrics}
              />
            </div>

            {/* LISTADO DE CITAS CREADAS */}
            <AppointmentsTable
              appointments={appointments}
              onDeleteAppointment={handleDeleteAppointment}
              loading={loading}
            />

            {/* BITÁCORA EXPERIMENTAL DE PRUEBAS */}
            <ExperimentalResults
              simulations={simulations}
              loading={loading}
            />

            {/* SECCIÓN INTERACTIVA EXPLICATIVA */}
            <TechnicalExplainer />
          </div>
        )}

        {/* PIE DE PÁGINA */}
        <footer className="text-center text-xs text-slate-500 py-8 border-t border-slate-900 mt-12 space-y-1">
          <p>© {new Date().getFullYear()} Laboratorio de Concurrencia Hospitalaria - Prototipo Didáctico de Demostración</p>
          <p className="font-mono text-slate-655">Construido con Next.js 15, Supabase PostgreSQL, TypeScript y TailwindCSS</p>
        </footer>

      </div>
    </main>
  );
}
