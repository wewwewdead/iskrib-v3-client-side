import { useMutation, useQueryClient } from "@tanstack/react-query";
import {addBookmark, clickLike } from "../../API/Api";

export const useBookMarkMutation = (session, userId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => addBookmark(session?.access_token, data),

        onMutate: async(data) =>{
            await queryClient.cancelQueries(['journals'])
            const previousData = queryClient.getQueryData(['journals']);

            queryClient.setQueryData(['journals'], (old) => {
                if(!old) return old;
                
                return{
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.map((journal) =>{
                            if(journal.id !== data.journalId) return journal;

                            const hasBookmarked = journal.bookmarks.some((bookmark) => bookmark.user_id === userId);

                            return{
                                ...journal,
                                bookmarks: hasBookmarked ? journal.bookmarks.filter((bookmark) => bookmark.user_id !== userId) : [...journal.bookmarks, {user_id: userId}]
                            }
                        })
                    }))
                }
            })

            return {previousData};
        },
        onError: (err,data, context) =>{
            queryClient.setQueryData(['journals'], context.previousData)
        },
        onSettled: () =>{
            queryClient.invalidateQueries(['journals'])
        }
    })
}




export const useLikeMutation = (session, userId) =>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => clickLike(session?.access_token, data), //receiving the object data {journalId: the Id}

        onMutate: async(data) => {
            await queryClient.cancelQueries(['journals'])
            const previousData = queryClient.getQueryData(['journals']);

            queryClient.setQueryData(['journals'], (old) => {
                if(!old) return old;
                return{
                    ...old, 
                    pages: old.pages.map((page) =>({
                        ...page,
                        data: page.data.map((journal) => {
                            //it is using data.journalId to destructure the data which is an plain object data = {journalId: the id}
                            if(journal.id !== data.journalId) return journal;//find the journal using jounalId, explicitlty mutate the journal

                            const hasLiked = journal.likes.some((like) => like.user_id === userId);

                            return{
                                ...journal,
                                likes: hasLiked
                                ? journal.likes.filter((like) => like.user_id !== userId) //remove the likes.user_id if it's the same the userId
                                : [...journal.likes, {user_id: userId}]
                            }
                        })
                    }))
                }
        })

        return {previousData};
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['journals'], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['journals']);
    },
})
}