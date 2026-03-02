// Automation Engine - IF condition → action logic
// No AI required, pure rule-based automation

export type ConditionType = 'viral_score' | 'category_match' | 'likes_threshold' | 'age_threshold';
export type ActionType = 'suggest_cta' | 'suggest_repost' | 'auto_reply' | 'notify';

export interface AutomationRule {
  id: string;
  condition_type: ConditionType;
  condition_value: string; // e.g., "50" for viral score > 50
  action_type: ActionType;
  is_active: boolean;
}

export interface AutomationContext {
  viralScore: number;
  category: string;
  likes: number;
  hours_since_posted: number;
}

export interface AutomationAction {
  type: ActionType;
  message: string;
  data?: Record<string, unknown>;
}

export function evaluateRules(rules: AutomationRule[], context: AutomationContext): AutomationAction[] {
  const actions: AutomationAction[] = [];

  for (const rule of rules) {
    if (!rule.is_active) continue;

    if (evaluateCondition(rule.condition_type, rule.condition_value, context)) {
      actions.push(createAction(rule.action_type, context, rule));
    }
  }

  return actions;
}

function evaluateCondition(
  type: ConditionType,
  value: string,
  context: AutomationContext
): boolean {
  switch (type) {
    case 'viral_score':
      return context.viralScore > parseFloat(value);

    case 'category_match':
      return context.category === value;

    case 'likes_threshold':
      return context.likes > parseInt(value);

    case 'age_threshold':
      return context.hours_since_posted > parseInt(value);

    default:
      return false;
  }
}

function createAction(
  actionType: ActionType,
  context: AutomationContext,
  rule: AutomationRule
): AutomationAction {
  switch (actionType) {
    case 'suggest_cta':
      return {
        type: 'suggest_cta',
        message: `Post has ${context.likes} likes. Consider adding a call-to-action.`,
        data: { likes: context.likes }
      };

    case 'suggest_repost':
      return {
        type: 'suggest_repost',
        message: `This post is trending (viral score: ${context.viralScore}). Consider reposting.`,
        data: { viralScore: context.viralScore }
      };

    case 'auto_reply':
      return {
        type: 'auto_reply',
        message: `Auto-reply trigger matched for ${context.category} category`,
        data: { category: context.category }
      };

    case 'notify':
      return {
        type: 'notify',
        message: `Notification: Rule "${rule.id}" triggered`,
        data: { ruleId: rule.id }
      };

    default:
      return {
        type: 'notify',
        message: 'Unknown action triggered'
      };
  }
}

// Helper function to check if post should be reposted based on common criteria
export function shouldRepost(
  viralScore: number,
  age_hours: number,
  likes: number
): boolean {
  // Repost if viral score > 75 AND post is between 3 and 12 hours old
  return viralScore > 75 && age_hours > 3 && age_hours < 12;
}

// Helper function to check if CTA should be suggested
export function shouldSuggestCTA(likes: number, replies: number): boolean {
  // Suggest CTA if likes > 50 and relatively low replies (opportunity to increase engagement)
  return likes > 50 && replies < likes / 3;
}
