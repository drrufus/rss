import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, Lambda } from 'aws-sdk';
import { IAddSourceRequest } from './types';

const feedsTableName = 'rss-feeds-table';
const ddb = new DynamoDB.DocumentClient();
const lambda = new Lambda();

interface IPayload {
    sourceUrl?: string;
}

const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult | { errorMessage?: string }> => {

    // const ownerEmail = 'test@domain.com';

    const feedId = event.pathParameters?.proxy ?? '';
    const payload: IPayload = JSON.parse(event.body!) ?? {};
    const { sourceUrl } = payload;

    if (!feedId || !sourceUrl) {
        return {
            statusCode: 400,
            errorMessage: 'Invalid input',
        };
    }

    const refresherLambdaName = process.env['REFRESHER_LAMBDA_NAME'];
    if (!refresherLambdaName) {
        return {
            statusCode: 500,
            errorMessage: 'Configuration error: refresher lambda name is not specified',
        };
    }

    try {
        const res = await ddb.update(
            {
                TableName: feedsTableName,
                Key: {
                    'id': feedId,
                },
                UpdateExpression: 'SET sources = list_append(sources, :l)',
                ConditionExpression: 'not contains (sources, :i)',
                ExpressionAttributeValues: {
                    ':i': sourceUrl,
                    ':l': [sourceUrl]
                }
            }
        ).promise();

        const lambdaCallReponse = await lambda.invoke({
            FunctionName: refresherLambdaName,
            InvocationType: 'RequestResponse',
            LogType: 'Tail',
            Payload: JSON.stringify({
                sourceUrl,
            }),
        }).promise();
        
        if (lambdaCallReponse.StatusCode !== 200) {
            return {
                statusCode: 500,
                errorMessage: 'Refresher-Lambda returned code ' + lambdaCallReponse.StatusCode,
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                feedId,
                sourceUrl,
                lambdaResponse: lambdaCallReponse.Payload,  // TODO: tmp stuff
            }),
        };
    } catch (err: any) {
        if (err.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 400,
                errorMessage: 'Some condition failed',
            };
        } else {
            return {
                statusCode: 500,
                errorMessage: `Update error (${JSON.stringify(err)})`,
            };
        }
    }

}
