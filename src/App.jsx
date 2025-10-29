import { useState } from 'react'
import './App.css'
import { Routes, Route, BrowserRouter} from 'react-router-dom'
import HomePage from './components/HomePage/home.jsx';
import LoginPage from './components/LoginPage/login.jsx';
import SignUp from './components/SignUpPage/signup.jsx';
import MyProfile from './components/ProfilePage/MyProfile.jsx';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {HeadingNode} from "@lexical/rich-text";
import ImageNode from './components/HomePage/Editor/nodes/ImageNode.jsx';

const App = () => {

const theme = {
  paragraph: 'editor-paragraph',
  heading: 'editor-heading',
}
  
const initaConfig = {
  namespace: "MyLexicalEditor",
  theme,
  //register nodes
  nodes: [ImageNode, HeadingNode ],
  onError(error){
  throw error;
  },
}

  return (
    <>
    <LexicalComposer initialConfig={initaConfig}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage/>}/>
          <Route path='/profile' element={<MyProfile/>}/>
          <Route path='/home' element={<HomePage/>}/>
          <Route path='/login' element={<LoginPage/>}/>
          <Route path='/signUp' element={<SignUp/>}/>
        </Routes>
      </BrowserRouter>
    </LexicalComposer>
    </>
  )
}

export default App
