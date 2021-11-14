import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, Lambda } from 'aws-sdk';
import { IPayload } from './types';
import { LambdaResponse, LambdaError } from 'rss-common/dist';

const feedsTableName = 'rss-feeds-table';
const ddb = new DynamoDB.DocumentClient();
const lambda = new Lambda();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const feedId = event.pathParameters?.proxy ?? '';
    const payload: IPayload = JSON.parse(event.body!) ?? {};
    const { sourceUrl } = payload;

    const ownerEmail = event.requestContext.authorizer!.email;
    const ownerId = event.requestContext.authorizer!.user_id;

    if (!ownerEmail || !ownerId) {
        return new LambdaError('Missing authorizer data', 500);
    }

    if (!feedId.startsWith(ownerEmail.match(/^[^@]+/)![0])) {
        return new LambdaError('An attempt to modify feed of other user', 403);
    }

    if (!feedId || !sourceUrl) {
        return new LambdaError('Invalid input', 400);
    }

    const refresherLambdaName = process.env['REFRESHER_LAMBDA_NAME'];
    if (!refresherLambdaName) {
        return new LambdaError('Configuration error: refresher lambda name is not specified', 500);
    }

    /**
     * on the first step it will call the refresher-lambda. it will try to download RSS data from this source,
     * so a new source's url will be stored in the database only if it's actually valid and contains some data.
     */
    try {
        const lambdaCallReponse = await lambda.invoke({
            FunctionName: refresherLambdaName,
            InvocationType: 'RequestResponse',
            LogType: 'Tail',
            Payload: JSON.stringify({
                sourceUrl,
            }),
        }).promise();

        if (lambdaCallReponse.StatusCode !== 200 || lambdaCallReponse.FunctionError) {
            return new LambdaError(`An error has been occurred while communicating with Refresher-lambda`, 500);
        } else {
            const payload = JSON.parse(lambdaCallReponse.Payload?.toString() ?? '{}');
            const body = JSON.parse(payload.body ?? '{}');
            if (body.chunksAdded === 0) {
                return new LambdaError(`No RSS data found on ${sourceUrl}`, 400);
            }
        }
    } catch (err: any) {
        return new LambdaError('Unknown lambda call error: ' + JSON.stringify(err), 500);
    }

    /**
     * at this point we're sure that this source is valid and RSS data is already downloaded and stored,
     * so a url is being added to a feed.
     */
    try {
        await ddb.update(
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
    } catch (err: any) {
        switch (err.code) {
            case 'ValidationException': {
                return new LambdaError('An attempt to modify feed that doesn\'t exist', 400);
            }
            case 'ConditionalCheckFailedException': {
                return new LambdaError('Some condition failed', 400);
            }
            default: {
                return new LambdaError(`Update error (${JSON.stringify(err)})`, 500);
            }
        }
    }

    return new LambdaResponse({
        feedId,
        sourceUrl,
    });

}
