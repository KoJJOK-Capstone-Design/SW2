import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Signin from './Signin';
import Signup from './Signup';
import Dashboard from './Dashboard';
import NewFamily from './NewFamily'
import Activity from './Activity';
import Calendar from './Calendar';
import Chat from './Chat';
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
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/Chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}