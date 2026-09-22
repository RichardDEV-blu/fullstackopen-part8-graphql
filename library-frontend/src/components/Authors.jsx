import { useQuery, useMutation } from "@apollo/client/react";
import { ALL_AUTHORS, EDIT_AUTHOR } from "../queries";
import { useState } from "react";
import Select from "react-select";
const Authors = ({ show }) => {
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [born, setBorn] = useState("");

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

  const options = authors.map((author) => ({
    value: author.name,
    label: author.name,
  }));

  const submit = async (event) => {
    event.preventDefault();
    await editAuthor({
      variables: {
        name: selectedAuthor.value,
        setBornTo: Number(born),
      },
    });

    setSelectedAuthor(null);
    setBorn("");
  };

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
      <h3>Set birth year</h3>

      <form onSubmit={submit}>
        <div>
          <Select
            options={options}
            value={selectedAuthor}
            onChange={setSelectedAuthor}
            placeholder="Select author..."
          />
        </div>

        <div>
          born
          <input
            type="number"
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>

        <button type="submit" disabled={!selectedAuthor || born === ""}>
          update author
        </button>
      </form>
    </div>
  );
};

export default Authors;
