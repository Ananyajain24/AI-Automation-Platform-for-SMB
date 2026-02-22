import * as documentService from '../services/document.service.js'
import { chunkText } from '../utils/chunk.util.js'
import { generateEmbedding } from '../utils/embeddings.util.js'

export const uploadDocument = async (req, res, next) => {
  try {
    const { business_id, title, content } = req.body

    if (!business_id || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // 1️⃣ Save document
    const document = await documentService.createDocument(
      business_id,
      title,
      content
    )

    // 2️⃣ Chunk content
    const chunks = chunkText(content, 700, 100)

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Content too short to process' })
    }

    // 3️⃣ Generate embeddings in BATCH (important)
    const embeddings = await generateEmbedding(chunks)

    // 4️⃣ Map chunks with embeddings
    const formattedChunks = chunks.map((chunk, index) => ({
      business_id,
      document_id: document.id,
      content: chunk,
      embedding: embeddings[index]
    }))

    // 5️⃣ Store chunks
    await documentService.insertChunks(formattedChunks)

    res.status(201).json({
      message: 'Document uploaded successfully',
      totalChunks: formattedChunks.length
    })

  } catch (error) {
    next(error)
  }
}