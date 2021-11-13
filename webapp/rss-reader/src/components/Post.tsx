import React from 'react';
import styled from 'styled-components';
import { IPost } from '../types/post';
import { Card as AntCard, Divider } from 'antd';

const { Meta } = AntCard;

interface IProps {
    post: IPost;
}

const CustomContentContainer = styled.div`
    max-width: 100%;
    overflow: hidden;
    text-align: center;
    & img {
        max-width: 100%;
    }
    & video {
        max-width: 100%;
    }
`;

const Card = styled(AntCard)`
    margin: 16px 0;
    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
    overflow: hidden;
`;

export const Post = (props: IProps) => {

    const { content, title, link, isoDate } = props.post;

    return <Card
        title={title ?? '[no title]'}
        extra={link ? <a href={link} target="_blank">open</a> : null}
    >
        {content && <CustomContentContainer dangerouslySetInnerHTML={{ __html: content }}></CustomContentContainer>}
        <Divider style={{ margin: '2px 0 16px' }} />
        <Meta description={isoDate ? (new Date(isoDate)).toLocaleString() : '<unknown>'}></Meta>
    </Card>;

};
