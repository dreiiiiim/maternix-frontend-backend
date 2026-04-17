const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: 'c:/Users/ocamp/maternix/backend/.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
  console.log('Admin profiles:', JSON.stringify(data, null, 2))
  console.log('Error:', error)
}
check()
