import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Program: a
    .model({
      userId: a.id(),
      stationId: a.string(),
      title: a.string(),
    })
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
});
