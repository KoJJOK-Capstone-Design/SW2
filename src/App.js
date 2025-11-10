import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Signin from './Signin';
import Signup from './Signup';
import Dashboard from './Dashboard';
import Activity from './Activity';
import Community from './Community';
import CommunityWrite from "./CommunityWrite";
import PostDetail from "./PostDetail";  
import PostEdit from "./PostEdit";       

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Signin" element={<Signin />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/write" element={<CommunityWrite />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/community/:id/edit" element={<PostEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
