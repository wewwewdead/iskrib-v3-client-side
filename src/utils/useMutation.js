import { useMutation, useQueryClient } from "@tanstack/react-query";
import {addBookmark, addFollows, clickLike } from "../../API/Api";
import { data } from "react-router-dom";

export const useBookMarkMutation = (session) => {
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

                            const isBookmarked = journal.has_bookmarked;
                            const count = journal.bookmark_count?.[0]?.count ?? 0;

                            return{
                                ...journal,
                                has_bookmarked: !isBookmarked,
                                bookmark_count: [{count: isBookmarked ? count - 1 : count + 1}]
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




export const useLikeMutation = (session) =>{
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

                            const isLiked = journal.has_liked;
                            const count = journal.like_count?.[0]?.count ?? 0;

                            return{
                                ...journal,
                                has_liked: !isLiked,
                                like_count: [{count: isLiked ? count - 1 : count + 1}]
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

export const useFollowMutation = () =>{
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => addFollows(data),

        onMutate: async(data) => {
            await queryClient.cancelQueries(['followsData']);
            const previousData = queryClient.getQueryData(['followsData']);

            queryClient.setQueryData(['followsData'], (old) => {
                if(!old) return old;
                return{
                    ...old,
                    followersCount: old.isFollowing ? old.followersCount - 1 : old.followersCount + 1,
                    isFollowing: !old.isFollowing
                }
            })

            return {previousData};

        },
        onError: (err, data, context) => {
            queryClient.setQueryData(['followsData'], context.previousData)
        },
        onSettled: () => {
            queryClient.invalidateQueries(['followsData']);
        }
    })
}