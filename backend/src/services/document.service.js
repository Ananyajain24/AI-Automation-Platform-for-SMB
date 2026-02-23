import { supabase } from '../db/supabase.js'

export const createDocument = async (
  business_id,
  title,
  content,
  file_url,
  file_type,
  file_size
) => {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        business_id,
        title,
        content,
        file_url,
        file_type,
        file_size
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const insertChunks = async (chunks) => {
  const { error } = await supabase
    .from('document_chunks')
    .insert(chunks)

  if (error) throw error
}