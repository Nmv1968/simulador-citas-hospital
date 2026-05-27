// ============================================================================
// ENDPOINT DE REINICIO DE DATOS: /api/reset-data
//
// Permite vaciar la tabla 'appointments' para limpiar el laboratorio,
// facilitando el reinicio del experimento o la eliminación de duplicados
// para poder aplicar la restricción UNIQUE.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Explicación Académica:
    // Para borrar todos los registros de una tabla en Supabase mediante JS Client,
    // debemos proveer un filtro que coincida con todas las filas.
    // Dado que los IDs son autoincrementales (SERIAL), todos son mayores a 0 (gt: 0).
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .gt('id', 0);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos de citas purgada exitosamente. Listo para nuevas simulaciones.'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al purgar los datos del laboratorio.'
    }, { status: 500 });
  }
}
