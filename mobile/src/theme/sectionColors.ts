/**
 * One accent per learning area. The area's own screens, its tile in the learn tab and its entries on
 * the home and progress screens all read from here, so the colours cannot drift apart.
 */
export const SECTION_COLOR = {
  vocabulary: '#7FAE1B',
  dailyWords: '#F59E0B',
  review: '#7FAE1B',
  grammar: '#4D94FF',
  reading: '#8B5CF6',
  expressions: '#27AE7A',
  redemittel: '#EC5B8A',
  exam: '#EC3E4E',
} as const;
