// Team members management endpoints
// Handles adding and managing team members

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, TeamMember, Team } from '@/lib/db';

// GET /api/teams/members?team_id=xxx - List team members
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const teamId = request.nextUrl.searchParams.get('team_id');

    if (!userId || !teamId) {
      return NextResponse.json(
        { error: 'User ID and team ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to this team
    const team = memoryDB.teams.get(teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const hasAccess = team.owner_id === userId ||
      Array.from(memoryDB.teamMembers.values()).some(
        m => m.team_id === teamId && m.user_id === userId
      );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this team' },
        { status: 403 }
      );
    }

    // Get team members
    const members = Array.from(memoryDB.teamMembers.values()).filter(
      m => m.team_id === teamId
    );

    // Add owner to the list
    const allMembers = [
      {
        id: `owner_${teamId}`,
        team_id: teamId,
        user_id: team.owner_id,
        role: 'owner' as const,
        joined_at: team.created_at,
      },
      ...members,
    ];

    return NextResponse.json({
      success: true,
      data: allMembers,
      total: allMembers.length,
    });
  } catch (error: any) {
    console.error('[Team Members] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/teams/members - Add a team member
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { team_id, member_user_id, role } = body;

    if (!userId || !team_id || !member_user_id || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: team_id, member_user_id, role' },
        { status: 400 }
      );
    }

    // Verify user has permission to manage this team
    const team = memoryDB.teams.get(team_id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Only team owner or admin can add members
    if (team.owner_id !== userId) {
      const membership = Array.from(memoryDB.teamMembers.values()).find(
        m => m.team_id === team_id && m.user_id === userId && m.role === 'admin'
      );
      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have permission to manage team members' },
          { status: 403 }
        );
      }
    }

    // Check if member already exists
    const existingMember = Array.from(memoryDB.teamMembers.values()).find(
      m => m.team_id === team_id && m.user_id === member_user_id
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 }
      );
    }

    // Create new team member
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newMember: TeamMember = {
      id: memberId,
      team_id,
      user_id: member_user_id,
      role: role as 'admin' | 'editor' | 'viewer',
      joined_at: new Date(),
    };

    memoryDB.teamMembers.set(memberId, newMember);

    return NextResponse.json(
      {
        success: true,
        message: 'Member added to team',
        data: newMember,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Team Members] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add team member', details: error.message },
      { status: 500 }
    );
  }
}
