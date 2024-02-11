var practitionerEntries = db.practitioner.find({
    "identifier": { "$elemMatch": { "type.text.value": "KTP Number"}}
});
practitionerEntries.forEach(function (pracObj) {
    var countOfKTP = 0
    pracObj.identifier.forEach(function (identifierEntry){
        if(identifierEntry.type.text.value === "KTP Number"){
            countOfKTP++;
        }
    });
    if(countOfKTP > 1){
        print("For Practitioner ID "+pracObj._id+". There are " +countOfKTP+ " KTP's present.")
    }
});