import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { IFeed, ISourceChunk } from './types';
import Parser from 'rss-parser';

declare const console: any; // TODO: fix compiler options

type LambdaEvent = APIGatewayProxyEvent & { sourceUrl?: string };

const feedsTableName = 'rss-feeds-table';
const postsTableName = 'rss-posts-table';

const parser = new Parser();

const CHUNK_SIZE_LIMIT = 300000;

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    const ddb = new DynamoDB.DocumentClient();
    const sourceUrl = event.sourceUrl;

    const feedsResponse = await ddb.scan({ TableName: feedsTableName }).promise();
    const feeds = feedsResponse.Items! as IFeed[];
    const sources = new Set(feeds.flatMap(f => f.sources));

    // clear old data

    const existingChunksResponse = await ddb.scan({ TableName: postsTableName }).promise();
    const existingChunksIds = existingChunksResponse.Items!.map(item => item.id);
    console.log('existing chunks count: ' + existingChunksIds.length);
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

    console.log('sources to refresh:', sources);

    const chunks: ISourceChunk[] = [];

    for (const sourceUrl of Array.from(sources)) {
        const rss = await parser.parseURL(sourceUrl);
        const rssItems = rss.items;
        console.log(`for source "${sourceUrl}" loaded items: ${rssItems.length}`);
        let lengthCounter = 2;
        let chunk: ISourceChunk = {
            id: `${sourceUrl}:0`,
            index: 0,
            sourceUrl: sourceUrl,
            content: [],
        };
        rssItems.forEach(item => {
            const itemLength = JSON.stringify(item).length;
            // console.log(`item size: ${itemLength}`);
            if (itemLength < CHUNK_SIZE_LIMIT) {
                if (lengthCounter + itemLength + 1 < CHUNK_SIZE_LIMIT) {
                    chunk.content.push(item);
                    lengthCounter += itemLength + 1;
                } else {
                    const prevChunk = chunk;
                    chunk = {
                        id: `${sourceUrl}:${prevChunk.index + 1}`,
                        index: prevChunk.index + 1,
                        sourceUrl: prevChunk.sourceUrl,
                        content: [item],
                    };
                    lengthCounter = 2 + itemLength;
                    chunks.push(prevChunk);
                }
            }
        });
        if (!chunks.includes(chunk) && chunk.content.length > 0) {
            chunks.push(chunk);
        }
    }

    console.log('total chunks: ' + chunks.length);
    // chunks.forEach(chunk => console.log('size: ' + JSON.stringify(chunk).length));

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

    return {
        statusCode: 200,
        body: JSON.stringify({
            chunksAdded: chunks.length,
            eventDump: event,               // TODO: tmp stuff
        }),
    };
}