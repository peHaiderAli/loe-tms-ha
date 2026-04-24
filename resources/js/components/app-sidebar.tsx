import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, KeyRound, LayoutGrid, Radar, ShieldCheck, Upload, BarChart3 } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Profile Settings',
        url: '/settings/profile',
        icon: ClipboardList,
    },
];

export function AppSidebar() {
    const { permissions } = usePage<SharedData>().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Overview',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: permissions?.canSwitchWorkspace ? 'Team Workspace' : 'My Workspace',
            url: '/workspace',
            icon: Radar,
        },
        ...(!permissions?.canManageImports
            ? [
                  {
                      title: 'My Utilization',
                      url: '/utilization',
                      icon: BarChart3,
                  },
              ]
            : []),
        {
            title: 'Project Health',
            url: '/projects',
            icon: ClipboardList,
        },
        ...(permissions?.canReview
            ? [
                  {
                      title: 'Review Center',
                      url: '/reviews',
                      icon: ShieldCheck,
                  },
              ]
            : []),
        ...(permissions?.canManageImports
            ? [
                  {
                      title: 'Imports',
                      url: '/imports',
                      icon: Upload,
                  },
                  {
                      title: 'Access',
                      url: '/access',
                      icon: KeyRound,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
