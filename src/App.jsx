import { useState } from 'react'
import './App.css'
import { Routes, Route, BrowserRouter, HashRouter, Navigate} from 'react-router-dom'
import AuthModal from './components/AuthModal/AuthModal.jsx';
import { useAuth } from './Context/useAuth.js';
import HomePage from './components/HomePage/home.jsx';
import LoginPage from './components/LoginPage/login.jsx';
import SignUp from './components/SignUpPage/signup.jsx';
import MyProfile from './components/ProfilePage/MyProfile.jsx';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import ImageNode from './components/HomePage/Editor/nodes/ImageNode.jsx';

import PostCards from './components/HomePage/postCards/PostCards.jsx';
import ContentView from './components/HomePage/ContentViewer/ContentView.jsx';
import Bookmarks from './components/Bookmarks/Bookmarks.jsx';
import Visitprofile from './components/VisitProfile/VisitProfile.jsx';
import ProfilePostCards from './components/HomePage/postCards/ProfilePostCards/ProfilePostCards.jsx';
import VisitedProfilePostCards from './components/HomePage/postCards/ProfilePostCards/VisitedProfilePostCards.jsx';
import Notifications from './components/Notifications/Notifications.jsx';
import NotificationCards from './components/Notifications/notificationsCards.jsx';
import UnreadNotification from './components/Notifications/UnreadNotificationCard.jsx';
import Collections from './components/collections/Collection.jsx';
import CollectionJournals from './components/collections/CollectionJournalCards.jsx';
import CollectionViewer from './components/collections/CollectionViewer.jsx';
import ViewUserCollection from './components/collections/ViewUserCollections.jsx';
import OpinionsPage from './components/SidebarOpinions/OpinionssPage.jsx';
import VisitedProfileOpinions from './components/SidebarOpinions/visitedProfileOpinions.jsx';
import MyOpinions from './components/SidebarOpinions/MyOpinions.jsx';
import OpinionViewer from './components/SidebarOpinions/opinionViewer.jsx';

const AppAuthModal = () => {
  const {showAuthModal, closeAuthModal} = useAuth();
  return <AuthModal isOpen={showAuthModal} onClose={closeAuthModal}/>;
}

const App = () => {

  const theme = {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
    quote: 'editor-quote',
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
  nodes: [ImageNode, HeadingNode, QuoteNode],
  onError(error){
  throw error;
  },
}

  return (
    <>
    <LexicalComposer initialConfig={initaConfig}>
      <HashRouter>
        <AppAuthModal/>
        <Routes>
          <Route path='/' element={<Navigate to='/home' replace/>}/>
          <Route path='/profile' element={<MyProfile/>}>
            <Route index element={<ProfilePostCards/>} />
            <Route path='myOpinions' element={<MyOpinions/>}/>         
          </Route>

          <Route path='/visitProfile' element={<Visitprofile/>}> 
            <Route index element={<VisitedProfilePostCards/>}/>
            <Route path='media'/>
            <Route path='visitedCollections' element={<CollectionViewer/>}/>
            <Route path='visitedOpinions' element={<VisitedProfileOpinions/>}/>
          </Route>  

          <Route path='/home' element={<HomePage/>}>
            <Route index element={<PostCards/>}/>
            <Route path='contentViewer' element={<ContentView/>}/>
            <Route path='bookmark' element={<Bookmarks/>}/>
            <Route path='userCollections' element={<ViewUserCollection/>}/>
            <Route path='opinions'element={<OpinionsPage/>}/>
            <Route path='opinionsViewer' element={<OpinionViewer/>}/>

            <Route path='collections' element={<Collections/>}/>
            <Route path='collectionCards' element={<CollectionJournals/>}/>
            
            {/* route for nested notifications */}
            <Route path='notifications' element={<Notifications/>}>
              <Route index element={<NotificationCards/>}/>
              <Route path='unreadNotification' element={<UnreadNotification/>}/>
            </Route>  
          </Route>   

          <Route path='/login' element={<LoginPage/>}/>
          <Route path='/signUp' element={<SignUp/>}/>
        </Routes>
      </HashRouter>
    </LexicalComposer>
    </>
  )
}

export default App
