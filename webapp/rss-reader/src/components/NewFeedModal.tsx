import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Input } from 'antd';
import { config } from '../config';

interface IProps {
    open: boolean;
    onCreated: () => Promise<void>;
    onCancel: () => void;
}

export const NewFeedModal = (props: IProps) => {

    const { open, onCreated, onCancel } = props;

    const [nameInput, setNameInput] = useState('');
    const nameIsValid = nameInput.match(/^[a-zA-Z0-9-]{3,}$/);

    const create = async () => {
        await axios.post(`${config.host}/feeds`, { name: nameInput });
        onCreated();
    };

    return <Modal
        visible={open}
        title="Create new feed"
        onOk={create}
        okButtonProps={{ disabled: !nameIsValid }}
        onCancel={onCancel}
    >
        <Input placeholder="Feed name" value={nameInput} onChange={e => setNameInput(e.target.value)} />
    </Modal>;
};
