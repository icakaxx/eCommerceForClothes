import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/zodSchemas'
import { withRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force attacks
    const rateLimit = await withRateLimit(request, 'login')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.headers)
    }

    const body = await request.json()

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Login validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { 
          error: 'Invalid email or password format',
          details: validationResult.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    const { email, password } = validationResult.data

    // Convert email to lowercase for consistent database queries
    const normalizedEmail = email.toLowerCase().trim()

    // Find user by email
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('userid, name, email, phone, password, locationtext, locationcoordinates, addressinstructions, created_at, preferred_delivery_type, preferred_econt_office_id, preferred_city, preferred_street, preferred_street_number, preferred_entrance, preferred_floor, preferred_apartment')
      .eq('email', normalizedEmail)
      .single()
      
    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers: rateLimit.headers
        }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers: rateLimit.headers
        }
      )
    }

    // Parse coordinates if available
    let coordinates = null
    if (user.locationcoordinates) {
      try {
        coordinates = typeof user.locationcoordinates === 'string' 
          ? JSON.parse(user.locationcoordinates) 
          : user.locationcoordinates
      } catch (error) {
        console.warn('Failed to parse coordinates:', user.locationcoordinates)
      }
    }

    // Return user data (without password)
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.userid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        locationText: user.locationtext || '',
        locationCoordinates: user.locationcoordinates || '',
        addressInstructions: user.addressinstructions || '',
        created_at: user.created_at,
        preferredDeliveryType: user.preferred_delivery_type || null,
        preferredEcontOfficeId: user.preferred_econt_office_id || null,
        preferredCity: user.preferred_city || null,
        preferredStreet: user.preferred_street || null,
        preferredStreetNumber: user.preferred_street_number || null,
        preferredEntrance: user.preferred_entrance || null,
        preferredFloor: user.preferred_floor || null,
        preferredApartment: user.preferred_apartment || null
      }
    }, {
      headers: rateLimit.headers
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
