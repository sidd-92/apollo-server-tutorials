// npm install @apollo/server express graphql cors
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import morgan from "morgan";
import http from "http";
import cors from "cors";
import axios from "axios";
const API_URL = "https://dummyjson.com/products";
const books = [
	{
		title: "The Awakening",
		author: "Kate Chopin",
	},
	{
		title: "City of Glass",
		author: "Paul Auster",
	},
];

const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }
    type Product {
    id: ID!
    title: String!
    description: String!
    price: Float!
    }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }

  type Query {
    products: [Product]
    product(id: ID!): Product
  }

  type Mutation {
  addBook(title: String, author: String): Book
}

type Mutation {
    createProduct(title: String!, description: String!, price: Float!): Product
    updateProduct(id: ID!, title: String, description: String, price: Float): Product
    deleteProduct(id: ID!): Product
  }
`;

const resolvers = {
	Query: {
		books: () => books,
		products: async () => {
			const response = await axios.get(API_URL);
			return response.data.products;
		},
	},
	Mutation: {
		addBook: (_: any, { title, author }: { title: string; author: string }) => {
			const newBook = { title, author };
			books.push(newBook);
			return newBook;
		},
		createProduct: async (
			_: any,
			{ title, description, price }: { title: string; description: string; price: number }
		) => {
			const response = await axios.post(API_URL, { title, description, price });
			return response.data;
		},
	},
};
interface MyContext {
	token?: string;
}

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer<MyContext>({
	typeDefs,
	resolvers,
	plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
// Ensure we wait for our server to start
await server.start();
// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
	"/",
	cors<cors.CorsRequest>(),
	express.json(),
	// expressMiddleware accepts the same arguments:
	// an Apollo Server instance and optional configuration options
	expressMiddleware(server, {
		context: async ({ req }) => ({ token: req.headers.token }),
	})
);

// Modified server startup
await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);
