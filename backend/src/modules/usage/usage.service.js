import { supabase } from '../../db/supabase.js'

export const logUsage = async ({
  business_id,
  endpoint,
  tokens,
  model
}) => {

  try {

    await supabase
      .from('usage_logs')
      .insert([
        {
          business_id,
          endpoint,
          tokens_used: tokens,
          model
        }
      ])

  } catch (error) {

    console.error("Usage logging failed:", error)

  }

}