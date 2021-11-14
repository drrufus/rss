import { ISourceChunk, RssParsingResult } from './types';

const CHUNK_SIZE_LIMIT = 300000;

/**
 * dynamodb has some limitations for an item size. that's why it's not possible to store a whole feed
 * in a single dynamodb-item. so, there is some code to slice data to chunks
 */
export function sliceToChunks(rssResults: RssParsingResult[]): ISourceChunk[] {
    const chunks: ISourceChunk[] = [];
    for (const result of rssResults) {
        const { rss, sourceUrl } = result;
        const rssItems = rss.items;

        let lengthCounter = 2;
        let chunk: ISourceChunk = {
            id: `${sourceUrl}:0`,
            index: 0,
            sourceUrl: sourceUrl,
            content: [],
        };
        rssItems.forEach(item => {
            const itemLength = JSON.stringify(item).length;
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
    return chunks;
}
