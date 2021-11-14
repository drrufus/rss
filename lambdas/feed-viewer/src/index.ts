import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { LambdaResponse, LambdaError } from 'rss-common/dist';

const ddb = new DynamoDB.DocumentClient();
const sourcesTableName = 'rss-posts-table';
const feedsTableName = 'rss-feeds-table';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const urlParam = (event as any).pathParameters?.proxy ?? null;

    if (urlParam == null) {     // get list of feeds

        const ownerEmail = event.queryStringParameters?.owner;

        if (!ownerEmail) {
            return new LambdaError('No owner specified', 400);
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

        return new LambdaResponse({
            feeds: userFeeds,
        });

    } else {                    // get concrete feed's content

        const feedQueryResponse = await ddb.get({
            TableName: feedsTableName,
            Key: {
                id: urlParam,
            },
        }).promise();
        if (!feedQueryResponse.Item) {
            return new LambdaError(`No feed "${urlParam}" found`, 404);
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
            return new LambdaResponse({
                id: feed.id,
                feedName: feed.name,
                ownerEmail: feed.ownerEmail,
                sources: sourceUrls,
                chunks,
            });
        }

    }
}