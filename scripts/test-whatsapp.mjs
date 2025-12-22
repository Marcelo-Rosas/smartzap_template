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

const DESTINATION_PHONE = process.argv[2]; // Get phone number from command line

if (!DESTINATION_PHONE) {
    console.error('❌ Usage: node scripts/test-whatsapp.mjs <PHONE_NUMBER>');
    console.error('   Example: node scripts/test-whatsapp.mjs 5521999999999');
    process.exit(1);
}

console.log('🚀 Testing WhatsApp Sending...');
console.log(`📱 From ID: ${WHATSAPP_PHONE_ID}`);
console.log(`📩 To: ${DESTINATION_PHONE}`);

async function sendTestMessage() {
    try {
        const url = `https://graph.facebook.com/v24.0/${WHATSAPP_PHONE_ID}/messages`;

        // Using the standard 'hello_world' template that exists in all WhatsApp Business accounts
        const payload = {
            messaging_product: 'whatsapp',
            to: DESTINATION_PHONE,
            type: 'template',
            template: {
                name: 'hello_world',
                language: { code: 'en_US' }
            }
        };

        console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error sending message:');
            console.error(JSON.stringify(data, null, 2));
        } else {
            console.log('✅ Message sent successfully!');
            console.log('🆔 Message ID:', data.messages?.[0]?.id);
            console.log('\n⚠️ Note: If you do not receive the message, ensure the destination number is added as a "Test Number" in your Meta App Dashboard (since the app is in Development mode).');
        }

    } catch (error) {
        console.error('❌ Exception:', error);
    }
}

sendTestMessage();
