
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data, error } = await supabase
        .from('student_performance')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching student_performance:', error)
    } else {
        console.log('Sample data:', data[0])
        console.log('Columns:', Object.keys(data[0] || {}))
    }
}

checkSchema()
