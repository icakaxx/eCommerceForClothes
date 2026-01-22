import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/zodSchemas'
import { withRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { emailService } from '@/lib/emailService'
import { ValidationService } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await withRateLimit(request, 'register')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.headers)
    }

    const body = await request.json()

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Register validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { 
          error: 'Invalid input format',
          details: validationResult.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    const { name, email, phone, password, locationText, locationCoordinates } = validationResult.data

    // Additional validation using ValidationService
    const validationResults = [
      ValidationService.validateName(name),
      ValidationService.validateEmail(email),
      ValidationService.validatePhone(phone),
      ValidationService.validatePassword(password)
    ]

    const allErrors = validationResults.flatMap(result => result.errors)
    
    if (allErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: allErrors
        },
        { 
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim()
    
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('userid, email')
      .eq('email', normalizedEmail)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address already in use' },
        { 
          status: 409,
          headers: rateLimit.headers
        }
      )
    }

    // Hash password with bcrypt
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          phone,
          locationtext: locationText || null,
          locationcoordinates: locationCoordinates || null,
        }
      ])
      .select('userid, name, email, phone, created_at')
      .single()

    if (insertError || !newUser) {
      console.error('Registration error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { 
          status: 500,
          headers: rateLimit.headers
        }
      )
    }

    // Send welcome email (non-blocking)
    try {
      await emailService.sendWelcomeEmail({
        to: email,
        name
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails
    }

    // Return success response (without password)
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.userid,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      }
    }, { 
      status: 201,
      headers: rateLimit.headers
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
