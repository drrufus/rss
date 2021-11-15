import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../App';
import axios from 'axios';
import { config } from '../config';
import { IPost } from '../types/post';
import { Post } from './Post';
import { IFeed } from '../types/feed';
import { Pagination, Spin, Result, Button as AntButton, Popover, Input, message } from 'antd';
import styled from 'styled-components';
import { SmileOutlined, PlusCircleOutlined, RedoOutlined, FrownOutlined, CopyOutlined } from '@ant-design/icons';
import { EditFeedModal } from './EditFeedModal';

interface IPaginationState {
    page: number;
    pageSize: number;
}

const Button = styled(AntButton)`
    margin: 2px;
    box-sizing: border-box;
    @media only screen and (max-width: 748px) {
        span:last-child {
            display: none;
        }
    }
`;

const ContentHeaderContainer = styled.div`
    margin-top: 12px;
    display: flex;
    flex-flow: row;
    justify-content: space-between;
    padding: 0 16px;
`;

export const FeedContent = () => {

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
    const [errorMsg, setErrorMsg] = useState<string | null>(null);


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
        setErrorMsg(null);
        try {
            const feedResponse = await axios.get(`${config.host}/feeds/${selectedFeedId}`);
            const feed: IFeed = feedResponse.data;
            setFeed(feed);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.errorMessage ?? 'Unknown error');
        }
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
    };

    const feedXmlUrl = `${window.location.origin}${config.host}/feeds/${selectedFeedId}?format=xml`;

    const copyUrl = () => {
        console.log(`xml feed url: ${feedXmlUrl}`);
        navigator.clipboard.writeText(feedXmlUrl).then(function () {
            message.success('URL was copied to your clipboard', 5);
        }, function (_) {
            message.error('Ooops. We can not copy the URL to your clipboard, please do it manually', 10);
        });
    };

    const copyButtonPopoverContent = <>
        <Input value={feedXmlUrl} readOnly={true} style={{ width: '250px' }} />
    </>;

    if (loading) {
        return <Spin tip="Loading..." spinning={true} className="spinner-container"></Spin>;
    } else if (feed) {
        return <div ref={containerRef}>
            <ContentHeaderContainer>
                <h2>Feed "{feed!.feedName}"</h2>
                <div>
                    <Popover content={copyButtonPopoverContent} title="Feed URL:">
                        <Button type="primary" onClick={copyUrl} icon={<CopyOutlined />}>Copy RSS URL</Button>
                    </Popover>
                    <Button type="primary" onClick={updateFeed} icon={<RedoOutlined />}>Refresh</Button>
                    <Button type="primary" onClick={() => setEditModalOpenState(true)} icon={<PlusCircleOutlined />}>Add sources</Button>
                </div>
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
                </> || <div>
                    <Result icon={<SmileOutlined />} title="Nothing to show here" />
                </div>
            }
        </div>;
    } else if (errorMsg) {
        return <Result
            icon={<FrownOutlined style={{ color: '#ff928a' }} />}
            title={`Unable to get this feed: ${errorMsg}`}
        />;
    } else {
        return <Result
            icon={<SmileOutlined />}
            title="Choose something pls"
        />;
    }
};
