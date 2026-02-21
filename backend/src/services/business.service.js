import { supabase } from '../db/supabase.js'

export const createBusiness = async (name, email) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert([{ name, email }])
    .select()

  if (error) throw error
  return data
}

export const getAllBusinesses = async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')

  if (error) throw error
  return data
}
