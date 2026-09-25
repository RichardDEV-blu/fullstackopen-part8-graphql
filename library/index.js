const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const mongoose = require("mongoose");

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Conected to MongoDB");
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  startStandaloneServer(server, {
    listen: { port: 4000 },
  })
    .then(({ url }) => {
      console.log(`Server ready at ${url}`);
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB:", error.message);
    });
});
