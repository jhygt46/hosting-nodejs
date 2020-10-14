module.exports = {
    enviados: function (arr){
        for(var i=0, ilen=arr.length; i<ilen; i++){
            console.log(arr[i]);
            console.log(new Date().getTime());
        }
        return true;
    }
};