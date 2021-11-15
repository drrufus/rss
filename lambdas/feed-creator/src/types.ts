export interface ICreateFeedRequest {
    name: string;
    icon?: string;
    link: string;
    description: string;
}

export interface IFeed {
    name: string;
    ownerEmail: string;
    createdAt: number;
}
