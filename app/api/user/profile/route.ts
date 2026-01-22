import { NextRequest, NextResponse } from 'next/server'
import { updateProfileSchema } from '@/lib/zodSchemas'
import { ValidationService } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user profile information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('userid, name, email, phone, locationtext, locationcoordinates, addressinstructions, created_at')
      .eq('userid', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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

    // Return user profile
    return NextResponse.json({
      user: {
        id: user.userid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        locationText: user.locationtext || '',
        locationCoordinates: user.locationcoordinates || '',
        addressInstructions: user.addressinstructions || '',
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, email, phone, locationText, locationCoordinates, addressInstructions } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate input with Zod
    const validationData: any = {}
    if (name) validationData.name = name
    if (email) validationData.email = email
    if (phone) validationData.phone = phone
    if (locationText) validationData.locationText = locationText
    if (locationCoordinates) validationData.locationCoordinates = locationCoordinates
    if (addressInstructions) validationData.addressInstructions = addressInstructions

    const validationResult = updateProfileSchema.safeParse(validationData)
    if (!validationResult.success) {
      console.error('❌ Profile update validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { 
          error: 'Invalid input format',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Additional validation using ValidationService
    if (name) {
      const nameValidation = ValidationService.validateName(name)
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: nameValidation.errors[0] },
          { status: 400 }
        )
      }
    }

    if (email) {
      const emailValidation = ValidationService.validateEmail(email)
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.errors[0] },
          { status: 400 }
        )
      }

      // Check if email is already taken by another user
      const normalizedEmail = email.toLowerCase().trim()
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('userid')
        .eq('email', normalizedEmail)
        .neq('userid', userId)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        )
      }
    }

    if (phone) {
      const phoneValidation = ValidationService.validatePhone(phone)
      if (!phoneValidation.isValid) {
        return NextResponse.json(
          { error: phoneValidation.errors[0] },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (name) updateData.name = name
    if (email) updateData.email = email.toLowerCase().trim()
    if (phone) updateData.phone = phone
    if (locationText !== undefined) updateData.locationtext = locationText || null
    if (locationCoordinates !== undefined) updateData.locationcoordinates = locationCoordinates || null
    if (addressInstructions !== undefined) updateData.addressinstructions = addressInstructions || null

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('userid', userId)
      .select('userid, name, email, phone, locationtext, locationcoordinates, addressinstructions, created_at')
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return updated user profile
    return NextResponse.json({
      user: {
        id: updatedUser.userid,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        locationText: updatedUser.locationtext || '',
        locationCoordinates: updatedUser.locationcoordinates || '',
        addressInstructions: updatedUser.addressinstructions || '',
        created_at: updatedUser.created_at
      },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
