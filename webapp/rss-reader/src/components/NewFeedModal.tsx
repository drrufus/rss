import React, { useContext, useState } from 'react';
import axios from 'axios';
import { Modal, Input, Alert } from 'antd';
import { config } from '../config';
import { AppContext } from '../App';

interface IProps {
    open: boolean;
    onCreated: () => Promise<void>;
    onCancel: () => void;
}

export const NewFeedModal = (props: IProps) => {

    const { open, onCreated, onCancel } = props;

    const context = useContext(AppContext);
    const authorized = !!context.auth?.accessToken;

    const [nameInput, setNameInput] = useState('');
    const nameIsValid = nameInput.match(/^[a-zA-Z0-9-]{3,}$/);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const create = async () => {
        try {
            await axios.post(
                `${config.host}/feeds`,
                { name: nameInput },
                { headers: { Authorization: `Bearer ${context.auth!.accessToken}` } }
            );
            setErrorMsg(null);
            onCreated();
        } catch (err: any) {
            const msg = err.response?.data?.errorMessage ?? 'Unknown error';
            setErrorMsg(msg);
        }
    };

    return <Modal
        visible={open}
        title="Create new feed"
        onOk={create}
        okButtonProps={{ disabled: !nameIsValid || !authorized }}
        onCancel={onCancel}
    >
        {!authorized && <Alert message="You are not authorized" type="error" style={{ margin: '8px 0' }} />}
        <Input placeholder="Feed name" value={nameInput} onChange={e => setNameInput(e.target.value)} />
        {errorMsg && <Alert message={errorMsg} type="error" style={{ margin: '8px 0' }} />}
    </Modal>;
};
