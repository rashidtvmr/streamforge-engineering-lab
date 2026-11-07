export const categories = ['engineering', 'design', 'product', 'science'] as const;
export type Category = (typeof categories)[number];
export type SortOrder = 'recent' | 'popular';

export interface Video {
  readonly id: string;
  readonly title: string;
  readonly creator: string;
  readonly description: string;
  readonly category: Category;
  readonly durationSeconds: number;
  readonly views: number;
  readonly publishedAt: string;
  readonly mediaUrl?: string;
}

export interface CatalogQuery {
  readonly query: string;
  readonly category: Category | 'all';
  readonly sort: SortOrder;
  readonly page: number;
  readonly pageSize: number;
}

export interface CatalogPage {
  readonly data: Video[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
