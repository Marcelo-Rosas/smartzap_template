#!/usr/bin/env node
/**
 * Script para aplicar migrations no Supabase
 * Executa o SQL diretamente no banco via Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltam variáveis de ambiente:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nVerifique se o arquivo .env.local está configurado corretamente.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function applyMigration() {
    console.log('🚀 Aplicando migração no Supabase...\n')
    console.log(`📍 URL: ${supabaseUrl}\n`)

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/0001_initial_schema.sql')

    let sql
    try {
        sql = readFileSync(migrationPath, 'utf-8')
    } catch (err) {
        console.error('❌ Erro ao ler arquivo de migração:', err.message)
        process.exit(1)
    }

    console.log('📄 Lendo migration:', migrationPath)
    console.log('📊 Tamanho do SQL:', sql.length, 'caracteres\n')

    // Execute the entire SQL as one statement
    // Supabase supports executing multiple statements
    try {
        console.log('⏳ Executando SQL no Supabase...\n')

        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql })

        if (error) {
            // If exec_sql doesn't exist, try direct execution via pg
            console.log('⚠️  RPC exec_sql não disponível, tentando execução direta...\n')

            // For Supabase, we need to execute via the SQL Editor or use the REST API
            // Since we can't execute arbitrary SQL via the client, we'll provide instructions
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('⚠️  ATENÇÃO: Execute o SQL manualmente no Supabase Dashboard')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
            console.log('1. Acesse: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql/new')
            console.log('2. Copie o conteúdo de: supabase/migrations/0001_initial_schema.sql')
            console.log('3. Cole no SQL Editor e clique em "Run"\n')
            console.log('Ou use o comando:')
            console.log('  npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@' + supabaseUrl.split('//')[1] + ':5432/postgres"\n')

            return
        }

        console.log('✅ Migração aplicada com sucesso!')
        console.log('\n📊 Tabelas criadas:')
        console.log('  - campaigns')
        console.log('  - contacts')
        console.log('  - campaign_contacts')
        console.log('  - templates')
        console.log('  - settings')
        console.log('  - account_alerts')
        console.log('  - bots')
        console.log('  - flows')
        console.log('  - bot_conversations')
        console.log('  - bot_messages')
        console.log('  - conversation_variables')
        console.log('  - ai_agents')
        console.log('  - ai_tools')
        console.log('  - tool_executions')
        console.log('  - flow_executions')
        console.log('  - node_executions')
        console.log('  - template_projects')
        console.log('  - template_project_items')

    } catch (err) {
        console.error('❌ Erro ao executar migração:', err.message)
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('💡 SOLUÇÃO ALTERNATIVA: Execute manualmente no Supabase Dashboard')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        console.log('1. Acesse: https://supabase.com/dashboard')
        console.log('2. Selecione seu projeto')
        console.log('3. Vá em: SQL Editor → New Query')
        console.log('4. Copie e cole o conteúdo de: supabase/migrations/0001_initial_schema.sql')
        console.log('5. Clique em "Run"\n')
        process.exit(1)
    }
}

applyMigration().catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
})
