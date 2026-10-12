CREATE DATABASE IF NOT EXISTS library CHARACTER SET utf8mb4;
USE library;

CREATE TABLE books (
  id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  author         VARCHAR(120) NOT NULL,
  published_year SMALLINT NOT NULL,
  available      TINYINT(1) NOT NULL DEFAULT 1
);

CREATE INDEX idx_books_available_title ON books (available, title);

INSERT INTO books (id, title, author, published_year, available) VALUES
  (1, 'Pride and Prejudice', 'Jane Austen', 1813, 1),
  (2, 'Emma', 'Jane Austen', 1815, 1),
  (3, 'Moby-Dick', 'Herman Melville', 1851, 1),
  (4, 'Great Expectations', 'Charles Dickens', 1861, 1),
  (5, 'Oliver Twist', 'Charles Dickens', 1838, 0),
  (6, 'The Time Machine', 'H. G. Wells', 1895, 1),
  (7, 'Dracula', 'Bram Stoker', 1897, 1),
  (8, 'Frankenstein', 'Mary Shelley', 1818, 1);