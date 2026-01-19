export type SetupWizardData = {
  password: string
  confirmPassword: string
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  databaseUrl?: string
  redisUrl: string
  redisToken: string
  qstashToken: string
  upstashEmail: string
  upstashApiKey: string
  upstashConsoleUrl: string
  whatsappToken: string
  whatsappPhoneId: string
  whatsappBusinessId: string
  companyName: string
  email: string
  phone: string
}

export const setupWizardFixture: SetupWizardData = {
  password: 'StrongPass123!@#',
  confirmPassword: 'StrongPass123!@#',
  supabaseUrl: 'https://project.supabase.co',
  supabaseAnonKey: 'anon-key-fixture',
  supabaseServiceKey: 'service-key-fixture',
  databaseUrl: 'postgres://fixture',
  redisUrl: 'https://redis.example.upstash.io',
  redisToken: 'redis-token-fixture',
  qstashToken: 'qstash-token-fixture',
  upstashEmail: 'ops@smartzap.com',
  upstashApiKey: 'upstash-api-key-fixture',
  upstashConsoleUrl: 'https://console.upstash.com/redis/123',
  whatsappToken: 'whatsapp-token-fixture',
  whatsappPhoneId: '1234567890',
  whatsappBusinessId: 'business-id-fixture',
  companyName: 'SmartZap Ltda',
  email: 'contato@smartzap.com',
  phone: '+55 11 99999-9999',
}
