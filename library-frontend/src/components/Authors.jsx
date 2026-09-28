import { useQuery, useMutation } from "@apollo/client/react";
import { ALL_AUTHORS, EDIT_AUTHOR } from "../queries";
import BirthYearForm from "./BirthYearForm";
const Authors = ({ show, loggedIn }) => {
  const { data, loading, error } = useQuery(ALL_AUTHORS);

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ALL_AUTHORS],
  });

  if (!show) {
    return null;
  }

  if (loading) {
    return <div>loading...</div>;
  }

  if (error) {
    return <div>Error loading authors: {error.message}</div>;
  }

  const authors = data.allAuthors;

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {loggedIn && (
        <BirthYearForm
          authors={authors}
          editAuthor={editAuthor}
        ></BirthYearForm>
      )}
    </div>
  );
};

export default Authors;
