import { IPost } from "./post";

export interface IPostsChunk {
    id: string;
    sourceUrl: string;
    items: IPost[];
}
