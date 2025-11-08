const formatCounts = (num) => {
    const number = parseInt(num);

    if(number > 1_000_000) return `${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
    if(number > 1_000) return `${(number / 1_000).toFixed(1).replace(/\.0$/, '')}k`
    return number.toString();
}

export default formatCounts;