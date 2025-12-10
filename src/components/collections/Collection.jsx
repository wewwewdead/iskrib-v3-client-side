import { useState } from 'react';
import './collection.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import OlderPost from './collectionOlderPost';
import ParseContent from '../HomePage/postCards/parseData';
import { addCollections, getCollections } from '../../../API/Api';
import { useAuth } from '../../Context/useAuth';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import CollectionCards from './CollectionCards';
import { BarLoader } from 'react-spinners';

const Collections = () =>{
    const {user, session} = useAuth();
    const queryClient = useQueryClient();

    const [showCollectionEditor, setShowCollectionEditor] = useState(false);
    const [showOlderPost, setShowOlderPost] = useState(false)
    const [olderPost, setOlderPost] = useState([]);
    const [savingCollection, setSavingCollection] = useState(false);

    const [collectionTitle, setCollectionTitle] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');

    const isDisabled = !collectionDescription || !collectionTitle || savingCollection;

    const handleClickBack = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    const handleClickSaveCollection = async(e) =>{
        e.stopPropagation();
        // console.log(collectionDescription, collectionTitle)
        // console.log('jornalids', [journalIds])
        setSavingCollection(true);
        const formdata = new FormData();

        // journalIds, title, description
        formdata.append('journalIds', journalIds)
        formdata.append('title', collectionTitle)
        formdata.append('description', collectionDescription)

        try {
            const message = await addCollections(session?.access_token, formdata)
            if(message){
                console.log(message)
                setCollectionDescription('')
                setCollectionTitle('')
                setOlderPost([])
                setSavingCollection(false)           
                setShowCollectionEditor(false)
            }
        } catch (error) {
                setCollectionDescription('')
                setCollectionTitle('')
                setOlderPost([])
                setSavingCollection(false)
                setShowCollectionEditor(false)
                throw new Error('error adding collections',error)

        } finally {
            queryClient.invalidateQueries(['getCollections', user?.userData?.[0].id]);
        }
    }

    const handleClickShowCollectionEditor = (e) =>{
        e.stopPropagation();
        console.log('clicks')
        setShowCollectionEditor(true);
    }

    const handleClickShowOlderPost = (e) =>{
        e.stopPropagation();
        setShowOlderPost(true)
    }
    const handleCloseShowOlderPost = () =>{
        setShowOlderPost(false)
    }

    const handleClickSaveSelectedContent = (data) =>{
        console.log(data)
        const postArray = Array.from(data.values());
        setOlderPost(postArray);
        setShowOlderPost(false)
    }

    useEffect(() =>{
        console.log(olderPost)
    }, [olderPost])

    useEffect(() =>{
        const handleClickOutside = (e) =>{
            if(showCollectionEditor && !e.target.closest('.collection-editor')){
                setShowCollectionEditor(false)
                setCollectionDescription('')
                setCollectionTitle('')
                setOlderPost([])
            }
        }

        document.addEventListener('click', handleClickOutside);

        return() =>{
            document.removeEventListener('click', handleClickOutside)
        }
    }, [showCollectionEditor])

    const journals = olderPost?.flatMap((journal) => journal) || [];
    const journalIds = olderPost?.flatMap((journal) => journal.id) || [];

    return(
        <>
        <div className='collection-header'>
            <div onClick={(e) => handleClickBack(e)} className='back-button'>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
            </div>
            <p className='collections-header-text'>Browse your collections</p>
        </div>

        <div className='collection-intro-container'>
            <div className='collections-intro'>
                <div className='collections-intro-h3'>
                    Collections 
                    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="28px" height="28px" viewBox="0 0 24 24" version="1.1">
                        <title>ic_fluent_book_formula_recent_24_filled</title>
                            <desc>Created with Sketch.</desc>
                            <g id="🔍-System-Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                <g id="ic_fluent_book_formula_recent_24_filled" fill={"#ffffffff"} fillRule="nonzero">
                                    <path d="M18,2 C19.3807,2 20.5,3.11929 20.5,4.5 L20.5,18.75 C20.5,19.1642 20.1642,19.5 19.75,19.5 L5.5,19.5 C5.5,20.0523 5.94772,20.5 6.5,20.5 L19.75,20.5 C20.1642,20.5 20.5,20.8358 20.5,21.25 C20.5,21.6642 20.1642,22 19.75,22 L6.5,22 C5.11929,22 4,20.8807 4,19.5 L4,4.5 C4,3.11929 5.11929,2 6.5,2 L18,2 Z M12.8581,6.37799 C12.62598,5.90759933 11.9844378,5.87623996 11.6977281,6.28391187 L11.642,6.37799 L10.5416,8.60759 L8.08108,8.96512 C7.55966125,9.04088875 7.33187629,9.64635672 7.63705678,10.0449565 L7.70527,10.1217 L9.48571,11.8572 L9.06541,14.3078 C8.97598882,14.8291176 9.48575824,15.2340394 9.96079283,15.0617758 L10.0493,15.0226 L12.25,13.8656 L14.4508,15.0226 C14.9189412,15.2688118 15.4615792,14.9090388 15.444597,14.4040705 L15.4347,14.3078 L15.0143,11.8572 L16.7948,10.1217 C17.17205,9.75395625 17.0005109,9.13023984 16.5193002,8.98711816 L16.419,8.96512 L13.9585,8.60759 L12.8581,6.37799 Z M12.25,8.21029 L12.9001,9.52747 C12.9847857,9.69901857 13.1371367,9.82544224 13.3180464,9.87827058 L13.4107,9.89842 L14.8643,10.1096 L13.8124,11.1349 C13.6792333,11.2647333 13.6064139,11.442275 13.6076569,11.625106 L13.6174,11.7351 L13.8657,13.1829 L12.5656,12.4993 C12.4009333,12.4128 12.2096,12.3983833 12.0361023,12.45605 L11.9345,12.4993 L10.6343,13.1829 L10.8826,11.7351 C10.9141,11.55185 10.8686556,11.3654056 10.7601556,11.2181856 L10.6876,11.1349 L9.6358,10.1096 L11.0894,9.89842 C11.2787429,9.87091429 11.4460449,9.76506816 11.5521994,9.60935207 L11.6,9.52747 L12.25,8.21029 Z" id="🎨-Color">
                                    </path>
                                </g>
                            </g>
                    </svg>
                    </div>
                <p className='collections-intro-text'>You can create a collections of all your posts like a small notebook. Create now!</p>
            </div>
        </div>

        <div className='create-collection-container'>

            <div onClick={(e) =>{handleClickShowCollectionEditor(e)}} className='create-collection-bttn'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="24px" height="24px" viewBox="0 0 24 24" id="add-collection" data-name="Flat Color" className="icon flat-color">
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
                    <g id="SVGRepo_iconCarrier">
                        <path id="primary" d="M20,22H7a1,1,0,0,1,0-2H20V5a1,1,0,0,1,2,0V20A2,2,0,0,1,20,22ZM16,2H4A2,2,0,0,0,2,4V16a2,2,0,0,0,2,2H16a2,2,0,0,0,2-2V4A2,2,0,0,0,16,2Z" style={{fill: '#000000'}}/>
                        <path id="secondary" d="M10,14a1,1,0,0,1-1-1V11H7A1,1,0,0,1,7,9H9V7a1,1,0,0,1,2,0V9h2a1,1,0,0,1,0,2H11v2A1,1,0,0,1,10,14Z" style={{fill: '#ffffff'}}/>
                    </g>
                </svg>
                Create a collection
            </div>
        </div>

        <CollectionCards/>



        {showOlderPost && (
            <OlderPost onClose={handleCloseShowOlderPost} onSave={handleClickSaveSelectedContent}/>
        )}

        {showCollectionEditor && (
            <AnimatePresence>
            <motion.div
            initial={{opacity: 0, scale: 0}}
            animate={{opacity:1, scale:1, transition: {type: "tween", duration: 0.1}}}
            exit={{opacity:0, scale:0, transition: {type: "tween", duration: 0.1}}}
            className='collection-editor'
            >
                {savingCollection && (
                    <div className='is-saving-collections'>
                        <BarLoader loading={savingCollection} width={'100%'}/>
                    </div>
                    
                )}

                <div className='collection-input-name'>
                    <div className='field-name'>
                        Collection name:
                    </div>
                    <div className='input-name-container'>
                        <input value={collectionTitle} onChange={(e) => setCollectionTitle(e.target.value)} className='input-name-collection' type="text" placeholder='Collection name'/>
                    </div>
                </div>
                <div className='collection-input-description'>
                    <div className='field-name'>
                        Add description:
                    </div>
                    <div className='input-description-container'>
                        <textarea value={collectionDescription} onChange={(e) => setCollectionDescription(e.target.value)} placeholder='collection description' maxLength={250} name="description" id="collection-description" className='collection-description'></textarea>
                    </div>

                    <div className='create-or-add-container'>
                        <div onClick={(e) => handleClickShowOlderPost(e)} className='add-older-post-container'>
                            Add older Post
                        </div>
                    </div>
                </div>
                
                {journals.length > 0 && (
                <div className='journal-list'>
                    {journals?.map((journal) => {
                        const parsedContent = ParseContent(journal?.content);

                        return(
                            <div className='collection-cards-selected-old-post' key={journal.id}>
                                <div className='journal-title'>
                                    {journal.title.length > 10 ? `${journal.title.substring(0, 9)}...` : journal.title}
                                </div>
                                <div className='journal-text'>
                                    {parsedContent?.slicedText}
                                </div>
                            </div>
                        )
                        
                    })}
                </div>
                )}
                 

                <button disabled={isDisabled} onClick={(e) => handleClickSaveCollection(e, journalIds)} className={isDisabled ? 'save-collection-container-disabled' : 'save-collection-container'}>
                    <div className='save-collection-bttn'>
                        Save Collection
                    </div>
                </button>

            </motion.div>
            </AnimatePresence>
        )}   
        </>
    )
}

export default Collections;