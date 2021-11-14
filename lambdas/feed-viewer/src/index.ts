import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { LambdaResponse, LambdaError, LambdaXmlResponse } from 'rss-common/dist';
import { IChunk } from './types';
import { convertToRssXml } from './utils';

const ddb = new DynamoDB.DocumentClient();
const postsTableName = process.env['POSTS_TABLE_NAME'];
const feedsTableName = process.env['FEEDS_TABLE_NAME'];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    if (!postsTableName || !feedsTableName) {
        return new LambdaError('Configuration error: missing FEEDS_TABLE_NAME or/and POSTS_TABLE_NAME parameter')
    }

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

        let format = event.queryStringParameters?.format || 'json';
        if (format !== 'json' && format !== 'xml') {
            return new LambdaError('Incorrect format: ' + format, 400);
        }

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
                TableName: postsTableName,
                FilterExpression: 'contains(:list, feedUrl)',
                ExpressionAttributeValues: {
                    ':list': sourceUrls,
                },
            }).promise();
            const chunks = (soucesQueryResponse.Items ?? [])
                .map(chunk => ({
                    id: chunk.id,
                    sourceUrl: chunk.feedUrl,
                    items: JSON.parse(chunk.content)
                } as IChunk))

            if (format === 'json') {
                return new LambdaResponse({
                    id: feed.id,
                    feedName: feed.name,
                    ownerEmail: feed.ownerEmail,
                    sources: sourceUrls,
                    chunks,
                });
            } else {
                return new LambdaXmlResponse(convertToRssXml(feed.id, feed.name, chunks));
            }

        }

    }
}