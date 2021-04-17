/**The function for sorting the objects in an array*/
function compare(firstObject, secondObject){
   
    if(Date.parse(firstObject.createdAt) > Date.parse(secondObject.createdAt)){
        return 1;
    }

    if(Date.parse(firstObject.createdAt) < Date.parse(secondObject.createdAt)){
        return -1;
    }
    
    return 0;
}

module.exports = compare;

