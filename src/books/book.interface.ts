export interface Book {
  id: number;
  title: string;
  author: string;
  published_year: number;
  available: boolean;
}

export interface BookPage {
  items: Book[];
  page: number;
  limit: number;
  total: number;
}
