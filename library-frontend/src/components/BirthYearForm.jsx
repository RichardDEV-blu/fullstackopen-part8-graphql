import { useState } from "react";
import Select from "react-select";

const BirthYearForm = ({ authors, editAuthor }) => {
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [born, setBorn] = useState("");

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
    <>
      <h3>Set birthyear</h3>

      <form onSubmit={submit}>
        <div>
          <select
            name="name"
            value={selectedAuthor ? selectedAuthor.value : ""}
            onChange={(event) => {
              const option = options.find(
                (option) => option.value === event.target.value,
              );
              setSelectedAuthor(option);
            }}
          >
            <option value="">Select author...</option>

            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            born
            <input
              type="number"
              step="1"
              value={born}
              onChange={(event) => setBorn(event.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={!selectedAuthor || born === ""}>
          update author
        </button>
      </form>
    </>
  );
};

export default BirthYearForm;
