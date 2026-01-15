export const buildCommentTree = (comments) => {
    const map = new Map();
    const roots = [];

    comments.forEach(c => {
        map.set(c.id, {...c, replies: []})
    });

    map.forEach(comment=>{
        if(comment.parent_id === null){ //if null then it is the top level comment
            roots.push(comment);
        } else {
            const parent = map.get(comment.parent_id);
            if(parent){
                parent.replies.push(comment)
            }
        }
    })

    return roots;
}