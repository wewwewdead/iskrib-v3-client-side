import { useEffect, useId } from 'react';
import { getBookmarks } from '../../../API/Api';
import { useAuth } from '../../Context/Authcontext';
import './bookmarks.css';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import ParseContent from '../HomePage/postCards/parseData';
import { MoonLoader } from 'react-spinners';

const Bookmarks = () =>{
    const {user, session} = useAuth();
    const userId = user?.userData?.[0].id

    const queryClient = useQueryClient();
    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['getBookmarks', userId],
        queryFn: ({queryKey, pageParam = null}) => getBookmarks(pageParam, 5, queryKey[1]),
        getNextPageParam: (lastPage) => {
            if(lastPage?.hasMore){
                const lastBookmark = lastPage.bookmarks[lastPage?.bookmarks?.length - 1];
                return new Date(lastBookmark.created_at).toISOString();
            } else {
                return undefined;
            }
        },
        enabled: !!userId
    })

    useEffect(() =>{
        if(data){
            console.log(data);
            console.log(hasNextPage)
        }

    }, [data])

    const journals = data?.pages?.flatMap((journal) => journal.bookmarks|| []);

    useEffect(() =>{
        if(journals){
            console.log(journals)
        }
    }, [journals])

    if(isLoading){
        return(
            <>
            <MoonLoader loading={isLoading} size={25}/>
            </>
        )
    }
    if(journals?.length === 0){
        return(
            <>
            <div className='bookmark-parent-container'>
                <p>No bookmarks available</p>
            </div>
            </>
        )
    }

    
    return(
        <>
        <div className='bookmark-parent-container'>
            {journals?.map((journal, index) => {
                const parsedContent = ParseContent(journal.journals.content);
                return(
                    <div className='bookmarks' key={index}>
                        <p className='bookmark-content'>{parsedContent.slicedText}</p>
                    </div>
                )
            })}
        </div>
        </>
    )
}
export default Bookmarks;