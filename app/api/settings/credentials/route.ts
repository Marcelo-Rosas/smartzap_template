import { NextRequest, NextResponse } from 'next/server'
import {
  deleteWhatsAppCredentials,
  getCredentialsSource,
  getWhatsAppCredentials,
  saveWhatsAppCredentials,
  WhatsAppCredentials
} from '@/lib/whatsapp-credentials'

// GET - Fetch credentials from env (without exposing full token)
export async function GET() {
  try {
    const credentials = await getWhatsAppCredentials()

    if (credentials?.phoneNumberId && credentials?.businessAccountId && credentials?.accessToken) {
      const credentialsSource = await getCredentialsSource()
      // Fetch display phone number from Meta API
      let displayPhoneNumber: string | undefined = credentials.displayPhoneNumber
      let verifiedName: string | undefined = credentials.verifiedName

      try {
        const metaResponse = await fetch(
          `https://graph.facebook.com/v24.0/${credentials.phoneNumberId}?fields=display_phone_number,verified_name`,
          { headers: { 'Authorization': `Bearer ${credentials.accessToken}` } }
        )
        if (metaResponse.ok) {
          const metaData = await metaResponse.json()
          displayPhoneNumber = metaData.display_phone_number
          verifiedName = metaData.verified_name
        }
      } catch {
        // Ignore errors, just won't have display number
      }

      return NextResponse.json({
        source: credentialsSource,
        phoneNumberId: credentials.phoneNumberId,
        businessAccountId: credentials.businessAccountId,
        displayPhoneNumber,
        verifiedName,
        hasToken: true,
        tokenPreview: '••••••••••',
        isConnected: true,
      })
    }

    // Not configured
    return NextResponse.json({
      source: 'none',
      isConnected: false,
    })
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    )
  }
}

// POST - Validate credentials (stored in env vars via setup wizard)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumberId, businessAccountId, accessToken } = body as WhatsAppCredentials

    if (!phoneNumberId || !businessAccountId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumberId, businessAccountId, accessToken' },
        { status: 400 }
      )
    }

    // Validate token by making a test call to Meta API
    const testResponse = await fetch(
      `https://graph.facebook.com/v24.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!testResponse.ok) {
      const error = await testResponse.json()
      return NextResponse.json(
        {
          error: 'Invalid credentials - Meta API rejected the token',
          details: error.error?.message || 'Unknown error'
        },
        { status: 401 }
      )
    }

    const phoneData = await testResponse.json()

    // Persist credentials to Redis for use by other API routes
    await saveWhatsAppCredentials({
      phoneNumberId,
      businessAccountId,
      accessToken,
      displayPhoneNumber: phoneData.display_phone_number,
      verifiedName: phoneData.verified_name,
    })

    // Note: Credentials are stored in Vercel env vars via the setup wizard
    // This endpoint only validates them
    return NextResponse.json({
      success: true,
      phoneNumberId,
      businessAccountId,
      displayPhoneNumber: phoneData.display_phone_number,
      verifiedName: phoneData.verified_name,
      qualityRating: phoneData.quality_rating,
      message: 'Credentials validated. Store them in environment variables.'
    })
  } catch (error) {
    console.error('Error validating credentials:', error)
    return NextResponse.json(
      { error: 'Failed to validate credentials' },
      { status: 500 }
    )
  }
}

// DELETE - No-op since credentials are in env vars
export async function DELETE() {
  try {
    await deleteWhatsAppCredentials()
    return NextResponse.json({
      success: true,
      message: 'Credentials removed from Redis cache. Update environment variables in Vercel to fully disconnect.'
    })
  } catch (error) {
    console.error('Error deleting credentials:', error)
    return NextResponse.json({ error: 'Failed to delete credentials' }, { status: 500 })
  }
}
