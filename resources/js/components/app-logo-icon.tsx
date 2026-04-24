import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12h16l16 20-16 20H8l16-20L8 12Z" fill="#16B8B3" />
            <path d="M22 12h16l16 20-16 20H22l16-20-16-20Z" fill="#0F8B88" />
        </svg>
    );
}
