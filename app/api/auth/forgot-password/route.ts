import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/emailService'
import { passwordResetRequestSchema } from '@/lib/zodSchemas'
import { withRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await withRateLimit(request, 'passwordReset')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.headers)
    }

    const body = await request.json()

    // Validate input with Zod
    const validationResult = passwordResetRequestSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Forgot password validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          details: validationResult.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    const { email } = validationResult.data

    // Normalize email to lowercase for consistent database queries
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('userid, name, email')
      .eq('email', normalizedEmail)
      .single()

    if (fetchError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If the email exists, you will receive a password reset link'
      }, {
        headers: rateLimit.headers
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('userid', user.userid)

    if (updateError) {
      console.error('Error storing reset token:', updateError)
      return NextResponse.json(
        { error: 'Failed to process request' },
        { 
          status: 500,
          headers: rateLimit.headers
        }
      )
    }

    // Send password reset email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resetUrl = `${siteUrl}/user/reset-password?token=${resetToken}`

    try {
      await emailService.sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetToken,
        resetUrl
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { 
          status: 500,
          headers: rateLimit.headers
        }
      )
    }

    return NextResponse.json({
      message: 'If the email exists, you will receive a password reset link'
    }, {
      headers: rateLimit.headers
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
