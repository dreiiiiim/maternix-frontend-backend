const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: 'c:/Users/ocamp/maternix/backend/.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY // Must use Anon key for auth!

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('Logging in as admin...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@maternixtrack.edu', // Default seeded admin email
    password: 'password123',
  })
  if (authError) {
    console.error('Auth Error:', authError.message)
    return
  }
  
  console.log('User ID:', authData.user.id)
  
  console.log('Fetching instructors...')
  const { data: insData, error: insError } = await supabase
    .from('instructors')
    .select('id, employee_id, department, profiles(full_name, email), sections(id)')
    
  console.log('Error:', insError)
}
check()
