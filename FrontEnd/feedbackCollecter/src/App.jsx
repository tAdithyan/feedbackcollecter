import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NotFount from './pages/NotFount';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path='/adminlogin' element={<AdminLogin />} />
      <Route path='/admindashboard' element={<AdminDashboard />} />
      <Route path="*" element={<NotFount />} />
         </Routes>
  );
}

export default App;
