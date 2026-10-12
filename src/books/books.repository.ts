import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MYSQL_POOL } from '../database/database.module';
import { Book } from './book.interface';

interface BookRow extends RowDataPacket {
  id: number;
  title: string;
  author: string;
  published_year: number;
  available: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const toBook = (row: BookRow): Book => ({
  id: row.id,
  title: row.title,
  author: row.author,
  published_year: row.published_year,
  available: row.available === 1,
});

// Escape LIKE wildcards so a search for "100%" is literal.
const likePattern = (search: string): string =>
  `%${search.toLowerCase().replace(/[\\%_]/g, '\\$&')}%`;

@Injectable()
export class BooksRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async findAvailable(params: {
    search?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Book[]; total: number }> {
    // The WHERE text is built only from constants; user input only goes in placeholders.
    let where = 'available = 1';
    const values: Array<string | number> = [];
    if (params.search) {
      where += ' AND LOWER(title) LIKE ?';
      values.push(likePattern(params.search));
    }

    const [countRows] = await this.pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM books WHERE ${where}`,
      values,
    );

    // pool.query (not execute): MySQL 8 prepared statements reject numeric LIMIT/OFFSET placeholders.
    const [rows] = await this.pool.query<BookRow[]>(
      `SELECT id, title, author, published_year, available
         FROM books
        WHERE ${where}
        ORDER BY title ASC, id ASC
        LIMIT ? OFFSET ?`,
      [...values, params.limit, params.offset],
    );

    return { items: rows.map(toBook), total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<Book | null> {
    const [rows] = await this.pool.query<BookRow[]>(
      'SELECT id, title, author, published_year, available FROM books WHERE id = ?',
      [id],
    );
    const row = rows[0];
    return row ? toBook(row) : null;
  }
}
