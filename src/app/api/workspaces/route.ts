// Workspace management endpoints
// Handles workspace creation and data sharing

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, Workspace, Team } from '@/lib/db';

// GET /api/workspaces - List all workspaces user has access to
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get workspaces for teams user owns or is member of
    const userTeamIds = Array.from(memoryDB.teams.values())
      .filter(t => t.owner_id === userId ||
        Array.from(memoryDB.teamMembers.values()).some(m => m.user_id === userId && m.team_id === t.id)
      )
      .map(t => t.id);

    const workspaces = Array.from(memoryDB.workspaces.values()).filter(
      w => userTeamIds.includes(w.team_id) && w.is_active
    );

    // Enrich with team names
    const workspacesWithTeams = workspaces.map(ws => {
      const team = memoryDB.teams.get(
        Array.from(memoryDB.teams.values()).find(t => t.id === ws.team_id)?.id || ''
      );
      return {
        ...ws,
        teamName: team?.name || 'Unknown Team',
      };
    });

    return NextResponse.json({
      success: true,
      data: workspacesWithTeams,
      total: workspacesWithTeams.length,
    });
  } catch (error: any) {
    console.error('[Workspaces] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create a new workspace
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
    const { team_id, name, description } = body;

    // Validate required fields
    if (!team_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: team_id, name' },
        { status: 400 }
      );
    }

    // Verify user has permission to create workspace in this team
    const team = memoryDB.teams.get(team_id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Only team owner or admin can create workspaces
    if (team.owner_id !== userId) {
      const membership = Array.from(memoryDB.teamMembers.values()).find(
        m => m.team_id === team_id && m.user_id === userId && m.role === 'admin'
      );
      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have permission to create workspaces in this team' },
          { status: 403 }
        );
      }
    }

    // Create new workspace
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newWorkspace: Workspace = {
      id: workspaceId,
      team_id,
      name,
      description,
      owner_id: userId,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    memoryDB.workspaces.set(workspaceId, newWorkspace);

    return NextResponse.json(
      {
        success: true,
        message: 'Workspace created successfully',
        data: newWorkspace,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Workspaces] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace', details: error.message },
      { status: 500 }
    );
  }
}
