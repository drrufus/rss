import convert from 'xml-js';
import { IChunk } from './types';

export function convertToRssXml(feedId: string, feedName: string, feedLink: string, feedDescription: string, chunks: IChunk[]): string {

    const items = (chunks ?? [])
        .flatMap(chunk => chunk.items)
        .sort((item1, item2) => (item2.isoDate ? (new Date(item2.isoDate)).getTime() : 0) - (item1.isoDate ? (new Date(item1.isoDate)).getTime() : 0));;

    const description = feedDescription;
    const link = feedLink;
    const feedXmlObject = {
        rss: {
            _attributes: {
                version: '2.0',
            },
            channel: {
                title: feedName,
                description,
                link,
                item: items.map(mapItem),
            },   
        }
    };

    const xml = convert.js2xml(feedXmlObject, {
        compact: true,
        ignoreComment: true,
        spaces: 4,
        fullTagEmptyElement: true,
    });

    return xml;

}

function mapItem(_item: any): any {
    const item = { ..._item };
    if (item.enclosure) {
        item.enclosure = {
            _attributes: {
                url: item.enclosure.url,
                length: item.enclosure.length,
                type: item.enclosure.type,
            }
        };
    }
    if (item.categories) {
        item.category = item.categories;
        item.categories = undefined;
    }
    if (item.content) {
        item.description = {
            _cdata: item.content,
        };
        item.content = undefined;
    }
    if (item.title) {
        item.title = {
            _cdata: item.title,
        };
    }
    return item;
}
