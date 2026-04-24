import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex size-11 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                <AppLogoIcon className="size-8" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate text-base leading-none font-semibold text-slate-950 dark:text-white">PixelEdge</span>
                <span className="truncate text-xs text-muted-foreground">Pixeledge LOE TMS</span>
            </div>
        </>
    );
}
