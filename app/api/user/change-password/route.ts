import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { changePasswordSchema } from '@/lib/zodSchemas'
import { ValidationService } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate input with Zod
    const validationResult = changePasswordSchema.safeParse({
      currentPassword,
      newPassword
    })

    if (!validationResult.success) {
      console.error('❌ Change password validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { 
          error: 'Invalid input format',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Additional password validation
    const passwordValidation = ValidationService.validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    // Fetch user to verify current password
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('userid, password')
      .eq('userid', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('userid', userId)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Change password API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
