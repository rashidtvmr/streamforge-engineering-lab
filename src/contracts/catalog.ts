import { categories, type CatalogPage, type Video } from '../domain/types.ts';

function record(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

function nonnegativeInteger(input: unknown): input is number {
  return typeof input === 'number' && Number.isSafeInteger(input) && input >= 0;
}

export function parseVideo(input: unknown): Video {
  if (!record(input) ||
      typeof input.id !== 'string' || input.id.length === 0 ||
      typeof input.title !== 'string' || input.title.length === 0 ||
      typeof input.creator !== 'string' ||
      typeof input.description !== 'string' ||
      !categories.some((value) => value === input.category) ||
      !nonnegativeInteger(input.views) ||
      !nonnegativeInteger(input.durationSeconds) ||
      typeof input.publishedAt !== 'string' ||
      !Number.isFinite(Date.parse(input.publishedAt))) {
    throw new Error('INVALID_VIDEO_RESPONSE');
  }
  return input as unknown as Video;
}

export function parseCatalogPage(input: unknown): CatalogPage {
  if (!record(input) ||
      !Array.isArray(input.data) ||
      !nonnegativeInteger(input.total) ||
      !nonnegativeInteger(input.page) || input.page < 1 ||
      !nonnegativeInteger(input.pageSize) || input.pageSize < 1 ||
      input.data.length > input.pageSize || input.total < input.data.length) {
    throw new Error('INVALID_CATALOG_RESPONSE');
  }
  const videos = input.data.map(parseVideo);
  return { data: videos, total: input.total, page: input.page, pageSize: input.pageSize };
}
