import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { APIGatewayProxyHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import outputs from "../../../amplify_outputs.json";

import { ref } from "vue";
import { parse, subHours, format } from "date-fns";
import axios from "axios";

Amplify.configure(outputs);

const client = generateClient<Schema>();
const programs = ref<Array<Schema["Program"]["type"]>>([]);

export const handler: APIGatewayProxyHandler = async (event) => {
  switch (event.httpMethod) {
    case "GET":
      const { data: items, errors } = await client.models.Program.list();
      programs.value = items;

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

      const url = JSON.parse(event.body).url;
      const pathParams = url.split("/#!/")[1].split("/");
      const isOnAir = pathParams[0] === "live";
      const stationId = pathParams[1];
      const startDateTime = pathParams[2];

      const title = await client.models.Program.create({
        stationId: stationId,
        title: await programTitle(startDateTime, stationId),
      });

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
          "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify({ message: "POST Succeeded" }),
      };
    case "DELETE":
      console.log("delete");
      console.log(event);
      console.log(event.pathParameters);
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "DELETE failed" }),
        };
      }

      await client.models.Program.delete({ id: id });

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
  startDateTime: string,
  stationId: string
): Promise<string> => {
  const date = parse(startDateTime, "yyyyMMddHHmmss", new Date());
  // 29時までは当日の扱いとなるため, 5時間減算する
  const date_ = subHours(date, 5);
  const startDate = format(date_, "yyyyMMdd");

  const { data } = await axios.get(
    `https://radiko.jp/v4/program/station/date/${startDate}/${stationId}.json`
  );

  const program = data.stations
    .find((station: any) => station.station_id === stationId)
    .programs.program.find((program: any) => program.ft === startDateTime);

  return program.title;
};
