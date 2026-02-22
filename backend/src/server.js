import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import businessRoutes from './routes/business.routes.js'
import documentRoutes from './routes/document.routes.js'
import { supabase } from './db/supabase.js'
import { searchRelevantChunks } from './services/retrieval.services.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/business', businessRoutes)
app.use('/document', documentRoutes)

app.get('/chunks/:businessId', async (req, res) => {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('business_id', req.params.businessId)

  if (error) return res.status(500).json(error)

  res.json(data)
})


app.get('/search', async (req, res) => {
  try {
    const { business_id, query } = req.query

    const results = await searchRelevantChunks(business_id, query)

    console.log("RESULT:", results)  // 🔥 Add this

    res.json(results)

  } catch (error) {
    console.error("ERROR:", error)
    res.status(500).json({ error: error.message })
  }
})


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
