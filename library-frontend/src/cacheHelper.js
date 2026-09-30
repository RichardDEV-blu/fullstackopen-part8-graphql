import { ALL_BOOKS } from "./queries";

export const addBookToCache = (genre, cache, bookToAdd) => {
  if (genre && !bookToAdd.genres.includes(genre)) {
    return;
  }

  cache.updateQuery(
    {
      query: ALL_BOOKS,
      variables: {
        genre,
      },
    },
    (data) => {
      if (!data) {
        return null;
      }

      const { allBooks } = data;

      const bookExists = allBooks.some((book) => book.id === bookToAdd.id);

      if (bookExists) {
        return { allBooks };
      }

      return {
        allBooks: allBooks.concat(bookToAdd),
      };
    },
  );
};
