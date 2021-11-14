import convert from 'xml-js';
import { IChunk } from './types';

export function convertToRssXml(feedId: string, feedName: string, chunks: IChunk[]): string {

    const items = (chunks ?? []).flatMap(chunk => chunk.items);

    const description = 'TODO';
    const link = 'https://google.com';
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
