import Parser from 'rss-parser';

export interface IFeed {
    id: string;
    name: string;
    ownerEmail: string;
    sources: string[];
}

export interface ISourceChunk {
    id: string;
    index: number;
    sourceUrl: string;
    content: any[];
}

export type RssParsingResult = { sourceUrl: string, rss: Parser.Output<any> };
