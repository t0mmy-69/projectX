// Content Generator - Creates hooks and drafts based on persona
// Input: Persona JSON, Summary, Category
// Output: 3 hook variations, 1 tweet draft, optional thread

import { PersonaProfile } from './personaEngine';

export interface GeneratedContent {
  hook_variation_1: string;
  hook_variation_2: string;
  hook_variation_3: string;
  tweet_draft: string;
  thread_draft?: string;
}

interface GenerationInput {
  persona: PersonaProfile;
  summary: string;
  category: string;
  topic: string;
}

export function generateContent(input: GenerationInput): GeneratedContent {
  const { persona, summary, category, topic } = input;

  // Generate 3 hook variations
  const hooks = [
    generateHook(persona, summary, 'variant1'),
    generateHook(persona, summary, 'variant2'),
    generateHook(persona, summary, 'variant3'),
  ];

  // Generate main tweet draft
  const tweetDraft = generateTweetDraft(persona, summary, hooks[0]);

  // Optionally generate thread
  const threadDraft = category === 'data_research' || category === 'narrative_shift'
    ? generateThread(persona, summary, topic)
    : undefined;

  return {
    hook_variation_1: hooks[0],
    hook_variation_2: hooks[1],
    hook_variation_3: hooks[2],
    tweet_draft: tweetDraft,
    thread_draft: threadDraft
  };
}

function generateHook(persona: PersonaProfile, summary: string, variant: string): string {
  const firstSentence = summary.split('.')[0];

  if (persona.hook_style === 'question') {
    return generateQuestionHook(firstSentence, variant);
  } else if (persona.hook_style === 'thread') {
    return generateThreadHook(firstSentence);
  } else if (persona.hook_style === 'reference') {
    return generateReferenceHook(firstSentence);
  }

  return generateStatementHook(firstSentence, variant);
}

function generateQuestionHook(text: string, variant: string): string {
  const questions = [
    `What if ${text.toLowerCase()}?`,
    `Did you know: ${text}?`,
    `Ever wondered why ${text.toLowerCase()}?`
  ];

  const index = variant === 'variant1' ? 0 : variant === 'variant2' ? 1 : 2;
  return questions[index % questions.length];
}

function generateThreadHook(text: string): string {
  return `🧵 A thread on: ${text}`;
}

function generateReferenceHook(text: string): string {
  return `Worth reading: ${text}`;
}

function generateStatementHook(text: string, variant: string): string {
  if (variant === 'variant1') {
    return `${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`;
  } else if (variant === 'variant2') {
    return `Hot take: ${text}`;
  }
  return `Interesting: ${text}`;
}

function generateTweetDraft(persona: PersonaProfile, summary: string, hook: string): string {
  let draft = hook + '\n\n';

  // Add body
  draft += summary;

  // Add CTA based on persona
  if (persona.cta_style === 'direct') {
    draft += '\n\nRead the full analysis →';
  } else if (persona.cta_style === 'subtle') {
    draft += '\n\nWhat are your thoughts?';
  }

  // Add emoji if persona uses them
  if (persona.emoji_usage > 50) {
    draft = draft.replace(/\?$/, '? 🤔');
    draft = draft.replace(/→$/, '→ 📖');
  }

  return draft;
}

function generateThread(persona: PersonaProfile, summary: string, topic: string): string {
  const sentences = summary.split('.');
  let threadParts = [`1/${sentences.length + 1}\n${topic}: ${sentences[0]}`];

  for (let i = 1; i < sentences.length && i < 5; i++) {
    threadParts.push(`${i + 1}/${sentences.length + 1}\n${sentences[i].trim()}`);
  }

  threadParts.push(`${sentences.length + 1}/${sentences.length + 1}\n🧵 What's your take on this?`);

  return threadParts.join('\n---\n');
}
