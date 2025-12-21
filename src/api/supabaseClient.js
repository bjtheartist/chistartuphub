import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ===========================================
// Helper functions to match Base44 SDK API
// ===========================================

/**
 * Generic list function with sorting
 */
const createListFunction = (tableName) => async (orderBy = '-created_date') => {
  const isDescending = orderBy.startsWith('-');
  const column = orderBy.replace('-', '');

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order(column, { ascending: !isDescending });

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }

  return data || [];
};

/**
 * Generic get by ID function
 */
const createGetFunction = (tableName) => async (id) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} by id:`, error);
    throw error;
  }

  return data;
};

/**
 * Generic create function
 */
const createCreateFunction = (tableName) => async (record) => {
  const { data, error } = await supabase
    .from(tableName)
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error(`Error creating ${tableName}:`, error);
    throw error;
  }

  return data;
};

/**
 * Generic update function
 */
const createUpdateFunction = (tableName) => async (id, updates) => {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }

  return data;
};

/**
 * Generic delete function
 */
const createDeleteFunction = (tableName) => async (id) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }

  return true;
};

/**
 * Create entity helper that matches Base44 SDK interface
 */
const createEntity = (tableName) => ({
  list: createListFunction(tableName),
  get: createGetFunction(tableName),
  create: createCreateFunction(tableName),
  update: createUpdateFunction(tableName),
  delete: createDeleteFunction(tableName),
});

// ===========================================
// Entity Definitions (matching Base44 entities)
// ===========================================

export const entities = {
  Community: createEntity('communities'),
  Story: createEntity('stories'),
  Accelerator: createEntity('accelerators'),
  EventHub: createEntity('events'),
  Workspace: createEntity('workspaces'),
  FundingOpportunity: createEntity('funding_opportunities'),
  FundingNews: createEntity('funding_news'),
  UpcomingOpportunity: createEntity('upcoming_opportunities'),
  EmailSignup: createEntity('email_signups'),
  ResourceSubmission: createEntity('resource_submissions'),
};

// ===========================================
// Export compatible with existing Base44 usage
// ===========================================

export const db = {
  entities,
  supabase, // Direct access if needed
};

export default db;
