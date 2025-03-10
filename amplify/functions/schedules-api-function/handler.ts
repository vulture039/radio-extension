import type { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";

export const handler: APIGatewayProxyHandler = async (event) => {
  switch (event.httpMethod) {
    case "GET":
      const title = event.pathParameters?.title;
      const stationId = event.pathParameters?.stationId;
      const uid = event.requestContext.authorizer?.claims?.sub;

      const { data } = await axios.get(
        `https://radiko.jp/v3/api/program/search?key=${title}&station_id=${stationId}&uid=${uid}&app_id=pc`
      );
      console.log("get program from radiko: ", data);

      return {
        statusCode: 200,
        // Modify the CORS settings below to match your specific requirements
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify(data),
      };
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
  }
};
