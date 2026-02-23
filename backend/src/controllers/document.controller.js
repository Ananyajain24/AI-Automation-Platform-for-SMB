import fs from 'fs'
import * as documentService from '../services/document.service.js'
import { supabase } from '../db/supabase.js'
import { chunkText } from '../utils/chunk.util.js'
import { generateEmbedding } from '../utils/embeddings.util.js'
import { extractTextFromPDF } from '../utils/pdf.util.js'
import { uploadFileToStorage } from '../services/storage.service.js'

export const uploadPDFDocument = async (req, res, next) => {
  try {

    const supabaseUserId = req.user.sub
    // 1️⃣ Get business_id from users table
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('business_id')
  .eq('supabase_user_id', supabaseUserId)
  .single()

if (userError || !userData) {
  return res.status(404).json({ error: 'User not linked to business' })
}

const business_id = userData.business_id
    

    if (!req.file) {
  return res.status(400).json({ error: 'File is required' })
}

 const title = req.file.originalname

    // 1️⃣ Upload file to Supabase Storage
    const { fileUrl } = await uploadFileToStorage(req.file)

    // 2️⃣ Extract text
    const content = await extractTextFromPDF(req.file.path)

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'PDF contains no readable text' })
    }

    // 3️⃣ Save document metadata
    const document = await documentService.createDocument(
      business_id,
      title || req.file.originalname,
      content,
      fileUrl,
      req.file.mimetype,
      req.file.size
    )

    // 4️⃣ Chunk text
    const chunks = chunkText(content, 700, 100)

    // 5️⃣ Generate embeddings in batch
    const embeddings = await generateEmbedding(chunks)

    const formattedChunks = chunks.map((chunk, index) => ({
      business_id,
      document_id: document.id,
      content: chunk,
      embedding: embeddings[index]
    }))

    // 6️⃣ Store chunks
    await documentService.insertChunks(formattedChunks)

    // 7️⃣ Delete temp file
    await fs.promises.unlink(req.file.path)

    res.status(201).json({
      message: 'PDF uploaded and processed successfully',
      totalChunks: formattedChunks.length,
      fileUrl
    })

  } catch (error) {
    next(error)
  }
}