import React, { useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { IAppState } from './types/app-state';
import styled from 'styled-components';
import { FeedsList } from './components/FeedsList';
import { FeedContent } from './components/FeedContent';
import { Layout } from 'antd';
import { HeaderPanel } from './components/HeaderPanel';
import { GoogleLoginResponse } from 'react-google-login';
import { FireOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, Location } from 'react-router-dom';

const { Content, Sider } = Layout;

const Logo = styled.h1.attrs(props => ({ collapsed: (props as any).collapsed }))`
    color: whitesmoke;
    font-weight: 600;
    display: block;
    height: 64px;
    line-height: 64px;
    box-sizing: border-box;
    text-align: center;
    font-size: ${props => (props.collapsed ? '18px' : '32px')};
    transition: font-size .1s linear;
`;

interface IState {
    auth: GoogleLoginResponse | null;
    selectedFeedId: string | null;
}

export const AppContext = React.createContext<IAppState>({
    auth: null,
    selectedFeedId: null,
    logout: () => {},
});

function App() {

    const location = useLocation();
    const feedParam = getFeedIdFromLocation(location);
    const navigate = useNavigate();

    const [state, setState] = useState<IState>({
        auth: null,
        selectedFeedId: feedParam,
    });
    const [siderCollapsed, setSiderCollapseState] = useState(false);
    
    useEffect(() => {
        if (state.selectedFeedId && state.selectedFeedId !== feedParam) {
            navigate(`./?feed=${state.selectedFeedId}`);
        }
    }, [state.selectedFeedId]);

    const logout = () => {
        localStorage.removeItem('rss-cached-auth');
        setState(_state => ({ ..._state, auth: null }));
    };

    return <AppContext.Provider value={{ ...state, logout }}>

        <Layout style={{ height: '100vh' }}>
            <Sider collapsible collapsed={siderCollapsed} onCollapse={setSiderCollapseState}>
                <Logo collapsed={siderCollapsed}><FireOutlined /> RSS</Logo>
                <FeedsList onFeedSelected={(selectedFeedId) => setState(_state => ({ ...state, selectedFeedId }))} />
            </Sider>
            <Layout>
                <HeaderPanel />
                <Content style={{ margin: '0 16px', overflow: 'auto' }}>
                    <FeedContent />
                </Content>
            </Layout>
        </Layout>

        <AuthModal open={state.auth === null} onAuthenticated={(auth) => setState(_state => ({ ..._state, auth }))} />

    </AppContext.Provider>;

}

export default App;

function getFeedIdFromLocation(location: Location): string | null {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('feed') || null;
}
