import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../App';
import axios from 'axios';
import { config } from '../config';
import { IPost } from '../types/post';
import { Post } from './Post';
import { IFeed } from '../types/feed';
import { Pagination, Spin, Result, Button } from 'antd';
import styled from 'styled-components';
import { SmileOutlined, EditOutlined } from '@ant-design/icons';
import { EditFeedModal } from './EditFeedModal';

interface IProps {

}

interface IPaginationState {
    page: number;
    pageSize: number;
}

const NoContentPlaceholder = styled.div`

`;

const ContentHeaderContainer = styled.div`
    margin-top: 12px;
    display: flex;
    flex-flow: row;
    justify-content: space-between;
    padding: 0 16px;
`;

export const FeedContent = (props: IProps) => {

    const state = useContext(AppContext);
    const { auth, selectedFeedId } = state;

    const containerRef = useRef(null);

    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 10,
    } as IPaginationState);
    const [loading, setLoadingState] = useState(false);
    const [editModalOpen, setEditModalOpenState] = useState(false);

    const [feed, setFeed] = useState(null as IFeed | null);

    const postsCount = feed?.chunks.reduce((acc, curr) => acc + curr.items.length, 0);
    const pages: (IPost[])[] = [];
    feed?.chunks
        .flatMap(s => s.items)
        ?.sort((item1, item2) => (item2.isoDate ? (new Date(item2.isoDate)).getTime() : 0) - (item1.isoDate ? (new Date(item1.isoDate)).getTime() : 0))
        .forEach((post, idx) => {
        if (idx % pagination.pageSize === 0) {
            pages.push([]);
        }
        pages[pages.length - 1].push(post);
    });

    const updateFeed = async () => {
        setLoadingState(true);
        const feedResponse = await axios.get(`${config.host}/feeds/${selectedFeedId}`);
        const feed: IFeed = feedResponse.data;
        setFeed(feed);
        setLoadingState(false);
    };

    useEffect(() => {
        if (selectedFeedId != null) {
            (async () => await updateFeed())();
            setPagination(_pagination => ({
                ..._pagination,
                page: 0,
            }));
        }
    }, [selectedFeedId]);

    const onPageSelected = (page: number) => {
        setPagination(_pagination => ({
            ..._pagination,
            page: page - 1,
        }));
        const container: Element = containerRef.current!
        container.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    const onPageSizeChanged = (currentPage: number, size: number) => {
        setPagination(_pagination => ({
            ..._pagination,
            page: 0,
            pageSize: size,
        }));
        console.log('set');
        console.log(pagination);
    };

    if (loading) {
        return <Spin tip="Loading..." spinning={true} className="spinner-container"></Spin>;
    } else if (feed) {
        return <div ref={containerRef}>
            <ContentHeaderContainer>
                <h2>Feed "{feed!.feedName}"</h2>
                <Button type="primary" onClick={() => setEditModalOpenState(true)} icon={<EditOutlined />}>Edit feed</Button>
            </ContentHeaderContainer>
            <EditFeedModal feed={feed!} open={editModalOpen} onClosed={() => setEditModalOpenState(false)} onSourcesChange={updateFeed} />
            {
                pages.length > 0 && <>
                    {pages[pagination.page].map((post, idx) => <Post post={post} key={idx} />)}
                    <div style={{ margin: 'auto', width: 'fit-content', marginBottom: '16px' }}>
                        <Pagination
                            current={pagination.page + 1}
                            defaultCurrent={1}
                            pageSize={pagination.pageSize}
                            defaultPageSize={10}
                            total={postsCount}
                            onChange={onPageSelected}
                            onShowSizeChange={onPageSizeChanged}
                        />
                    </div>
                </> || <NoContentPlaceholder>
                    <Result icon={<SmileOutlined />} title="Nothing to show here" />
                </NoContentPlaceholder>
            }
        </div>;
    } else {
        return <NoContentPlaceholder>
            <Result icon={<SmileOutlined />} title="Choose something pls" />
        </NoContentPlaceholder>;
    }
};
