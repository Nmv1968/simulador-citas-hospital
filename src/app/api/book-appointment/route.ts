// ============================================================================
// ENDPOINT DE BACKEND: /api/book-appointment (Reservar Cita)
//
// Este archivo contiene la lógica para reservar una cita médica.
// Está diseñado didácticamente para demostrar la vulnerabilidad TOCTOU
// (Time-of-Check to Time-of-Use) mediante un retraso artificial.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Función auxiliar para formatear la hora actual con milisegundos de forma legible.
// Ayuda a los estudiantes a ver la simultaneidad de manera milimétrica.
function getTimestamp() {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${time}.${ms}`;
}

export async function POST(req: NextRequest) {
  const logs: { time: string; msg: string; type: 'info' | 'warn' | 'success' | 'error' }[] = [];
  
  // 1. EXTRAER PARÁMETROS DE LA PETICIÓN
  const { doctorId, patientId, date, time, requestId, delayMs = 1500, doctorName } = await req.json();

  const idLog = `[${requestId}]`;
  
  logs.push({ 
    time: getTimestamp(), 
    msg: `${idLog} Recibida solicitud de reserva para Dr. ${doctorName || doctorId} - Hora: ${time}`, 
    type: 'info' 
  });

  try {
    // ========================================================================
    // PASO A: VERIFICACIÓN (TIME OF CHECK)
    //
    // Aquí es donde empieza el problema. Consultamos a la base de datos si ya
    // existe una cita para el mismo médico, fecha y hora.
    // ========================================================================
    logs.push({ 
      time: getTimestamp(), 
      msg: `${idLog} Paso A (CHECK): Consultando disponibilidad en la base de datos...`, 
      type: 'info' 
    });

    const { data: existingAppointment, error: selectError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('appointment_time', time);

    if (selectError) {
      throw selectError;
    }

    // Si la cita ya existe físicamente en la DB, abortamos inmediatamente.
    // En flujo normal y no concurrente, esta validación es suficiente.
    if (existingAppointment && existingAppointment.length > 0) {
      logs.push({ 
        time: getTimestamp(), 
        msg: `${idLog} ❌ Validación fallida: El horario ya se encuentra ocupado.`, 
        type: 'warn' 
      });
      return NextResponse.json({
        success: false,
        requestId,
        logs,
        error: 'El médico ya tiene una cita en esta fecha y hora.'
      }, { status: 400 });
    }

    logs.push({ 
      time: getTimestamp(), 
      msg: `${idLog} ✓ Validación inicial aprobada: El horario parece estar LIBRE.`, 
      type: 'success' 
    });

    // ========================================================================
    // PASO B: RETRASO ARTIFICIAL (LA VENTANA DE VULNERABILIDAD)
    //
    // Para forzar la race condition en el laboratorio, detenemos el hilo.
    // Durante este retraso, otras peticiones concurrentes realizarán el 'Paso A' (CHECK).
    // Como la primera petición aún no ha insertado nada, todas verán el horario
    // como 'LIBRE' y continuarán hacia la inserción.
    // ========================================================================
    logs.push({ 
      time: getTimestamp(), 
      msg: `${idLog} ⏳ Entrando en delay artificial de ${delayMs}ms para provocar concurrencia...`, 
      type: 'warn' 
    });
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // ========================================================================
    // PASO C: INSERCIÓN (TIME OF USE)
    //
    // Pasado el retraso, procedemos a realizar la inserción física del registro.
    // ========================================================================
    logs.push({ 
      time: getTimestamp(), 
      msg: `${idLog} Paso C (USE): Intentando insertar registro en la tabla 'appointments'...`, 
      type: 'info' 
    });

    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: date,
        appointment_time: time
      })
      .select();

    // ========================================================================
    // MANEJO DE INTEGRIDAD EN BASE DE DATOS
    //
    // Si la restricción UNIQUE está ACTIVA en PostgreSQL, la inserción fallará
    // de forma atómica para el segundo proceso concurrente que intente guardar la
    // misma tupla (doctor_id, date, time).
    //
    // El código de error standard de PostgreSQL para UNIQUE VIOLATION es '23505'.
    // ========================================================================
    if (insertError) {
      if (insertError.code === '23505') {
        logs.push({ 
          time: getTimestamp(), 
          msg: `${idLog} 🛑 ¡RECHAZADO POR POSTGRESQL! Violación de restricción UNIQUE (Código 23505).`, 
          type: 'error' 
        });
        return NextResponse.json({
          success: false,
          requestId,
          logs,
          error: 'Bloqueado por base de datos: Conflicto de integridad (UNIQUE constraint).'
        }, { status: 409 });
      }
      throw insertError;
    }

    // Si llegamos aquí sin errores, la cita se ha guardado físicamente.
    logs.push({ 
      time: getTimestamp(), 
      msg: `${idLog} 🎉 ¡Cita creada con éxito! ID en Base de Datos: ${newAppointment[0].id}`, 
      type: 'success' 
    });

    return NextResponse.json({
      success: true,
      requestId,
      appointmentId: newAppointment[0].id,
      logs
    }, { status: 200 });

  } catch (error: any) {
    logs.push({ 
      time: getTimestamp(), 
      msg: `${idLog} 💥 Error inesperado en el servidor: ${error.message || error}`, 
      type: 'error' 
    });
    return NextResponse.json({
      success: false,
      requestId,
      logs,
      error: error.message || 'Error del servidor'
    }, { status: 500 });
  }
}
