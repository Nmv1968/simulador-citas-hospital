// ============================================================================
// ENDPOINT DE ADMINISTRACIÓN DE BD: /api/db-admin
//
// Este endpoint permite a los estudiantes alternar dinámicamente la
// restricción UNIQUE de PostgreSQL y consultar su estado actual.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1. OBTENER EL ESTADO DE LA RESTRICCIÓN (Vulnerable vs Protegido)
export async function GET() {
  try {
    // Invocamos la función RPC check_unique_constraint que creamos en PostgreSQL.
    // Esta función revisa las tablas internas del sistema buscando la restricción.
    const { data: hasConstraint, error } = await supabase.rpc('check_unique_constraint');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      hasConstraint: !!hasConstraint
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al consultar el catálogo de base de datos.'
    }, { status: 500 });
  }
}

// 2. ALTERNAR LA RESTRICCIÓN (Activar o Desactivar UNIQUE)
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action !== 'apply' && action !== 'remove') {
      return NextResponse.json({
        success: false,
        error: "Acción no válida. Use 'apply' (aplicar) o 'remove' (remover)."
      }, { status: 400 });
    }

    let queryText = '';
    
    if (action === 'apply') {
      // Intentamos agregar la restricción de clave única (UNIQUE)
      // sobre la combinación: médico + fecha + hora.
      queryText = `
        ALTER TABLE appointments 
        ADD CONSTRAINT unique_doctor_appointment 
        UNIQUE (doctor_id, appointment_date, appointment_time);
      `;
    } else {
      // Eliminamos la restricción de clave única para volver a ser vulnerables.
      queryText = `
        ALTER TABLE appointments 
        DROP CONSTRAINT IF EXISTS unique_doctor_appointment;
      `;
    }

    // Ejecutamos la consulta DDL a través de la función administrativa 'exec_ddl_query'.
    // Esto es necesario porque el cliente regular de Supabase no puede correr comandos DDL.
    const { data, error: rpcError } = await supabase.rpc('exec_ddl_query', {
      query_text: queryText
    });

    if (rpcError) {
      throw rpcError;
    }

    // La función 'exec_ddl_query' retorna un JSON de éxito/fallo manejado.
    // Analizamos si la base de datos rechazó la consulta.
    if (data && data.success === false) {
      // Explicación Académica:
      // Si intentamos aplicar UNIQUE ('apply') y hay duplicados en la base de datos,
      // PostgreSQL abortará la operación y retornará un error con código SQLSTATE '23505'
      // u otro código relacionado a la creación de índices.
      return NextResponse.json({
        success: false,
        code: data.code,
        error: `PostgreSQL rechazó la alteración: ${data.error}`,
        academicNotice: 'No se puede activar la restricción UNIQUE porque ya existen citas duplicadas en la tabla. PostgreSQL exige limpiar (TRUNCATE) los datos inconsistentes primero.'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'apply' 
        ? 'Restricción UNIQUE aplicada exitosamente. ¡Integridad garantizada!' 
        : 'Restricción UNIQUE eliminada. Sistema expuesto a race conditions.'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al modificar el esquema de base de datos.'
    }, { status: 500 });
  }
}
