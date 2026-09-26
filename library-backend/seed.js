const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const mongoose = require("mongoose");

const Author = require("./models/author");
const Book = require("./models/book");

const authors = [
  {
    name: "Robert Martin",
    born: 1952,
  },
  {
    name: "Martin Fowler",
    born: 1963,
  },
  {
    name: "Fyodor Dostoevsky",
    born: 1821,
  },
  {
    name: "Joshua Kerievsky",
  },
  {
    name: "Sandi Metz",
  },
];

const books = [
  {
    title: "Clean Code",
    published: 2008,
    author: "Robert Martin",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    author: "Robert Martin",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    author: "Martin Fowler",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    author: "Joshua Kerievsky",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
    published: 2012,
    author: "Sandi Metz",
    genres: ["refactoring", "design"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    author: "Fyodor Dostoevsky",
    genres: ["classic", "crime"],
  },
  {
    title: "Demons",
    published: 1872,
    author: "Fyodor Dostoevsky",
    genres: ["classic", "revolution"],
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("Connected to MongoDB");

  await Book.deleteMany({});
  await Author.deleteMany({});

  const createdAuthors = {};

  for (const authorData of authors) {
    const author = new Author(authorData);
    const savedAuthor = await author.save();

    createdAuthors[savedAuthor.name] = savedAuthor;
  }

  for (const bookData of books) {
    const book = new Book({
      title: bookData.title,
      published: bookData.published,
      genres: bookData.genres,
      author: createdAuthors[bookData.author]._id,
    });

    await book.save();
  }

  console.log("Database seeded successfully");

  await mongoose.connection.close();
};

seed().catch((error) => {
  console.error(error);
  mongoose.connection.close();
});
