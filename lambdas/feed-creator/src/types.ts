export interface ICreateFeedRequest {
    name: string;
    icon?: string;
}

export interface IFeed {
    name: string;
    ownerEmail: string;
    createdAt: number;
}
