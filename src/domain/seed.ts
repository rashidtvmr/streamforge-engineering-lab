import type { Category, Video } from './types.ts';

const topics: ReadonlyArray<readonly [string, Category, string]> = [
  ['React rendering at scale', 'engineering', 'Find and fix expensive render paths.'],
  ['Anatomy of a design system', 'design', 'Tokens, accessibility, and shared components.'],
  ['How great products get discovered', 'product', 'Validate problems before writing code.'],
  ['The science of deep oceans', 'science', 'What lies beneath the sunlight zone.'],
  ['Testing asynchronous JavaScript', 'engineering', 'Promises, clocks, and deterministic tests.'],
  ['Designing accessible colors', 'design', 'Contrast, themes, and inclusive experiences.'],
  ['The product metrics that matter', 'product', 'Avoid vanity metrics and define outcomes.'],
  ['How satellites stay in orbit', 'science', 'Orbital mechanics in plain language.'],
  ['Frontend performance budgets', 'engineering', 'Core Web Vitals and loading strategies.'],
  ['Prototyping delightful navigation', 'design', 'Information architecture in practice.'],
  ['Prioritizing a product roadmap', 'product', 'Make trade-offs explicit with evidence.'],
  ['Why solar storms matter', 'science', 'Space weather and electrical infrastructure.'],
  ['Resilient backend architecture', 'engineering', 'Fault tolerance, retries, and idempotency.'],
  ['Motion that communicates', 'design', 'Use animation responsibly and accessibly.'],
  ['Solving onboarding friction', 'product', 'Understand activation and user journeys.'],
  ['The mathematics of black holes', 'science', 'Space-time, gravity, and discovery.'],
  ['TypeScript at system boundaries', 'engineering', 'Types do not validate runtime input.'],
  ['Building better search interfaces', 'design', 'Helpful results, filters, and empty states.'],
  ['Running ethical experiments', 'product', 'Experiment guardrails and decision quality.'],
  ['The physics of sound', 'science', 'Vibrations, waves, and human hearing.'],
  ['Understanding browser event loops', 'engineering', 'Microtasks, macrotasks, and rendering.'],
  ['Design critiques with empathy', 'design', 'Better reviews of design choices.'],
  ['Customer interviews that work', 'product', 'Learn without leading the witness.'],
  ['The future of battery science', 'science', 'Understanding chemistry and storage.'],
];

const creators = ['Systems Studio', 'Northstar Media', 'Build Better', 'Open Science'];

/** Stable synthetic fixtures: no random seeds, external APIs, or system clock. */
export const seedVideos: readonly Video[] = topics.map(([title, category, description], index) => ({
  id: `video-${String(index + 1).padStart(3, '0')}`,
  title,
  category,
  description,
  creator: creators[index % creators.length] ?? 'StreamForge',
  views: 1200 + ((index * 37031) % 450000),
  durationSeconds: 300 + ((index * 193) % 1800),
  publishedAt: new Date(Date.UTC(2026, 9, 31 - index, 12)).toISOString(),
}));
