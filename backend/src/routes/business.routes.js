import express from 'express'
import * as businessController from '../controllers/business.controller.js'

const router = express.Router()

router.get('/', businessController.getBusinesses)
router.post('/', businessController.createBusiness)

export default router
