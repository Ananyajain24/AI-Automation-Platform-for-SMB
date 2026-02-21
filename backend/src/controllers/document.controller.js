import * as documentService from '../services/document.service.js'
import { chunkText } from '../utils/chunk.util.js'

export const uploadDocument = async (req, res, next) => {
  try {
    const { business_id, title, content } = req.body

    if (!business_id || !title || !content) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const document = await documentService.createDocument(
      business_id,
      title,
      content
    )

    const chunks = chunkText(content)

    const formattedChunks = chunks.map(chunk => ({
      business_id,
      document_id: document.id,
      content: chunk
    }))

    await documentService.insertChunks(formattedChunks)

    res.status(201).json({ message: 'Document uploaded and chunked' })

  } catch (error) {
    next(error)
  }
}
