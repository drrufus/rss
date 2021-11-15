import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Input, Alert, Radio, Form } from 'antd';
import { config } from '../config';
import { AppContext } from '../App';
import { isValidHttpUrl, resolveIcon } from '../misc/utils';

interface IProps {
    open: boolean;
    onCreated: () => Promise<void>;
    onCancel: () => void;
}

const ICONS = ['comment', 'apple', 'home', 'android', 'coffee', 'heart', 'thunder'];

export const NewFeedModal = (props: IProps) => {

    const { open, onCreated, onCancel } = props;

    const context = useContext(AppContext);
    const authorized = !!context.auth?.accessToken;

    const [nameInput, setNameInput] = useState('');
    const nameIsValid = nameInput.match(/^[a-zA-Z0-9-]{3,20}$/);

    const [descriptionInput, setDescriptionInput] = useState('');
    const descriptionIsValid = descriptionInput.length > 0;

    const [linkInput, setLinkInput] = useState('');
    const linkIsValid = isValidHttpUrl(linkInput);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [loading, setLoadingState] = useState(false);

    useEffect(() => {
        setSelectedIcon(ICONS[0]);
        setNameInput('');
        setDescriptionInput('');
        setLinkInput('');
    }, [open]);

    const create = async () => {
        setLoadingState(true);
        try {
            await axios.post(
                `${config.host}/feeds`,
                {
                    name: nameInput,
                    icon: selectedIcon,
                    description: descriptionInput,
                    link: linkInput,
                },
                { headers: { Authorization: `Bearer ${context.auth!.accessToken}` } }
            );
            setErrorMsg(null);
            onCreated();
        } catch (err: any) {
            const msg = err.response?.data?.errorMessage ?? 'Unknown error';
            setErrorMsg(msg);
        }
        setLoadingState(false);
    };

    return <Modal
        visible={open}
        title="Create new feed"
        onOk={create}
        okButtonProps={{ disabled: !nameIsValid || !authorized || !descriptionIsValid || !linkIsValid, loading }}
        onCancel={onCancel}
    >
        {!authorized && <Alert message="You are not authorized" type="error" style={{ margin: '8px 0' }} />}

        <Form>
            <Form.Item
                validateStatus={nameInput === '' || nameIsValid ? 'success' : 'error'}
                help="Name must contain only latin letters and digits and be 3-20 characters long"
            >
                <Input
                    placeholder="Feed name"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    maxLength={20}
                />
            </Form.Item>

            <Form.Item validateStatus={descriptionIsValid ? 'success' : 'error'}>
                <Input
                    placeholder="Description"
                    value={descriptionInput}
                    onChange={e => setDescriptionInput(e.target.value)}
                    maxLength={60}
                />
            </Form.Item>

            <Form.Item
                validateStatus={linkIsValid ? 'success' : 'error'}
                help="A link associated with this new feed. Don't confuse it with an actual RSS-source URL, you can set it up later."
            >
                <Input
                    placeholder="Link"
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                />
            </Form.Item>

            <p style={{ marginTop: '16px' }}>Feed's icon:</p>
            <Radio.Group value={selectedIcon} onChange={e => setSelectedIcon(e.target.value)} buttonStyle="solid">
                {ICONS.map(icon => <Radio.Button value={icon} key={icon}>{resolveIcon(icon)}</Radio.Button>)}
            </Radio.Group>
        </Form>

        {errorMsg && <Alert message={errorMsg} type="error" style={{ margin: '8px 0' }} />}
    </Modal>;
};
