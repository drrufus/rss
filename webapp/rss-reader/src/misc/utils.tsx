
import { AppleOutlined, CommentOutlined, HomeOutlined, MediumOutlined, AndroidOutlined, CoffeeOutlined, HeartOutlined, ThunderboltOutlined } from '@ant-design/icons';

export function isValidHttpUrl(str: string) {
    let url;

    try {
        url = new URL(str);
    } catch (_) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
}

export function resolveIcon(icon: string | undefined): JSX.Element {
    switch (icon) {
        case 'apple': {
            return <AppleOutlined />;
        }
        case 'home': {
            return <HomeOutlined />;
        }
        case 'medium': {
            return <MediumOutlined />;
        }
        case 'android': {
            return <AndroidOutlined />;
        }
        case 'coffee': {
            return <CoffeeOutlined />;
        }
        case 'heart': {
            return <HeartOutlined />;
        }
        case 'thunder': {
            return <ThunderboltOutlined />;
        }
        case 'comment':
        default: {
            return <CommentOutlined />;
        }
    }
}
