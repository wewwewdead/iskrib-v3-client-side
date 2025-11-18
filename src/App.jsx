import { useState } from 'react'
import './App.css'
import { Routes, Route, BrowserRouter, HashRouter} from 'react-router-dom'
import HomePage from './components/HomePage/home.jsx';
import LoginPage from './components/LoginPage/login.jsx';
import SignUp from './components/SignUpPage/signup.jsx';
import MyProfile from './components/ProfilePage/MyProfile.jsx';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {HeadingNode} from "@lexical/rich-text";
import ImageNode from './components/HomePage/Editor/nodes/ImageNode.jsx';

import PostCards from './components/HomePage/postCards/PostCards.jsx';
import ContentView from './components/HomePage/ContentViewer/ContentView.jsx';
import Bookmarks from './components/Bookmarks/Bookmarks.jsx';
import Visitprofile from './components/VisitProfile/VisitProfile.jsx';
import ProfilePostCards from './components/HomePage/postCards/ProfilePostCards/ProfilePostCards.jsx';

const App = () => {

const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
  }
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
          <Route path='/' element={<LoginPage/>}/>
          <Route path='/profile' element={<MyProfile/>}>
            <Route index element={<ProfilePostCards/>} />
            <Route path='media'/>
          </Route>
          <Route path='/visitProfile' element={<Visitprofile/>}/>
          <Route path='/home' element={<HomePage/>}>
            <Route index element={<PostCards/>}/>
            <Route path='contentViewer' element={<ContentView/>}/>
            <Route path='bookmark' element={<Bookmarks/>}/>    
          </Route>   
          <Route path='/login' element={<LoginPage/>}/>
          <Route path='/signUp' element={<SignUp/>}/>
        </Routes>
      </BrowserRouter>
    </LexicalComposer>
    </>
  )
}

export default App
