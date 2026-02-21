import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import businessRoutes from './routes/business.routes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/business', businessRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
