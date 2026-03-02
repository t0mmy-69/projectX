// Viral Score Engine - Formula from PRD
// (likes + 2 × reposts + replies) / minutes_since_posted
// Normalized by follower count (simplified for MVP: assume follower count = 1000)

export interface EngagementMetrics {
  likes: number;
  reposts: number;
  replies: number;
  posted_at: Date;
}

export function calculateViralScore(metrics: EngagementMetrics, followerCount: number = 1000): number {
  const minutesSincePosted = Math.max(1, getMinutesSincePost(metrics.posted_at));

  // Base viral score formula
  const rawScore = (metrics.likes + 2 * metrics.reposts + metrics.replies) / minutesSincePosted;

  // Normalize by follower count (divide by followers in thousands)
  const normalizedScore = rawScore / (followerCount / 1000);

  // Cap at reasonable maximum (e.g., 1000 for extreme viral posts)
  return Math.min(normalizedScore, 1000);
}

function getMinutesSincePost(postedAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - postedAt.getTime();
  return Math.floor(diffMs / (1000 * 60)); // Convert ms to minutes
}

export function shouldIgnorePost(metrics: EngagementMetrics, postedAt: Date): boolean {
  const hoursSincePosted = (new Date().getTime() - postedAt.getTime()) / (1000 * 60 * 60);

  // Ignore posts older than 24 hours
  if (hoursSincePosted > 24) return true;

  // Ignore low engagement posts (less than 5 total engagement)
  const totalEngagement = metrics.likes + metrics.reposts + metrics.replies;
  if (totalEngagement < 5) return true;

  return false;
}

export function roundViralScore(score: number): number {
  return Math.round(score * 10) / 10; // Round to 1 decimal place
}
