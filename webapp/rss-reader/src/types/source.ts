import Parser from 'rss-parser';

export interface ISource {
    feedUrl: string;
    rss: Parser.Output<any>;
}
