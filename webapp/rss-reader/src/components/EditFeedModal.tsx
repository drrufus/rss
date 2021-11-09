import React, { useState } from 'react';
import axios from 'axios';
import { IFeed } from '../types/feed';
import { Modal, List, Button, Input, Divider } from 'antd';
import { isValidHttpUrl } from '../misc/utils';
import { config } from '../config';

interface IProps {
    open: boolean;
    feed: IFeed;
    onClosed: () => void;
    onSourcesChange: () => Promise<void>;
}

export const EditFeedModal = (props: IProps) => {

    const { open, feed, onClosed, onSourcesChange } = props;

    const [sourceInput, setSourceInput] = useState('');
    const sourceInputIsValid = isValidHttpUrl(sourceInput) && !feed.sources.includes(sourceInput);

    const [loading, setLoadingState] = useState(false);

    const addSource = async () => {
        setLoadingState(true);
        await axios.post(`${config.host}/feeds/${feed.id}`, { sourceUrl: sourceInput });
        await onSourcesChange();
        setLoadingState(false);
    };

    const deleteSource = async (sourceUrl: string) => {
        // TODO
        console.log('deleting ' + sourceUrl);
    };

    return <Modal
        visible={open}
        onOk={onClosed}
        onCancel={onClosed}
        title={`Edit feed "${feed.feedName}"`}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Close"
    >
        <p>Add new source:</p>
        <div style={{ display: 'flex', flexFlow: 'row nowrap', gap: '10px', marginBottom: '12px' }}>
            <Input placeholder="RSS url" value={sourceInput} onChange={(e) => setSourceInput(e.target.value)} style={{ width: 'auto', flex: '1' }} />
            <Button onClick={addSource} disabled={!sourceInputIsValid} loading={loading}>Add</Button>
        </div>

        <Divider />

        <p>Sources ({feed.sources.length}):</p>
        <List
            dataSource={feed.sources}
            renderItem={item => <List.Item
                actions={[<Button type="link" disabled onClick={() => deleteSource(item)}>Delete</Button>]}
            >
                {item}
            </List.Item>}
        />
    </Modal>;

};
