import { lazy } from 'react';
import __Layout from './Layout.jsx';

const Home = lazy(() => import('./pages/Home'));
const Resources = lazy(() => import('./pages/Resources'));
const Events = lazy(() => import('./pages/Events'));
const WhyChicago = lazy(() => import('./pages/WhyChicago'));
const Funding = lazy(() => import('./pages/Funding'));
const Workspaces = lazy(() => import('./pages/Workspaces'));
const AcceleratorsIncubators = lazy(() => import('./pages/AcceleratorsIncubators'));
const Stories = lazy(() => import('./pages/Stories'));
const StoryDetail = lazy(() => import('./pages/StoryDetail'));
const Community = lazy(() => import('./pages/Community'));
const About = lazy(() => import('./pages/About'));
const SubmitResource = lazy(() => import('./pages/SubmitResource'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const BeforeYouStart = lazy(() => import('./pages/BeforeYouStart'));
const BusinessTypeExplorer = lazy(() => import('./pages/BusinessTypeExplorer'));
const Directory = lazy(() => import('./pages/Directory'));
const ServiceResources = lazy(() => import('./pages/ServiceResources'));
const SmallBusinessResources = lazy(() => import('./pages/SmallBusinessResources'));
const SavedResources = lazy(() => import('./pages/SavedResources'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Terms = lazy(() => import('./pages/Terms'));
const Investors = lazy(() => import('./pages/Investors'));
const Pricing = lazy(() => import('./pages/Pricing'));
const InvestorInsights = lazy(() => import('./pages/InvestorInsights'));

export const PAGES = {
    "Home": Home,
    "Resources": Resources,
    "Events": Events,
    "WhyChicago": WhyChicago,
    "Funding": Funding,
    "Workspaces": Workspaces,
    "AcceleratorsIncubators": AcceleratorsIncubators,
    "Stories": Stories,
    "StoryDetail": StoryDetail,
    "Community": Community,
    "About": About,
    "SubmitResource": SubmitResource,
    "Contact": Contact,
    "Profile": Profile,
    "before-you-start": BeforeYouStart,
    "business-type-explorer": BusinessTypeExplorer,
    "Directory": Directory,
    "service-resources": ServiceResources,
    "small-business-resources": SmallBusinessResources,
    "saved": SavedResources,
    "settings": Settings,
    "admin": Admin,
    "assessment": Assessment,
    "terms": Terms,
    "Investors": Investors,
    "Pricing": Pricing,
    "investor-insights": InvestorInsights,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
