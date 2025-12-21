import Home from './pages/Home';
import Resources from './pages/Resources';
import Events from './pages/Events';
import WhyChicago from './pages/WhyChicago';
import Funding from './pages/Funding';
import Workspaces from './pages/Workspaces';
import AcceleratorsIncubators from './pages/AcceleratorsIncubators';
import CommunityResources from './pages/CommunityResources';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Community from './pages/Community';
import About from './pages/About';
import SubmitResource from './pages/SubmitResource';
import Contact from './pages/Contact';
import __Layout from './Layout.jsx';


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