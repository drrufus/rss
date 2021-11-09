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
