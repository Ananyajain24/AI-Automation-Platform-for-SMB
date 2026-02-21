import { supabase } from '../db/supabase.js'

export const createDocument = async (business_id, title, content) => {

  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert([{ business_id, title, content }])
    .select()
    .single()

  if (docError) throw docError

  return document
}

export const insertChunks = async (chunks) => {
  const { error } = await supabase
    .from('document_chunks')
    .insert(chunks)

  if (error) throw error
}
