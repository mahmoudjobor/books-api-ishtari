import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Book, BookPage } from './book.interface';
import { BookNotFoundException } from './book-not-found.exception';
import { BooksRepository } from './books.repository';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

const CACHE_TTL_SECONDS = 300;

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly repository: BooksRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async list(query: ListBooksQueryDto): Promise<BookPage> {
    const { page, limit, search } = query;
    const { items, total } = await this.repository.findAvailable({
      search,
      limit,
      offset: (page - 1) * limit,
    });
    return { items, page, limit, total };
  }

  async getById(id: number): Promise<Book> {
    const key = `book:${id}`;

    const cached = await this.readCache(key);
    if (cached) return cached;

    const book = await this.repository.findById(id);
    if (!book) throw new BookNotFoundException(id);

    await this.writeCache(key, book);
    return book;
  }

  private async readCache(key: string): Promise<Book | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as Book) : null;
    } catch (err) {
      this.logger.warn(
        `Cache read failed, using database: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private async writeCache(key: string, book: Book): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(book), 'EX', CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Cache write failed: ${(err as Error).message}`);
    }
  }
}
