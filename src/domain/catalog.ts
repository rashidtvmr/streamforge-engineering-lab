import type { CatalogPage, CatalogQuery, Category, SortOrder, Video } from './types.ts';

export function filterVideos(
  videos: readonly Video[],
  query: string,
  category: Category | 'all',
): Video[] {
  const needle = query.trim().toLocaleLowerCase('en-US');
  return videos.filter((video) => {
    if (category !== 'all' && video.category !== category) return false;
    if (!needle) return true;
    return [video.title, video.creator, video.description].some((part) =>
      part.toLocaleLowerCase('en-US').includes(needle),
    );
  });
}

export function sortVideos(videos: readonly Video[], sort: SortOrder): Video[] {
  return [...videos].sort((a, b) => {
    const delta = sort === 'popular'
      ? b.views - a.views
      : Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    return delta || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}

export function paginateVideos(videos: readonly Video[], page: number, pageSize: number): Video[] {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError('page and pageSize must be positive safe integers');
  }
  return videos.slice((page - 1) * pageSize, page * pageSize);
}

export function catalogPage(videos: readonly Video[], params: CatalogQuery): CatalogPage {
  const matching = sortVideos(filterVideos(videos, params.query, params.category), params.sort);
  return {
    data: paginateVideos(matching, params.page, params.pageSize),
    total: matching.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}
