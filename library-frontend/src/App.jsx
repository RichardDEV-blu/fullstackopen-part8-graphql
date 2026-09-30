import { useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import FavoriteBooks from "./components/FavoriteBooks";
import { BOOK_ADDED } from "./queries";
import { useSubscription } from "@apollo/client/react";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(
    localStorage.getItem("library-user-token"),
  );

  const client = useApolloClient();

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const book = data.data?.bookAdded;
      if (book) {
        window.alert(`New book added: ${book.title}`);
      }
    },
  });

  const logout = () => {
    setToken(null);
    localStorage.removeItem("library-user-token");
    client.resetStore();
    setPage("login");
  };

  const loggedIn = Boolean(token);
  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>

        {loggedIn && <button onClick={() => setPage("add")}>add book</button>}

        {!loggedIn && <button onClick={() => setPage("login")}>login</button>}

        {loggedIn && (
          <button onClick={() => setPage("recommended")}>recommend</button>
        )}

        {loggedIn && <button onClick={logout}>logout</button>}
      </div>

      <Authors show={page === "authors"} loggedIn={loggedIn} />

      <Books show={page === "books"} />

      <NewBook show={page === "add" && loggedIn} />

      <FavoriteBooks show={page === "recommended"} loggedIn={loggedIn} />

      {!loggedIn && page === "login" && (
        <LoginForm
          show={page === "login"}
          setToken={setToken}
          setPage={setPage}
        />
      )}
    </div>
  );
};

export default App;
