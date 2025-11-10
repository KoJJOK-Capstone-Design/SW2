import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Signin from './Signin';
import Signup from './Signup';
import Dashboard from './Dashboard';
import NewFamily from './NewFamily'
import Activity from './Activity';
import Community from './Community';
import CommunityWrite from "./CommunityWrite";
import PostDetail from "./PostDetail";  
import PostEdit from "./PostEdit";       
import Calendar from './Calendar';
import Chat from './Chat';
import Health from './Health';


export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Signin" element={<Signin />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Activity" element={<Activity />} />
        <Route path="/Calendar" element={<Calendar />} />
        <Route path="/NewFamily" element={<NewFamily />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/write" element={<CommunityWrite />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/community/:id/edit" element={<PostEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/Chat" element={<Chat />} />
        <Route path="/Health" element={<Health/>} />
      </Routes>
    </BrowserRouter>
  );
}
