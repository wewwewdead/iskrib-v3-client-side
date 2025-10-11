import { useState } from 'react'
import './App.css'
import { Routes, Route, BrowserRouter} from 'react-router-dom'
import HomePage from './components/HomePage/home.jsx';
import LoginPage from './components/LoginPage/login.jsx';
import SignUp from './components/SignUpPage/signup.jsx';

const App = () => {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<HomePage/>}/>
    <Route path='/home' element={<HomePage/>}/>
    <Route path='/login' element={<LoginPage/>}/>
    <Route path='/signUp' element={<SignUp/>}/>
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
