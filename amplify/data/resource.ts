import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Program: a
    .model({
      userId: a.id().required(),
      timestamp: a.timestamp().required(),
      stationId: a.string(),
      title: a.string(),
    })
    .identifier(["userId", "timestamp"])
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
