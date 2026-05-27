// ============================================================================
// DEFINICIONES DE TIPOS DE TYPESCRIPT: /src/types/index.ts
//
// Este archivo agrupa las interfaces y tipos de datos del proyecto,
// facilitando el tipado estático y el auto-completado para los alumnos.
// ============================================================================

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

export interface Patient {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  doctor_id: number;
  patient_id: number;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
  // Campos cruzados (uniones) útiles para pintar en la interfaz
  doctors?: Doctor;
  patients?: Patient;
}

export interface SimulationResult {
  id: number;
  test_number: number;
  concurrent_requests: number;
  duplicates_generated: number;
  execution_time_ms: number;
  mode: string; // 'Vulnerable' o 'Corregido'
  total_requests: number;
  successful_appointments: number;
  created_at: string;
}

export interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'warn' | 'success' | 'error';
}

export interface SimulationMetrics {
  totalRequests: number;
  createdCount: number;
  duplicateCount: number;
  duplicatePercent: number;
  avgTimeMs: number;
  successCount: number;
  failedCount: number;
}
