import axios from "axios";
import { DateTime } from "luxon";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { env } from "$amplify/env/programs-api-function";
import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

console.log("--- environment-variables ---");
console.log("env: ", env.ENV);
console.log("region: ", env.REGION);
console.log("tableName: ", env.TABLE_NAME);
console.log("--- environment-variables ---");

const client = new DynamoDBClient({ region: env.REGION });
const tableName = env.TABLE_NAME;

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  switch (event.httpMethod) {
    case "GET":
      const getParams = {
        TableName: tableName,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId },
        },
      };
      const command = new QueryCommand(getParams);
      const response = await client.send(command);
      const items = response.Items
        ? response.Items.map((item) => unmarshall(item))
        : [];

      return {
        statusCode: 200,
        // Modify the CORS settings below to match your specific requirements
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify(items),
      };
    case "POST":
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "POST failed" }),
        };
      }

      const pathParams = JSON.parse(event.body).url.split("/#!/")[1].split("/");
      const stationId = pathParams[1];
      const isOnAir = pathParams[0] === "live";
      const title = isOnAir
        ? await programTitle(stationId)
        : await programTitle(stationId, pathParams[2]);

      try {
        const putParams = {
          TableName: tableName,
          Item: {
            userId: { S: userId },
            timestamp: { N: Date.now().toString() },
            stationId: { S: stationId },
            title: { S: title },
          },
        };
        const putCommand = new PutItemCommand(putParams);
        await client.send(putCommand);
      } catch (exception) {
        console.log("create failed: ", exception);
      }
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify({ message: "POST Succeeded" }),
      };
    case "DELETE":
      const timestamp = event.pathParameters?.timestamp;
      if (!timestamp) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "DELETE failed" }),
        };
      }

      const deleteParams = {
        TableName: tableName,
        Key: {
          userId: { S: userId },
          timestamp: { N: timestamp },
        },
      };
      const delCommand = new DeleteItemCommand(deleteParams);
      await client.send(delCommand);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify({ message: "DELETE Succeeded" }),
      };
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
  }
};

const programTitle = async (
  stationId: string,
  startDateTimeString?: string
): Promise<string> => {
  const startDateTime = getStartDateTime(startDateTimeString);

  // 29時までは当日の扱いとなるため, 5時間減算する
  const startDate = startDateTime.minus({ hours: 5 }).toFormat("yyyyMMdd");
  const { data } = await axios.get(
    `https://radiko.jp/v4/program/station/date/${startDate}/${stationId}.json`
  );

  if (!startDateTimeString) {
    // 放送中番組の開始日時を抽出
    startDateTimeString = data.stations
      .find((station: any) => station.station_id === stationId)
      .programs.program.map((program: any) => program.ft)
      .filter((ft: string) => ft <= startDateTime.toFormat("yyyyMMddHHmmss"))
      .at(-1);
  }

  return data.stations
    .find((station: any) => station.station_id === stationId)
    .programs.program.find((program: any) => program.ft === startDateTimeString)
    .title;
};

const getStartDateTime = (startDateTime?: string): DateTime => {
  if (startDateTime) {
    return DateTime.fromFormat(startDateTime, "yyyyMMddHHmmss", {
      zone: "Asia/Tokyo",
    });
  }
  return DateTime.now().setZone("Asia/Tokyo");
};
