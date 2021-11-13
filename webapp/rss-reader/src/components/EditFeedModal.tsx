import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { IFeed } from '../types/feed';
import { Modal, List, Button, Input, Divider, Alert, Collapse } from 'antd';
import { isValidHttpUrl } from '../misc/utils';
import { config } from '../config';
import { AppContext } from '../App';

const { Panel } = Collapse;

const RECOMMENDED: {[key: string]: string} = {
    '9GAG: Funny': 'https://9gag.vamourir.fr/feeds/funny/hot.xml',
    '9GAG: Trending': 'https://9gag.vamourir.fr/feeds/default/trending.xml',
    '9GAG: WTF': 'https://9gag.vamourir.fr/feeds/wtf/hot.xml',
    'Techmeme': 'https://www.techmeme.com/feed.xml?x=1',
    'TVRain (aka Dozhd)': 'https://tvrain.ru/export/rss/all.xml',
};
interface IProps {
    open: boolean;
    feed: IFeed;
    onClosed: () => void;
    onSourcesChange: () => Promise<void>;
}

export const EditFeedModal = (props: IProps) => {

    const { open, feed, onClosed, onSourcesChange } = props;

    const context = useContext(AppContext);
    const authorized = !!context.auth?.accessToken;

    const [sourceInput, setSourceInput] = useState('');
    const sourceInputIsValid = isValidHttpUrl(sourceInput) && !feed.sources.includes(sourceInput);

    const [loading, setLoadingState] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        setSourceInput('');
    }, [open]);

    const addSource = async () => {
        setLoadingState(true);
        try {
            await axios.post(
                `${config.host}/feeds/${feed.id}`,
                { sourceUrl: sourceInput },
                { headers: { Authorization: `Bearer ${context.auth!.accessToken}` } }
            );
            await onSourcesChange();
            setErrorMsg(null);
            setLoadingState(false);
            onClosed();
        } catch (err: any) {
            const msg = err.response?.data?.errorMessage ?? 'Unknown error';
            setErrorMsg(msg);
            setLoadingState(false);
        }
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
            <Button onClick={addSource} disabled={!sourceInputIsValid || !authorized} loading={loading}>Add</Button>
        </div>
        {!authorized && <Alert message="You are not authorized" type="error" style={{ margin: '8px 0' }} />}
        {errorMsg && <Alert message={errorMsg} type="error" style={{ margin: '8px 0' }} />}

        <Collapse>
            <Panel header="Recommended sources" key="1">
                {Object.keys(RECOMMENDED).map(key => <Button type="link" onClick={() => setSourceInput(RECOMMENDED[key])} key={key} style={{ display: 'block' }}>{key}</Button>)}
            </Panel>
        </Collapse>

        <Divider />

        <p>Sources ({feed.sources.length}):</p>
        <List
            dataSource={feed.sources}
            renderItem={item => <List.Item
                // actions={[<Button type="link" disabled onClick={() => deleteSource(item)}>Delete</Button>]}
            >
                {item}
            </List.Item>}
        />
    </Modal>;

};
