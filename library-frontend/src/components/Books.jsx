import { useQuery } from "@apollo/client/react";
import { ALL_BOOKS } from "../queries";
import { useState } from "react";
const Books = (props) => {
  const [genre, setGenre] = useState(null);
  const { data, loading, error } = useQuery(ALL_BOOKS, {
    variables: {
      genre,
    },
  });

  if (!props.show) {
    return null;
  }

  if (loading) {
    return <div>loading...</div>;
  }
  if (error) {
    return <div>Error loading books: {error.message}</div>;
  }

  const books = data.allBooks;

  const genres = [...new Set(books.flatMap((book) => book.genres))];

  return (
    <div>
      <h2>books {genre && `in genre ${genre}`}</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>title</th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {genres.map((genre) => (
          <button key={genre} onClick={() => setGenre(genre)}>
            {genre}
          </button>
        ))}

        <button onClick={() => setGenre(null)}>all genres</button>
      </div>
    </div>
  );
};

export default Books;
