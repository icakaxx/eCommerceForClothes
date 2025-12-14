import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/auth-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const { isAdmin, user } = await verifyAdminAccess(userId)

    return NextResponse.json({
      isAdmin,
      user
    })

  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

