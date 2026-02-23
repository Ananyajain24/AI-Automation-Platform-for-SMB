import { supabase } from '../db/supabase.js'
import fs from 'fs'

const BUCKET_NAME = 'documents'

export const uploadFileToStorage = async (file) => {
  const fileBuffer = fs.readFileSync(file.path)

  const filePath = `${Date.now()}-${file.originalname}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: file.mimetype
    })

  if (error) throw error

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return {
    fileUrl: data.publicUrl,
    filePath
  }
}