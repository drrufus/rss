import { IPostsChunk } from "./posts-chunk";

export interface IFeed {
    id: string;
    feedName: string;
    ownerEmail: string;
    sources: string[];
    chunks: IPostsChunk[];
}
