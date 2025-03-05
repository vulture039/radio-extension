import { defineFunction } from "@aws-amplify/backend";

export const programsApiFunction = defineFunction({
  name: "programs-api-function",
  environment: {
    ENV: process.env.ENV || "default_env",
    REGION: process.env.REGION || "default_region",
    TABLE_NAME: process.env.DYNAMO_DB_TABLE_NAME || "default_table_name",
  },
});
