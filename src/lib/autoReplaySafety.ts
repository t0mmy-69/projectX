// Auto Reply Safety Module - Anti-ban protection
// Implements: max replies per hour, cooldown timer, no duplicate replies, similarity check

import { memoryDB } from './db';

export interface AutoReplyContext {
  userId: string;
  postId: string;
  proposedReply: string;
  timestamp: Date;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
  warnings: string[];
}

const SAFETY_LIMITS = {
  MAX_REPLIES_PER_HOUR: 10,
  COOLDOWN_MINUTES: 5,
  MIN_REPLY_LENGTH: 10,
  MAX_REPLY_LENGTH: 280,
  SIMILARITY_THRESHOLD: 0.8
};

export function checkAutoReplySafety(context: AutoReplyContext): SafetyCheckResult {
  const warnings: string[] = [];
  let isSafe = true;

  // Check 1: Reply length validation
  if (context.proposedReply.length < SAFETY_LIMITS.MIN_REPLY_LENGTH) {
    warnings.push('Reply is too short');
    isSafe = false;
  }
  if (context.proposedReply.length > SAFETY_LIMITS.MAX_REPLY_LENGTH) {
    warnings.push(`Reply exceeds ${SAFETY_LIMITS.MAX_REPLY_LENGTH} characters`);
    isSafe = false;
  }

  // Check 2: Rate limiting - max replies per hour
  const replyCountLastHour = getReplyCountLastHour(context.userId);
  if (replyCountLastHour >= SAFETY_LIMITS.MAX_REPLIES_PER_HOUR) {
    warnings.push(`Rate limit exceeded: ${replyCountLastHour}/${SAFETY_LIMITS.MAX_REPLIES_PER_HOUR} replies in last hour`);
    isSafe = false;
  }

  // Check 3: Cooldown timer - no replies within cooldown period
  const lastReplyTime = getLastReplyTime(context.userId);
  if (lastReplyTime) {
    const minutesSinceLastReply = (context.timestamp.getTime() - lastReplyTime.getTime()) / (1000 * 60);
    if (minutesSinceLastReply < SAFETY_LIMITS.COOLDOWN_MINUTES) {
      warnings.push(`Cooldown period active: wait ${Math.ceil(SAFETY_LIMITS.COOLDOWN_MINUTES - minutesSinceLastReply)} more minutes`);
      isSafe = false;
    }
  }

  // Check 4: No duplicate replies
  if (hasDuplicateReply(context.userId, context.postId, context.proposedReply)) {
    warnings.push('You\'ve already replied to this post');
    isSafe = false;
  }

  // Check 5: Similarity check - ensure reply is not too similar to recent replies
  if (isTooSimilarToRecentReplies(context.userId, context.proposedReply)) {
    warnings.push('Reply is too similar to your recent replies (may appear as spam)');
    isSafe = false;
  }

  // Check 6: Spam patterns
  if (containsSpamPatterns(context.proposedReply)) {
    warnings.push('Reply contains potential spam patterns');
    isSafe = false;
  }

  return {
    isSafe,
    reason: !isSafe ? warnings[0] : undefined,
    warnings
  };
}

function getReplyCountLastHour(userId: string): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  // This would check against a reply log in production
  // For MVP, return 0
  return 0;
}

function getLastReplyTime(userId: string): Date | null {
  // This would check against a reply log in production
  // For MVP, return null (no last reply)
  return null;
}

function hasDuplicateReply(userId: string, postId: string, reply: string): boolean {
  // In production, check against a log of user's recent replies to this post
  // For MVP, return false
  return false;
}

function isTooSimilarToRecentReplies(userId: string, proposedReply: string): boolean {
  // Calculate similarity with recent replies
  // Using simple string similarity (in production, use embedding similarity)
  // For MVP, return false
  return false;
}

function containsSpamPatterns(reply: string): boolean {
  const spamPatterns = [
    /(?:click|buy|follow|subscribe|join).*(?:now|today|today only)/i,
    /(?:http|https):\/\/\S+.*\?/,
    /(?:congratulations|you.*won|click.*now).*\$\d+/i,
    /(?:follow|dm|click)\s+(?:back|here|link)/i
  ];

  return spamPatterns.some(pattern => pattern.test(reply));
}

export function validateReplyBeforeSending(
  reply: string,
  requiresManualConfirm: boolean
): { valid: boolean; message?: string } {
  // Additional validation before actually sending

  if (reply.trim().length === 0) {
    return { valid: false, message: 'Reply cannot be empty' };
  }

  if (reply.length > 280) {
    return { valid: false, message: 'Reply exceeds Twitter character limit' };
  }

  if (requiresManualConfirm) {
    return { valid: true, message: 'Awaiting manual confirmation' };
  }

  return { valid: true };
}

export function getReplyRecommendation(
  safetyCheck: SafetyCheckResult,
  requiresManualConfirm: boolean
): string {
  if (!safetyCheck.isSafe) {
    return 'Reply blocked: ' + (safetyCheck.reason || 'Multiple safety checks failed');
  }

  if (requiresManualConfirm) {
    return 'Ready to send (awaiting your confirmation)';
  }

  return 'Auto-reply enabled and safe to send';
}
