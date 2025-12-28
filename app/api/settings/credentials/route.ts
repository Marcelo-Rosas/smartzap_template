import { NextRequest, NextResponse } from 'next/server'

// Credentials are stored in environment variables (secrets)
// No Redis dependency - env vars are the source of truth

interface WhatsAppCredentials {
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
  displayPhoneNumber?: string
  verifiedName?: string
}

// GET - Fetch credentials from env (without exposing full token)
export async function GET() {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID?.trim()
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim()
    const accessToken = process.env.WHATSAPP_TOKEN?.trim()

    if (phoneNumberId && businessAccountId && accessToken) {
      // Fetch display phone number from Meta API
      let displayPhoneNumber: string | undefined
      let verifiedName: string | undefined

      try {
        const metaResponse = await fetch(
          `https://graph.facebook.com/v24.0/${phoneNumberId}?fields=display_phone_number,verified_name`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
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
        source: 'env',
        phoneNumberId,
        businessAccountId,
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
    const phoneNumberId = typeof body?.phoneNumberId === 'string' ? body.phoneNumberId.trim() : ''
    const businessAccountId = typeof body?.businessAccountId === 'string' ? body.businessAccountId.trim() : ''
    const accessToken = typeof body?.accessToken === 'string' ? body.accessToken.trim() : ''

    if (!phoneNumberId || !businessAccountId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumberId, businessAccountId, accessToken' },
        { status: 400 }
      )
    }

    // Validate PHONE_NUMBER_ID (must be a WhatsApp phone number node)
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v24.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    )

    if (!phoneResponse.ok) {
      const error = await phoneResponse.json().catch(() => ({}))
      const message = error?.error?.message || 'Unknown error'

      // Common pitfall: user pasted Business Account ID into Phone Number ID
      if (typeof message === 'string' && message.includes('Tried accessing nonexisting field') && message.includes('WhatsAppBusinessAccount')) {
        return NextResponse.json(
          {
            error: 'IDs do WhatsApp parecem estar trocados',
            details: 'Você colocou o WhatsApp Business Account ID no campo Phone Number ID. O Phone Number ID é o ID do número (phone_number_id), não o WABA.',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Credenciais inválidas - Meta API rejeitou a validação do Phone Number ID',
          details: message,
        },
        { status: 401 }
      )
    }

    const phoneData = await phoneResponse.json()

    // Validate BUSINESS_ACCOUNT_ID (must be a WhatsApp Business Account node)
    const businessResponse = await fetch(
      `https://graph.facebook.com/v24.0/${businessAccountId}/phone_numbers?fields=id&limit=1`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    )

    if (!businessResponse.ok) {
      const error = await businessResponse.json().catch(() => ({}))
      const message = error?.error?.message || 'Unknown error'
      return NextResponse.json(
        {
          error: 'Credenciais inválidas - Meta API rejeitou a validação do Business Account ID',
          details: message,
        },
        { status: 401 }
      )
    }

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
  return NextResponse.json({
    success: true,
    message: 'To remove credentials, update environment variables in Vercel dashboard.'
  })
}
