import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

import { programsApiFunction } from "./functions/programs-api-function/resource";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  programsApiFunction,
});

// create a new API stack
const apiStack = backend.createStack("api-stack");

// create a new REST API
const programsApi = new RestApi(apiStack, "RestApi", {
  restApiName: "programsApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.programsApiFunction.resources.lambda
);

// create a new resource path with IAM authorization
const programsPath = programsApi.root.addResource("programs", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

programsPath.addResource("{id}").addMethod("DELETE", lambdaIntegration);

// add methods you would like to create to the resource path
programsPath.addMethod("GET", lambdaIntegration);
programsPath.addMethod("POST", lambdaIntegration);

// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = programsApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${programsApi.arnForExecuteApi("*", "/programs", "dev")}`,
        `${programsApi.arnForExecuteApi("*", "/programs/*", "dev")}`,
        `${programsApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [programsApi.restApiName]: {
        endpoint: programsApi.url,
        region: Stack.of(programsApi).region,
        apiName: programsApi.restApiName,
      },
    },
  },
});
