// ============================================================================
// ENDPOINT DE SIMULACIONES HISTÓRICAS: /api/simulations
//
// Este endpoint permite almacenar y recuperar el historial de simulaciones
// académicas ejecutadas. Sirve como registro de evidencia científica para
// comparar resultados cuantitativos.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1. OBTENER EL HISTORIAL DE PRUEBAS EXPERIMENTALES
export async function GET() {
  try {
    const { data: simulations, error } = await supabase
      .from('test_results')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: simulations || []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener el historial de simulaciones.'
    }, { status: 500 });
  }
}

// 2. REGISTRAR UN NUEVO EXPERIMENTO EN EL HISTORIAL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      test_number, 
      concurrent_requests, 
      duplicates_generated, 
      execution_time_ms, 
      mode, 
      total_requests, 
      successful_appointments 
    } = body;

    // Validación básica para estudiantes
    if (test_number === undefined || !concurrent_requests || mode === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos para guardar la simulación.'
      }, { status: 400 });
    }

    // Insertamos el registro en PostgreSQL
    const { data, error: insertError } = await supabase
      .from('test_results')
      .insert({
        test_number,
        concurrent_requests,
        duplicates_generated,
        execution_time_ms,
        mode,
        total_requests,
        successful_appointments
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al registrar el resultado de la simulación.'
    }, { status: 500 });
  }
}
