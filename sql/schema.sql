-- ============================================================================
-- LABORATORIO ACADÉMICO DE CONCURRENCIA E INTEGRIDAD DE DATOS
-- SCRIPT DE BASE DE DATOS (Supabase / PostgreSQL)
--
-- Este script define la estructura de tablas para simular race conditions.
-- Inicialmente, la tabla de citas ('appointments') se crea SIN restricción UNIQUE
-- para permitir el descubrimiento y experimentación de la vulnerabilidad.
-- ============================================================================

-- 1. LIMPIEZA DE TABLAS PREVIAS (Por si se desea reiniciar desde cero)
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS simulation_results CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- ============================================================================
-- ENTIDAD: DOCTORS (Médicos disponibles para el agendamiento)
-- ============================================================================
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL
);

-- ============================================================================
-- ENTIDAD: PATIENTS (Pacientes que reservarán citas de forma concurrente)
-- ============================================================================
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- ============================================================================
-- ENTIDAD: APPOINTMENTS (Citas médicas)
-- 
-- NOTA ACADÉMICA CLAVE:
-- Inicialmente, esta tabla NO tiene una restricción UNIQUE en (doctor_id, appointment_date, appointment_time).
-- Esto nos permite emular el "Estado Vulnerable", donde el backend realiza la validación
-- por software separada del insert, permitiendo que bajo condiciones de concurrencia
-- se inserten registros físicamente idénticos (mismo médico, misma fecha, misma hora).
-- ============================================================================
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENTIDAD: TEST_RESULTS (Historial de experimentos científicos)
--
-- Guarda las métricas agregadas de cada simulación concurrente ejecutada.
-- Sirve para analizar cuantitativamente la diferencia entre el modo vulnerable
-- y el modo protegido.
-- ============================================================================
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    test_number INT NOT NULL,              -- Identificador de prueba secuencial
    concurrent_requests INT NOT NULL,      -- Cantidad de solicitudes lanzadas (5, 10, 20)
    duplicates_generated INT NOT NULL,     -- Cuántas citas duplicadas se generaron físicamente
    execution_time_ms INT NOT NULL,        -- Tiempo que tardó en procesarse el lote completo
    mode VARCHAR(50) NOT NULL,             -- 'Vulnerable' o 'Corregido' (con UNIQUE)
    total_requests INT NOT NULL,           -- Total de solicitudes enviadas
    successful_appointments INT NOT NULL,  -- Citas que se crearon exitosamente (status 200)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATOS SEMILLA (Semillas iniciales para médicos y pacientes)
-- ============================================================================

-- Médicos de ejemplo
INSERT INTO doctors (name, specialty) VALUES
('Dr. Carlos Mendoza', 'Cardiología'),
('Dra. Laura Gómez', 'Pediatría'),
('Dr. Andrés Silva', 'Neurología'),
('Dra. Sofía Rivas', 'Dermatología');

-- Pacientes de ejemplo (utilizados en las simulaciones concurrentes)
INSERT INTO patients (name) VALUES
('Juan Pérez'),
('María Rodríguez'),
('Pedro Gómez'),
('Ana Martínez'),
('Luis Fernández'),
('Sofía Castro'),
('Diego Morales'),
('Lucía Ortega');

-- ============================================================================
-- CÓMO ALTERNAR LA RESTRICCIÓN UNIQUE DESDE EL SISTEMA
-- 
-- Para corregir el problema de raíz a nivel de Base de Datos, se aplica:
-- ALTER TABLE appointments ADD CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, appointment_time);
--
-- Para volver al estado vulnerable e interactivo:
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS unique_doctor_appointment;
-- ============================================================================

-- ============================================================================
-- FUNCIÓN ADMINISTRATIVA: exec_ddl_query
--
-- Explicación Académica:
-- Supabase, por defecto, no permite ejecutar comandos DDL (como 'ALTER TABLE')
-- a través del cliente API regular por motivos de seguridad. 
-- Para este prototipo académico, creamos una función con 'SECURITY DEFINER'.
-- Esto significa que se ejecutará con privilegios de Administrador (superusuario),
-- permitiendo que Next.js altere el esquema dinámicamente.
-- 
-- ¡CUIDADO! En un sistema real de producción, exponer una función que ejecute
-- SQL crudo es una vulnerabilidad crítica de inyección de SQL. Aquí se usa
-- estrictamente con fines educativos y de simulación experimental.
-- ============================================================================
CREATE OR REPLACE FUNCTION exec_ddl_query(query_text TEXT)
RETURNS JSON AS $$
BEGIN
    EXECUTE query_text;
    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    -- Capturamos el mensaje de error y el código SQLSTATE (ej. 23505 para duplicados)
    -- de forma que el frontend pueda reportar detalladamente qué falló en PostgreSQL.
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM, 
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN ADMINISTRATIVA: check_unique_constraint
--
-- Verifica si la restricción UNIQUE 'unique_doctor_appointment' existe
-- en el catálogo de PostgreSQL. Retorna true si existe, false si no.
-- ============================================================================
CREATE OR REPLACE FUNCTION check_unique_constraint()
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_doctor_appointment'
    ) INTO v_exists;
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


