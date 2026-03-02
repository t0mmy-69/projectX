import { NextRequest, NextResponse } from 'next/server';
import { generateExtensionToken, validateExtensionToken, revokeExtensionToken } from '@/lib/extensionAuth';

// POST /api/extension/token - Generate extension token
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const extensionToken = generateExtensionToken(userId);

    return NextResponse.json(
      {
        success: true,
        message: 'Extension token generated',
        data: {
          token: extensionToken.token,
          expires_at: extensionToken.expires_at,
          instructions: 'Copy this token and paste it into the NarrativeOS Chrome Extension'
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate token', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/extension/validate - Validate extension token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const validation = validateExtensionToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      data: {
        user_id: validation.userId,
        valid: true
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate token', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/extension/token - Revoke extension token
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token } = body;
    const tokenFromHeader = request.headers.get('x-extension-token');

    const tokenToRevoke = token || tokenFromHeader;

    if (!tokenToRevoke) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const revoked = revokeExtensionToken(tokenToRevoke);

    if (!revoked) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revoke token', details: String(error) },
      { status: 500 }
    );
  }
}
