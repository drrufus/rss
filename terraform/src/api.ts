import { Construct } from "constructs";
import { ApiGatewayDeployment, ApiGatewayIntegration, ApiGatewayIntegrationResponse, ApiGatewayMethod, ApiGatewayMethodResponse, ApiGatewayResource, ApiGatewayRestApi, LambdaPermission, ApiGatewayAuthorizer } from "../.gen/providers/aws";
import { ICreateApiResult } from "./types/create-api-results";
import { ILambdasCreationResult } from "./types/lambdas-creation-result";
import { ApigatewayCors } from "../.gen/modules/mewa/aws/apigateway-cors";
import { IUiCreationResults } from "./types/ui-creation-results";
import { TerraformOutput } from "cdktf";
// import { ApiGatewayEnableCors } from "../.gen/modules/squidfunk/aws/api-gateway-enable-cors";

export function createApi(scope: Construct, name: string, lambdas: ILambdasCreationResult, ui: IUiCreationResults): ICreateApiResult {

    const apiName = `${name}-api`;
    const api = new ApiGatewayRestApi(scope, apiName, {
        name: apiName,
        description: '',
    });


    // authorizer

    const authorizer = new ApiGatewayAuthorizer(scope, `${name}-gw-google-authorizer`, {
        name: `${name}-gw-google-authorizer`,
        restApiId: api.id,
        authorizerUri: lambdas.authorizerLambdaInvokeArn,
        identitySource: 'method.request.header.Authorization',
    });
    

    // POST /feeds

    const apiRootResource = new ApiGatewayResource(scope, `${name}-api-root-resource`, {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'api',
    });

    const feedsResource = new ApiGatewayResource(scope, `${name}-api-feeds-resource`, {
        restApiId: api.id,
        parentId: apiRootResource.id,
        pathPart: 'feeds',
    });

    const postFeedMethod = new ApiGatewayMethod(scope, `${name}-api-post-feed-method`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: 'POST',
        authorization: 'CUSTOM',
        authorizerId: authorizer.id,
    });

    const postFeedIntegration = new ApiGatewayIntegration(scope, `${name}-post-feed-integration`, {
        restApiId: api.id,
        resourceId: feedsResource.id,
        httpMethod: postFeedMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdas.feedCreatorLambdaInvokeArn,
        timeoutMilliseconds: 29000,
        requestTemplates: {
            'application/json': `{}`,
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
        type: 'AWS_PROXY',
        uri: lambdas.feedViewerLambdaInvokeArn,
        timeoutMilliseconds: 29000,
        requestTemplates: {
            'application/json': '{}',
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



    // POST /feeds/xxx

    const addSourceMethod = new ApiGatewayMethod(scope, `${name}-api-add-source-method`, {
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: 'POST',
        authorization: 'CUSTOM',
        authorizerId: authorizer.id,
    });

    const addSourceIntegration = new ApiGatewayIntegration(scope, `${name}-add-source-integration`, {
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: addSourceMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdas.sourceAdderLambdaInvokeArn,
        timeoutMilliseconds: 29000,
    });

    const addSourceReponse = new ApiGatewayMethodResponse(scope, `${name}-add-source-response`, {
        statusCode: '200',
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: addSourceMethod.httpMethod,
    });

    const addSourceIntegrationResponse = new ApiGatewayIntegrationResponse(scope, `${name}-add-source-integration-response`, {
        restApiId: api.id,
        resourceId: feedsProxyResource.id,
        httpMethod: addSourceMethod.httpMethod,
        statusCode: addSourceReponse.statusCode,
        responseTemplates: {
            'application/json': '\n',
        },
        dependsOn: [
            addSourceIntegration,
        ]
    });



    new ApigatewayCors(scope, `${name}-api-feeds-cors-config`, {
        api: api.id,
        resource: feedsResource.id,
        methods: [
            getFeedsMethod.httpMethod,
            postFeedMethod.httpMethod,
        ],
        // origin: '*',
    });
    new ApigatewayCors(scope, `${name}-api-feeds-cors-config-02`, {
        api: api.id,
        resource: feedsProxyResource.id,
        methods: [
            getConcreteFeedMethod.httpMethod,
            addSourceMethod.httpMethod,
        ],
        // origin: '*',
    });



    // proxy for the UI

    const uiResource = new ApiGatewayResource(scope, `${name}-api-ui-resource` , {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'ui',
    });

    const uiMethod = new ApiGatewayMethod(scope, `${name}-api-ui-method`, {
        restApiId: api.id,
        resourceId: uiResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
    });

    const uiIntegration = new ApiGatewayIntegration(scope, `${name}-ui-integration`, {
        restApiId: api.id,
        resourceId: uiResource.id,
        httpMethod: uiMethod.httpMethod,
        type: 'HTTP_PROXY',
        integrationHttpMethod: 'GET',
        uri: 'http://' + ui.websiteUrl + '/index.html',
    });

    const uiProxyResource = new ApiGatewayResource(scope, `${name}-api-ui-proxy-resource`, {
        restApiId: api.id,
        parentId: uiResource.id,
        pathPart: '{proxy+}',
    });

    const uiProxyMethod = new ApiGatewayMethod(scope, `${name}-api-ui-proxy-method`, {
        restApiId: api.id,
        resourceId: uiProxyResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
        requestParameters: {
            'method.request.path.proxy': true,
        }
    });

    const uiProxyIntegration = new ApiGatewayIntegration(scope, `${name}-ui-proxy-integration`, {
        restApiId: api.id,
        resourceId: uiProxyResource.id,
        httpMethod: uiProxyMethod.httpMethod,
        type: 'HTTP_PROXY',
        integrationHttpMethod: 'GET',
        uri: 'http://' + ui.websiteUrl + '/{proxy}',
        requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        }
    });


    // deployment

    const apiDeployment = new ApiGatewayDeployment(scope, `${name}-api-deployment`, {
        restApiId: api.id,
        stageName: 'dev',
        dependsOn: [
            postFeedIntegration,
            postFeedReponse,
            postFeedIntegrationResponse,
            addSourceIntegration,
            addSourceReponse,
            addSourceIntegrationResponse,
            getFeedsIntegration,
            getFeedsResponse,
            getFeedsIntegrationResponse,
            // uiProxyIntegration,
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

    const authorizerLambdaPermission = new LambdaPermission(scope, `${name}-authorizer-lambda-api-permission`, {
        statementId: 'AllowAPIGatewayInvoke',
        action: 'lambda:InvokeFunction',
        functionName: lambdas.authorizerLambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
    });

    new TerraformOutput(scope, `${name}-api-url`, {
        value: apiDeployment.invokeUrl,
    });

    return {

    };

}
