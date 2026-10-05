import type { Href } from 'expo-router';

// The backend's dashboard DTOs carry *web* paths (/dashboard/...). Translate them to mobile routes.
// Detail deep-links (lesson/article/exercise ids) land on the section screen until those screens exist.
const RULES: [RegExp, Href][] = [
  [/^\/dashboard\/daily-words/, '/learn/daily-words'],
  [/^\/dashboard\/vocabulary/, '/learn/vocabulary'],
  [/^\/dashboard\/grammar/, '/learn/grammar'],
  [/^\/dashboard\/reading/, '/learn/reading'],
  [/^\/dashboard\/expressions/, '/learn/expressions'],
  [/^\/dashboard\/exam-prep/, '/exam'],
  [/^\/dashboard\/?$/, '/home'],
];

export function toMobileHref(webRoute: string | null | undefined, fallback: Href = '/learn'): Href {
  if (!webRoute) return fallback;
  const [path, query] = webRoute.split('?');
  // Deep link to one grammar lesson: /dashboard/grammar/lesson?id=<id>
  if (path === '/dashboard/grammar/lesson') {
    const id = new URLSearchParams(query).get('id');
    if (id) return { pathname: '/grammar/[lessonId]', params: { lessonId: id } };
  }
  return RULES.find(([re]) => re.test(path))?.[1] ?? fallback;
}
