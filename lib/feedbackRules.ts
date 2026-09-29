/**
 * Shared between the client page and the API routes, so the limits and the
 * status list can never drift apart.
 */

export const FEEDBACK_MAX_TITLE = 150;
export const FEEDBACK_MIN_TITLE = 3;
export const FEEDBACK_MAX_DESCRIPTION = 2000;
export const FEEDBACK_MIN_DESCRIPTION = 10;

export const FEEDBACK_MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
/** Slack for multipart boundaries and the other form fields. */
export const FEEDBACK_MULTIPART_OVERHEAD = 4096;

export const FEEDBACK_ALLOWED_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

/** Abuse limits — the "prevent a DoS" half of this feature. */
export const FEEDBACK_POST_WINDOW_MS = 10 * 60 * 1000;
export const FEEDBACK_POST_MAX_PER_USER = 5;
export const FEEDBACK_POST_MAX_PER_IP = 10;
export const FEEDBACK_WRITE_WINDOW_MS = 60 * 1000;
export const FEEDBACK_WRITE_MAX_PER_USER = 20;
export const FEEDBACK_LIST_WINDOW_MS = 60 * 1000;
export const FEEDBACK_LIST_MAX_PER_USER = 60;

export const FEEDBACK_PAGE_SIZE = 20;
export const FEEDBACK_MAX_PAGE_SIZE = 50;

export const FEEDBACK_STATUSES = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'priority', label: 'On Priority' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'ignored', label: 'Ignored' },
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]['id'];

export const DEFAULT_FEEDBACK_STATUS: FeedbackStatus = 'open';

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return FEEDBACK_STATUSES.some((s) => s.id === value);
}

export function feedbackStatusLabel(id: string): string {
  return FEEDBACK_STATUSES.find((s) => s.id === id)?.label ?? id;
}
