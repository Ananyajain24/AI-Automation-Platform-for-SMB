import * as businessService from '../services/business.service.js'

export const createBusiness = async (req, res) => {
  try {
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' })
    }

    const data = await businessService.createBusiness(name, email)
    res.status(201).json(data)

  } catch (error) {
    res.status(500).json(error)
  }
}

export const getBusinesses = async (req, res) => {
  try {
    const data = await businessService.getAllBusinesses()
    res.json(data)
  } catch (error) {
    res.status(500).json(error)
  }
}
