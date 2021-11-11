import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const ddb = new DynamoDB.DocumentClient();
const sourcesTableName = 'rss-posts-table';
const feedsTableName = 'rss-feeds-table';

const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const urlParam = (event as any).pathParameters?.proxy ?? null;

    if (urlParam == null) {     // get list of feeds

        const ownerEmail = event.queryStringParameters?.owner;

        if (!ownerEmail) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    errorMessage: 'No owner specified',
                }),
            };
        }

        const feedsQueryResponse = await ddb.query({
            TableName: feedsTableName,
            IndexName: 'some-index',
            KeyConditionExpression: 'ownerEmail = :e',
            ExpressionAttributeValues: {
                ':e': ownerEmail,
            },
        }).promise();

        const userFeeds = feedsQueryResponse.Items;

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                feeds: userFeeds,
            }),
        };

    } else {                    // get concrete feed's content

        const feedQueryResponse = await ddb.get({
            TableName: feedsTableName,
            Key: {
                id: urlParam,
            },
        }).promise();
        if (!feedQueryResponse.Item) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({
                    errorMessage: `No feed "${urlParam}" found`,
                }),
            };
        } else {
            const feed = feedQueryResponse.Item!;
            const sourceUrls: string[] = feed.sources;
            const soucesQueryResponse = await ddb.scan({
                TableName: sourcesTableName,
                FilterExpression: 'contains(:list, feedUrl)',
                ExpressionAttributeValues: {
                    ':list': sourceUrls,
                },
            }).promise();
            const chunks = soucesQueryResponse.Items?.map(chunk => ({         // TODO: types
                id: chunk.id,
                sourceUrl: chunk.feedUrl,
                items: JSON.parse(chunk.content),
            }));
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    id: feed.id,
                    feedName: feed.name,
                    ownerEmail: feed.ownerEmail,
                    sources: sourceUrls,
                    chunks,
                }),
            };
        }

    }
}