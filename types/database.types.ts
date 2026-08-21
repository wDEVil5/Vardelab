/**
 * Tipos de la base de datos.
 *
 * Se autogeneran desde el esquema de Supabase (ADR-002 del PRD):
 *   npx supabase gen types typescript --local > types/database.types.ts
 *
 * Placeholder hasta crear las primeras migraciones (modelo de datos, PRD §11).
 */
export type Database = Record<string, never>;
