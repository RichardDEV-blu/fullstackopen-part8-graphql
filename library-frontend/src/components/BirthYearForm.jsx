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
            step="1"
            value={born}
            onChange={(event) => setBorn(event.target.value)}
          />
        </div>

        <button type="submit" disabled={!selectedAuthor || born === ""}>
          update author
        </button>
      </form>
    </>
  );
};

export default BirthYearForm;
