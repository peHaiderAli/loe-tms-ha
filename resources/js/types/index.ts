import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    permissions?: {
        canManageImports: boolean;
        canReview: boolean;
        canSwitchWorkspace: boolean;
    };
    flash?: {
        success?: string | null;
        inviteLink?: string | null;
        inviteEmail?: string | null;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface MetricCard {
    label: string;
    value: string;
    detail: string;
    tone: 'sky' | 'emerald' | 'amber' | 'rose';
}

export interface ReviewMetric {
    label: string;
    value: number;
    detail: string;
    tone: 'emerald' | 'amber' | 'rose';
}

export interface AllocationHealthItem {
    label: string;
    value: number;
    description: string;
    tone: 'emerald' | 'amber' | 'rose';
}

export interface CapacityInsightPerson {
    id: number;
    name: string;
    fullName: string;
    title: string;
    allocation: number;
    availability: number;
    variance: number;
}

export interface CapacityInsightGroup {
    team: string;
    count: number;
    people: CapacityInsightPerson[];
}

export interface TeamMixItem {
    name: string;
    count: number;
    share: number;
    color: string;
}

export interface InsightCard {
    title: string;
    body: string;
}

export interface SystemView {
    title: string;
    href: string;
    description: string;
}

export interface WorkspaceEmployee {
    id: number;
    name: string;
    preferredName: string;
    stream: string;
    title: string;
    reviewer: string;
    reviewStatus: string;
    location: string;
    focusPrompt: string;
}

export interface WorkspaceProject {
    project_id: number;
    name: string;
    type: string;
    allocation: number;
    utilization?: number;
    utilizationDelta?: number;
    utilizationNote?: string | null;
    priority: string;
    note: string;
}

export interface WorkspacePreset {
    label: string;
    allocations: number[];
    description: string;
}

export interface WorkspacePayload {
    employee: WorkspaceEmployee;
    projects: WorkspaceProject[];
    presets: WorkspacePreset[];
    steps: string[];
    totals: {
        total: number;
        availability: number;
        projectCount: number;
        utilization?: number;
    };
}

export interface QuickAction {
    title: string;
    detail: string;
}

export interface ReviewQueueItem {
    id: number | null;
    employeeId: number;
    member: string;
    stream: string;
    reviewer: string;
    status: string;
    allocation: number;
    risk: string;
    blocker: string;
}

export interface ReviewerLoadItem {
    reviewer: string;
    openItems: number;
    critical: number;
    serviceLevel: string;
}

export interface ProjectHighlight {
    name: string;
    priority: string;
    owner: string;
    health: string;
    coverage: number;
    assignedPeople?: number;
    fte?: number;
    contributors?: Array<{
        employeeId: number;
        name: string;
        fullName: string;
        stream: string;
        title: string;
        effort: number;
        reviewStatus: string;
    }>;
    signal: string;
}

export interface PriorityLane {
    lane: string;
    description: string;
}

export interface WorkspaceEmployeeListItem {
    id: number;
    preferredName: string;
    stream: string;
    totalAllocation: number;
    reviewStatus: string;
}
