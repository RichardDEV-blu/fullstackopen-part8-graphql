const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const User = require("./models/user");

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Conected to MongoDB");
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
        return {};
      }
      const token = auth.substring(7);
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    },
  })
    .then(({ url }) => {
      console.log(`Server ready at ${url}`);
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB:", error.message);
    });
});
