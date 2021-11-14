import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { IFeed, ISourceChunk, RssParsingResult } from './types';
import Parser from 'rss-parser';
import { sliceToChunks } from './utils';
import { LambdaResponse, LambdaError } from 'rss-common/dist';

type LambdaEvent = APIGatewayProxyEvent & { sourceUrl?: string };

const postsTableName = process.env['POSTS_TABLE_NAME'];
const feedsTableName = process.env['FEEDS_TABLE_NAME'];

const parser = new Parser({
    timeout: 10000,
});

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    if (!postsTableName || !feedsTableName) {
        return new LambdaError('Configuration error: missing FEEDS_TABLE_NAME or/and POSTS_TABLE_NAME parameter')
    }

    const ddb = new DynamoDB.DocumentClient();
    const sourceUrl = event.sourceUrl;

    let sources: string[] | null = sourceUrl ? [sourceUrl] : null;
    let feeds: IFeed[] | null = null;
    if (!sourceUrl) {
        const feedsResponse = await ddb.scan({ TableName: feedsTableName }).promise();
        feeds = feedsResponse.Items! as IFeed[];
        sources = Array.from(new Set(feeds!.flatMap(f => f.sources)));
    }

    /**
     * if sourceUrl parameter has been specified - only chunks of that source must be deleted.
     * otherwise all sources will be updated - so it's necessary to clear all existing chunks.
     */

    const existingChunksResponse = sourceUrl
        ? await ddb.query({
            TableName: postsTableName,
            IndexName: 'feed-url-index',
            KeyConditionExpression: 'feedUrl = :url',
            ExpressionAttributeValues: {
                ':url': sourceUrl,
            },
        }).promise()
        : await ddb.scan({
            TableName: postsTableName,
        }).promise();
    const existingChunksIds = existingChunksResponse.Items!.map(item => item.id);
    const idsBatches: (string[])[] = [];
    existingChunksIds.forEach((id, idx) => {
        if (idx % 25 === 0) {
            idsBatches.push([]);
        }
        idsBatches[idsBatches.length - 1].push(id);
    });
    for (const batch of idsBatches) {
        await ddb.batchWrite({
            RequestItems: {
                [postsTableName]: batch.map(id => ({
                    DeleteRequest: {
                        Key: { id },
                    },
                })),
            }
        }).promise();
    }



    // add new data

    

    // all rss-requests are running in parallel:
    const rssPromises: Promise<RssParsingResult>[] = sources!.map(sourceUrl => {
        return parser.parseURL(sourceUrl).then(rss => ({ sourceUrl, rss }));
    });

    const rssResults = (await Promise.allSettled(rssPromises))
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<RssParsingResult>).value);

    const chunks: ISourceChunk[] = sliceToChunks(rssResults);

    const batches: (ISourceChunk[])[] = [];
    chunks.forEach((chunk, idx) => {
        if (idx % 25 === 0) {
            batches.push([]);
        }
        batches[batches.length - 1].push(chunk);
    });

    for (const batch of batches) {
        await ddb.batchWrite({
            RequestItems: {
                [postsTableName]: [
                    ...batch.map((chunk) => ({
                        PutRequest: {
                            Item: {
                                id: chunk.id,
                                feedUrl: chunk.sourceUrl,
                                content: JSON.stringify(chunk.content),
                            },
                        },
                    })),
                ],
            }
        }).promise();
    }

    return new LambdaResponse({
        chunksAdded: chunks.length,
    });

}
