// Team management endpoints
// Handles team creation and management

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, Team, TeamMember } from '@/lib/db';

// GET /api/teams - List all teams the user belongs to
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get teams user owns
    const ownedTeams = Array.from(memoryDB.teams.values()).filter(
      t => t.owner_id === userId && t.is_active
    );

    // Get teams user is a member of
    const memberTeamIds = Array.from(memoryDB.teamMembers.values())
      .filter(m => m.user_id === userId)
      .map(m => m.team_id);

    const memberTeams = Array.from(memoryDB.teams.values()).filter(
      t => memberTeamIds.includes(t.id) && t.is_active
    );

    // Deduplicate: user can be both owner and member
    const ownedTeamIds = new Set(ownedTeams.map(t => t.id));
    const allTeams = [...ownedTeams, ...memberTeams.filter(t => !ownedTeamIds.has(t.id))];

    // Enrich with member count
    const teamsWithDetails = allTeams.map(team => ({
      ...team,
      memberCount: Array.from(memoryDB.teamMembers.values()).filter(
        m => m.team_id === team.id
      ).length + 1, // +1 for owner
      userRole: team.owner_id === userId ? 'owner' :
        Array.from(memoryDB.teamMembers.values()).find(
          m => m.team_id === team.id && m.user_id === userId
        )?.role || 'unknown',
    }));

    return NextResponse.json({
      success: true,
      data: teamsWithDetails,
      total: teamsWithDetails.length,
    });
  } catch (error: any) {
    console.error('[Teams] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Create new team
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newTeam: Team = {
      id: teamId,
      name,
      description,
      owner_id: userId,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    memoryDB.teams.set(teamId, newTeam);

    return NextResponse.json(
      {
        success: true,
        message: 'Team created successfully',
        data: newTeam,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Teams] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create team', details: error.message },
      { status: 500 }
    );
  }
}
