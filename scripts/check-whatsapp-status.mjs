import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const {
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID
} = process.env;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error('❌ Missing WhatsApp credentials in .env.local');
    process.exit(1);
}

console.log('🔍 Checking WhatsApp Account Status...');
console.log(`📱 Phone ID: ${WHATSAPP_PHONE_ID}`);

async function checkStatus() {
    try {
        const baseUrl = `https://graph.facebook.com/v21.0`;

        // 1. Check Phone Number ID Details
        console.log('\n--- 1. Checking Phone Number ID ---');
        const phoneUrl = `${baseUrl}/${WHATSAPP_PHONE_ID}?fields=display_phone_number,quality_rating,verified_name,code_verification_status`;
        const phoneResp = await fetch(phoneUrl, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
        });
        const phoneData = await phoneResp.json();

        if (phoneResp.ok) {
            console.log('✅ Phone Details:', JSON.stringify(phoneData, null, 2));
        } else {
            console.error('❌ Error fetching Phone Number details:', JSON.stringify(phoneData, null, 2));
        }

        // 2. Check Business Account (if provided)
        if (WHATSAPP_BUSINESS_ACCOUNT_ID) {
            console.log('\n--- 2. Checking Business Account ID ---');
            const bizUrl = `${baseUrl}/${WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=name,timezone_id,message_template_namespace`;
            const bizResp = await fetch(bizUrl, {
                headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
            });
            const bizData = await bizResp.json();

            if (bizResp.ok) {
                console.log('✅ Business Account Details:', JSON.stringify(bizData, null, 2));
            } else {
                console.error('❌ Error fetching Business Account details:', JSON.stringify(bizData, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Exception during check:', error);
    }
}

checkStatus();
