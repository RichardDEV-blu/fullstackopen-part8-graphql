import { useQuery } from "@apollo/client/react";
import { ALL_BOOKS, ME } from "../queries";

const FavoriteBooks = ({ show, loggedIn }) => {
  const {
    data: booksData,
    loading: booksLoading,
    error: booksError,
  } = useQuery(ALL_BOOKS, {
    skip: !show || !loggedIn,
  });

  const {
    data: meData,
    loading: meLoading,
    error: meError,
  } = useQuery(ME, {
    skip: !show || !loggedIn,
  });

  if (!show) {
    return null;
  }

  if (booksLoading || meLoading) {
    return <div>loading...</div>;
  }

  if (booksError || meError) {
    return <div>Error loading data</div>;
  }

  if (!meData?.me) {
    return <div>You need to be logged in</div>;
  }

  const books = booksData.allBooks;
  const favoriteGenre = meData.me?.favoriteGenre;

  const favoriteBooks = books.filter((book) =>
    book.genres.includes(favoriteGenre),
  );

  return (
    <div>
      <h2>books in your favorite genre: {favoriteGenre}</h2>

      <table>
        <tbody>
          <tr>
            <th>title</th>
            <th>author</th>
            <th>published</th>
          </tr>

          {favoriteBooks.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FavoriteBooks;
