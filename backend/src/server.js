import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import businessRoutes from './routes/business.routes.js'
import documentRoutes from './routes/document.routes.js'
import { supabase } from './db/supabase.js'

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

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
