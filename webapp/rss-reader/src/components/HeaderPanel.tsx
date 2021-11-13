import React, { useContext } from 'react';
import { Layout, Button } from 'antd';
import { LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { AppContext } from '../App';

const Header = Layout.Header;

export const HeaderPanel = () => {

    const context = useContext(AppContext);
    const { auth, logout } = context;
    const user = auth?.profileObj.name;

    return <Header style={{ padding: 0, display: 'flex', flexFlow: 'row-reverse', alignItems: 'center' }}>
        {
            user
                ? <Button type="link" icon={<LogoutOutlined />} onClick={logout}>Log out ({user})</Button>
                : <Button type="link" icon={<LoginOutlined />}>Log in</Button>
        }

    </Header>;

};
