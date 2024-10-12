import type { APIGatewayProxyHandler } from "aws-lambda";

import { onMounted, ref } from "vue";
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();
// create a reactive reference to the array of todos
const todos = ref<Array<Schema["Todo"]["type"]>>([]);

export const handler: APIGatewayProxyHandler = async (event) => {
  switch (event.httpMethod) {
    case "GET":
      const { data: items, errors } = await client.models.Todo.list();
      todos.value = items;

      return {
        statusCode: 200,
        // Modify the CORS settings below to match your specific requirements
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        // body: JSON.stringify("Hello from myFunction!"),
        body: JSON.stringify(items),
      };
    case "POST":
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "POST failed" }),
        };
      }

      const postData = JSON.parse(event.body);
      await client.models.Todo.create({
        content: postData.content,
      });

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify({ message: "POST Succeeded" }),
      };
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
  }
};
