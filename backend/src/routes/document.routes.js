import express from 'express'
import { upload } from '../middleware/upload.middleware.js'
import { uploadPDFDocument } from '../controllers/document.controller.js'

const router = express.Router()

router.post('/upload', upload.single('file'), uploadPDFDocument)

export default router