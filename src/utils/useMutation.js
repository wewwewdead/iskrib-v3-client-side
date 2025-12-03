import { useMutation, useQueryClient } from "@tanstack/react-query";
import {addBookmark, addFollows, addJournalViews, clickLike, deleteNotification, readNotification, updatePrivacy } from "../../API/Api";
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

export const useReadNotificationMutation = (session) =>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => readNotification(session?.access_token, data), //receiving the object data {notifId: the Id}
        onMutate: async(data) => {
            await queryClient.cancelQueries(['notifcounts', session?.user?.id]);
            const previousData = queryClient.getQueryData(['notifcount', session?.user?.id])

            queryClient.setQueryData(['notifcount', session?.user?.id], (old) => ({count: (old?.count ? old?.count : 0) - 1}));

            return{previousData};
        },
         onError: (err, data, context) => {
            queryClient.setQueryData(['notifcount', session?.user?.id], context.previousData)
         },
         onSettled: () => {
            queryClient.invalidateQueries(['notifcount', session?.user?.id]);
         }
    })
}

export const userDeleteNotificationMutation = (session) =>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => deleteNotification(session?.access_token, data?.notifId),

        onMutate: async(data) =>{
            await queryClient.cancelQueries(['getNotifications', session?.user?.id]);
            const previousData = queryClient.getQueryData(['getNotifications', session?.user?.id]);

            queryClient.setQueryData(['getNotifications', session?.user?.id], (old) => {
                if(!old) return old;

                return{
                    ...old,
                    pages: old.pages.map((page) =>({
                        ...page,
                        data: page.data.filter((notification) => notification.id !== data?.notifId)
                    }))
                }
            })

            return {previousData};
        },
        onError: (err, data, context) =>{
            queryClient.setQueryData(['getNotifications', session?.user?.id], context.previousData)
        },
        onSettled: () =>{
            queryClient.invalidateQueries(['getNotifications', session?.user?.id])
        }
    })
}

export const useAddViewsMutation = (session) =>{
    return useMutation({
        mutationFn: (data) => addJournalViews(session?.access_token, data),
        onerror: (err) => console.error(err),
        onSuccess: (data) => console.log(data),
        retry: 2,
    })
}

export const useUpdateJournalPrivacyMutation = (session) =>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => updatePrivacy(session?.access_token, data),
        onMutate: async(data) => {
            await queryClient.cancelQueries(['userJournals', session?.user?.id])
            const previousData = queryClient.getQueryData(['userJournals', session?.user?.id])

            const journalId = data.get('journalId')
            const privacy = data.get('privacy');

            console.log(privacy)

            queryClient.setQueryData(['userJournals', session?.user?.id], (old) => {
                if(!old) return old;

                return{
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.map((journal) => {
                            if(journal.id !== journalId) return journal;

                            return{
                                ...journal,
                                privacy: privacy
                            }
                        })
                    }))
                }
            })
            console.log(previousData)
            return {previousData};
            
        },
        onError: (err, data, context) =>{
            queryClient.setQueryData(['userJournals', session?.user?.id], context.previousData)
        },
        onSuccess: (data) => console.log(data),
        retry: 1,
    })
}