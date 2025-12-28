import { lazy } from 'react';
import __Layout from './Layout.jsx';

const Home = lazy(() => import('./pages/Home'));
const Resources = lazy(() => import('./pages/Resources'));
const Events = lazy(() => import('./pages/Events'));
const WhyChicago = lazy(() => import('./pages/WhyChicago'));
const Funding = lazy(() => import('./pages/Funding'));
const Workspaces = lazy(() => import('./pages/Workspaces'));
const AcceleratorsIncubators = lazy(() => import('./pages/AcceleratorsIncubators'));
const CommunityResources = lazy(() => import('./pages/CommunityResources'));
const Stories = lazy(() => import('./pages/Stories'));
const StoryDetail = lazy(() => import('./pages/StoryDetail'));
const Community = lazy(() => import('./pages/Community'));
const About = lazy(() => import('./pages/About'));
const SubmitResource = lazy(() => import('./pages/SubmitResource'));
const Contact = lazy(() => import('./pages/Contact'));

export const PAGES = {
    "Home": Home,
    "Resources": Resources,
    "Events": Events,
    "WhyChicago": WhyChicago,
    "Funding": Funding,
    "Workspaces": Workspaces,
    "AcceleratorsIncubators": AcceleratorsIncubators,
    "CommunityResources": CommunityResources,
    "Stories": Stories,
    "StoryDetail": StoryDetail,
    "Community": Community,
    "About": About,
    "SubmitResource": SubmitResource,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};