const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { GraphQLError } = require("graphql");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/use/ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const User = require("./models/user");

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const app = express();
  const httpServer = http.createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/",
  });

  const serverCleanup = useServer(
    {
      schema,
    },
    wsServer,
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({
        httpServer,
      }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization;

        if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
          return {};
        }

        const token = auth.substring(7);

        let decodedToken;
        try {
          decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
          throw new GraphQLError("invalid token", {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        }

        const currentUser = await User.findById(decodedToken.id);

        return { currentUser };
      },
    }),
  );

  httpServer.listen(4000, () => {
    console.log("Server ready at http://localhost:4000/");
  });
};

start().catch((error) => {
  console.log("Error starting server:", error.message);
  process.exit(1);
});
