var practitionerEntries = db.practitioner.find({
    "identifier": { "$elemMatch": { "type.text.value": "KTP Number" }}
});

practitionerEntries.forEach(function (pracObj) {
    var countOfKTP = 0;
    var lastKTPIndex = -1;

    pracObj.identifier.forEach(function (identifierEntry, index) {
        if (identifierEntry.type.text.value === "KTP Number") {
            countOfKTP++;
            lastKTPIndex = index;
        }
    });

    if (countOfKTP > 1) {
        pracObj.identifier.splice(lastKTPIndex, 1);

        db.practitioner.update(
            { "_id": pracObj._id },
            { $set: { "identifier": pracObj.identifier } }
        );

        print("For Practitioner ID " + pracObj._id + ". Removed the last KTP entry.");
        printjson(pracObj.identifier);
    }
});
