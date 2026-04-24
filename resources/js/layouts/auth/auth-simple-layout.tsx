import AppLogo from '@/components/app-logo';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(22,184,179,0.15),_transparent_28%),linear-gradient(135deg,_#f8fffe,_#ffffff_45%,_#f5f7fb)] flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(22,184,179,0.18),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.95),_rgba(17,24,39,0.92))]">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex items-center gap-3 font-medium">
                            <AppLogo />
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
