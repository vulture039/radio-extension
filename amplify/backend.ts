import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

import { programsApiFunction } from "./functions/programs-api-function/resource";
import { schedulesApiFunction } from "./functions/schedules-api-function/resource";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  programsApiFunction,
  schedulesApiFunction,
});

// create a new API stack
const apiStack = backend.createStack("api-stack");

// create a new REST API
const radioExtensionApi = new RestApi(apiStack, "RestApi", {
  restApiName: "radioExtensionApi",
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

const schedulesLambdaIntegration = new LambdaIntegration(
  backend.schedulesApiFunction.resources.lambda
);

// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with COGNITO authorization
const programsPath = radioExtensionApi.root.addResource("programs", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});

programsPath.addResource("{id}").addMethod("DELETE", lambdaIntegration);

// add methods you would like to create to the resource path
programsPath.addMethod("GET", lambdaIntegration);
programsPath.addMethod("POST", lambdaIntegration);

// create a new resource path with Cognito authorization
const booksPath = radioExtensionApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new resource path with COGNITO authorization
const schedulesPath = radioExtensionApi.root.addResource("schedules", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});

// add methods you would like to create to the resource path
schedulesPath
  .addResource("{stationId}")
  .addResource("{title}")
  .addMethod("GET", schedulesLambdaIntegration);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [radioExtensionApi.restApiName]: {
        endpoint: radioExtensionApi.url,
        region: Stack.of(radioExtensionApi).region,
        apiName: radioExtensionApi.restApiName,
      },
    },
  },
});
