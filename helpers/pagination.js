module.exports = (objectPagination, query, countProduct)=>{
    if(query.page){
        objectPagination.currentPage = parseInt(query.page)
    }
    
    objectPagination.skip = (objectPagination.currentPage - 1)*objectPagination.limit
    
    const totalPage = Math.ceil(countProduct/objectPagination.limit)
    objectPagination.totalPage = totalPage

    return objectPagination
}