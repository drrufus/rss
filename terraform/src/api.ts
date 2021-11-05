import { Construct } from "constructs";
import { ApiGatewayDeployment, ApiGatewayIntegration, ApiGatewayIntegrationResponse, ApiGatewayMethod, ApiGatewayMethodResponse, ApiGatewayResource, ApiGatewayRestApi, LambdaPermission } from "../.gen/providers/aws";
import { ICreateApiResult } from "./types/create-api-results";
import { ILambdasCreationResult } from "./types/lambdas-creation-result";

export function createApi(scope: Construct, name: string, lambdas: ILambdasCreationResult): ICreateApiResult {

    const apiName = `${name}-api`;
    const api = new ApiGatewayRestApi(scope, apiName, {
        name: apiName,
        description: '',
    });

    

    // POST /feeds

    const feedsResource = new ApiGatewayResource(scope, `${name}-api-feeds-resource`, {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'feeds',
    });

    const postFeedMethod = new ApiGatewayMethod(scope, `${name}-api-post-feed-method`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
    });

    const postFeedIntegration = new ApiGatewayIntegration(scope, `${name}-post-feed-integration`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: postFeedMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS',
        uri: lambdas.feedCreatorLambdaInvokeArn,
        timeoutMilliseconds: 29000,
        requestTemplates: {
            'application/json': `{
                "postBody" : $input.body
            }`,
        },
    });

    const postFeedReponse = new ApiGatewayMethodResponse(scope, `${name}-post-feed-response`, {
        statusCode: '200',
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: postFeedMethod.httpMethod,
    });

    const postFeedIntegrationResponse = new ApiGatewayIntegrationResponse(scope, `${name}-post-feed-integration-response`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: postFeedMethod.httpMethod,
        statusCode: postFeedReponse.statusCode,
        responseTemplates: {
            'application/json': '\n',
        },
        dependsOn: [
            postFeedIntegration,
        ]
    });



    // GET /feeds

    const getFeedsMethod = new ApiGatewayMethod(scope, `${name}-api-get-feeds-method`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
    });

    const getFeedsIntegration = new ApiGatewayIntegration(scope, `${name}-get-feeds-integration`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: getFeedsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS',
        uri: lambdas.feedViewerLambdaInvokeArn,
        timeoutMilliseconds: 29000,
        requestTemplates: {
            'application/json': '\n',
        },
    });

    const getFeedsResponse = new ApiGatewayMethodResponse(scope, `${name}-get-feeds-response`, {
        statusCode: '200',
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: getFeedsMethod.httpMethod,
    });

    const getFeedsIntegrationResponse = new ApiGatewayIntegrationResponse(scope, `${name}-get-feeds-integration-response`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: getFeedsMethod.httpMethod,
        statusCode: getFeedsResponse.statusCode,
        responseTemplates: {
            'application/json': '\n',
        },
        dependsOn: [
            getFeedsIntegration,
        ],
    });

    // GET /feeds/xxx

    const feedsProxyResource = new ApiGatewayResource(scope, `${name}-api-feeds-proxy-resource`, {
        restApiId: api.id,
        parentId: feedsResource.id,
        pathPart: '{proxy+}',
    });

    const getConcreteFeedMethod = new ApiGatewayMethod(scope, `${name}-api-get-concrete-feed-method`, {
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
    });

    const getConcreteFeedIntegration = new ApiGatewayIntegration(scope, `${name}-get-concrete-feed-integration`, {
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: getConcreteFeedMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdas.feedViewerLambdaInvokeArn,
        timeoutMilliseconds: 29000,
        requestTemplates: {
            'application/json': '\n',
        },
    });

    const getConcreteFeedResponse = new ApiGatewayMethodResponse(scope, `${name}-get-concrete-feed-response`, {
        statusCode: '200',
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: getConcreteFeedMethod.httpMethod,
    });

    const getConcreteFeedIntegrationResponse = new ApiGatewayIntegrationResponse(scope, `${name}-get-concrete-feed-integration-response`, {
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: getConcreteFeedMethod.httpMethod,
        statusCode: getConcreteFeedResponse.statusCode,
        responseTemplates: {
            'application/json': '\n',
        },
        dependsOn: [
            getConcreteFeedIntegration,
        ],
    });





    // POST ???

    const tmpResource = new ApiGatewayResource(scope, `${name}-api-tmp-resource`, {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'tmp',
    });

    const tmpMethod = new ApiGatewayMethod(scope, `${name}-api-tmp-method`, {
        restApiId: api.id,
        resourceId: tmpResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
    });

    const tmpIntegration = new ApiGatewayIntegration(scope, `${name}-tmp-integration`, {
        restApiId: api.id,
        resourceId: tmpResource.id,
        httpMethod: tmpMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS',
        uri: lambdas.sourceAdderLambdaInvokeArn,
        timeoutMilliseconds: 29000,
        requestTemplates: {
            'application/json': `{
                "postBody" : $input.body
            }`,
        },
    });

    const tmpReponse = new ApiGatewayMethodResponse(scope, `${name}-tmp-response`, {
        statusCode: '200',
        restApiId: api.id,
        resourceId: tmpResource.id,
        httpMethod: tmpMethod.httpMethod,
    });

    const tmpIntegrationResponse = new ApiGatewayIntegrationResponse(scope, `${name}-tmp-integration-response`, {
        restApiId: api.id,
        resourceId: tmpResource.id,
        httpMethod: tmpMethod.httpMethod,
        statusCode: tmpReponse.statusCode,
        responseTemplates: {
            'application/json': '\n',
        },
        dependsOn: [
            tmpIntegration,
        ]
    });




    // deployment

    const apiDeployment = new ApiGatewayDeployment(scope, `${name}-api-deployment`, {
        restApiId: api.id,
        stageName: 'dev',
        dependsOn: [
            postFeedIntegration,
            postFeedReponse,
            postFeedIntegrationResponse,
            tmpIntegration,
            tmpReponse,
            tmpIntegrationResponse,
            getFeedsIntegration,
            getFeedsResponse,
            getFeedsIntegrationResponse,
        ],
    });

    // permissions

    const feedCreatorLambdaPermission = new LambdaPermission(scope, `${name}-feed-creator-lambda-api-permission`, {
        statementId: 'AllowAPIGatewayInvoke',
        action: 'lambda:InvokeFunction',
        functionName: lambdas.feedCreatorLambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
    });

    const feedsViewerLambdaPermission = new LambdaPermission(scope, `${name}-feed-viewer-lambda-api-permission`, {
        statementId: 'AllowAPIGatewayInvoke',
        action: 'lambda:InvokeFunction',
        functionName: lambdas.feedViewerLambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
    });

    const sourceAdderLambdaPermission = new LambdaPermission(scope, `${name}-source-adder-lambda-api-permission`, {
        statementId: 'AllowAPIGatewayInvoke',
        action: 'lambda:InvokeFunction',
        functionName: lambdas.sourceAdderLambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
    });

    return {

    };

}
