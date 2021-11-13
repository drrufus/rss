import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { IFeedDescriptor } from '../types/feed-descriptor';
import { config } from '../config';
import styled from 'styled-components';
import { AppContext } from '../App';
import { Button, Menu, Spin } from 'antd';
import { DesktopOutlined, PlusOutlined } from '@ant-design/icons';
import { NewFeedModal } from './NewFeedModal';
import { resolveIcon } from '../misc/utils';

const { SubMenu } = Menu;

interface IProps {
    onFeedSelected: (feedId: string) => void;
}

export const FeedsList = (props: IProps) => {

    const state = useContext(AppContext);
    const { auth } = state;
    const { onFeedSelected } = props;
    const [feeds, setFeeds] = useState(null as IFeedDescriptor[] | null);
    const [newFeedModalOpen, setNewFeedOpenState] = useState(false);
    const [loading, setLoadingState] = useState(false);

    const updateList = async () => {
        console.log(`Retrieving feeds...`);
        setLoadingState(true);
        const response = await axios.get(`${config.host}/feeds?owner=${auth?.profileObj.email}`);
        setFeeds(response.data.feeds);
        setLoadingState(false);
    };

    useEffect(() => {
        (async () => await updateList())();
    }, [auth]);

    const onSelected = (id: string) => {
        onFeedSelected(id);
    };

    const onNewFeedCreated = async () => {
        setNewFeedOpenState(false);
        await updateList();
    };

    return <>
        <Spin spinning={loading || !feeds}>

            {feeds && <Menu theme="dark" mode="inline">
                <Menu.Item onClick={() => setNewFeedOpenState(true)} icon={<PlusOutlined />} key="new_feed">Create new feed</Menu.Item>
                {feeds.map(feed => <Menu.Item key={feed.id} icon={resolveIcon(feed.icon)} onClick={() => onSelected(feed.id)}>{feed.name}</Menu.Item>)}
            </Menu>}

        </Spin>
        <NewFeedModal open={newFeedModalOpen} onCreated={onNewFeedCreated} onCancel={() => setNewFeedOpenState(false)} />
    </>;

};
