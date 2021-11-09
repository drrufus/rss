import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { IFeedDescriptor } from '../types/feed-descriptor';
import { config } from '../config';
import styled from 'styled-components';
import { AppContext } from '../App';
import { Button, Menu } from 'antd';
import { DesktopOutlined, PlusOutlined } from '@ant-design/icons';
import { NewFeedModal } from './NewFeedModal';

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

    const updateList = async () => {
        console.log(`Retrieving feeds...`);
        const response = await axios.get(`${config.host}/feeds`);
        setFeeds(response.data.feeds);
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
        {feeds && <div>

            <Menu theme="dark" mode="inline">
                <Menu.Item onClick={() => setNewFeedOpenState(true)} icon={<PlusOutlined />}>Create new feed</Menu.Item>
                {feeds.map(feed => <Menu.Item key={feed.id} icon={<DesktopOutlined />} onClick={() => onSelected(feed.id)}>{feed.name}</Menu.Item>)}
            </Menu>

        </div> || <p>loading...</p>}
        <NewFeedModal open={newFeedModalOpen} onCreated={onNewFeedCreated} onCancel={() => setNewFeedOpenState(false)} />
    </>;

};
