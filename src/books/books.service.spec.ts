import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Book } from './book.interface';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';

describe('BooksService', () => {
  let service: BooksService;
  const repo = { findById: jest.fn(), findAvailable: jest.fn() };
  const redis = { get: jest.fn(), set: jest.fn() };

  const book: Book = {
    id: 5,
    title: 'Oliver Twist',
    author: 'Charles Dickens',
    published_year: 1838,
    available: false,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: BooksRepository, useValue: repo },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();
    service = moduleRef.get(BooksService);
  });

  it('throws 404 BOOK_NOT_FOUND when the book does not exist', async () => {
    redis.get.mockResolvedValue(null);
    repo.findById.mockResolvedValue(null);

    await expect(service.getById(99)).rejects.toMatchObject({
      status: 404,
      response: { code: 'BOOK_NOT_FOUND' },
    });
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('does not call the repository on a cache hit', async () => {
    redis.get.mockResolvedValue(JSON.stringify(book));

    await expect(service.getById(5)).resolves.toEqual(book);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('reads from the database and caches for 5 minutes on a cache miss', async () => {
    redis.get.mockResolvedValue(null);
    repo.findById.mockResolvedValue(book);

    await expect(service.getById(5)).resolves.toEqual(book);
    expect(redis.set).toHaveBeenCalledWith(
      'book:5',
      JSON.stringify(book),
      'EX',
      300,
    );
  });

  it('still returns the book from the database when Redis throws', async () => {
    redis.get.mockRejectedValue(new Error('Redis down'));
    redis.set.mockRejectedValue(new Error('Redis down'));
    repo.findById.mockResolvedValue(book);

    await expect(service.getById(5)).resolves.toEqual(book);
    expect(repo.findById).toHaveBeenCalledWith(5);
  });

  it('calculates the offset from page and limit', async () => {
    repo.findAvailable.mockResolvedValue({ items: [], total: 7 });

    const result = await service.list({ page: 2, limit: 5, search: 'dick' });

    expect(repo.findAvailable).toHaveBeenCalledWith({
      search: 'dick',
      limit: 5,
      offset: 5,
    });
    expect(result).toEqual({ items: [], page: 2, limit: 5, total: 7 });
  });
});
