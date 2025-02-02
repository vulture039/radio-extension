import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
// @ts-ignore
import outputs from "../../../amplify_outputs.json";
import axios from "axios";
import type { APIGatewayProxyHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";

const { DateTime } = require("luxon");
const client = generateClient<Schema>();
Amplify.configure(outputs);

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  switch (event.httpMethod) {
    case "GET":
      const { data: items, errors } = await client.models.Program.list({
        userId: userId,
      });

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
        await client.models.Program.create({
          userId: userId,
          timestamp: Date.now(),
          stationId: stationId,
          title: title,
        });
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
      const timestamp = Number(event.pathParameters?.timestamp);
      if (!timestamp) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "DELETE failed" }),
        };
      }

      await client.models.Program.delete({
        userId: userId,
        timestamp: timestamp,
      });

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

const getStartDateTime = (startDateTime?: string): typeof DateTime => {
  if (startDateTime) {
    return DateTime.fromFormat(startDateTime, "yyyyMMddHHmmss", {
      zone: "Asia/Tokyo",
    });
  }
  return DateTime.now().setZone("Asia/Tokyo");
};
