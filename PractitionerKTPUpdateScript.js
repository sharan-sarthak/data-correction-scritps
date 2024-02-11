print("Start: " + new Date())

var csvFilePath = "UpdatedDoctorKTP.csv";
var csvData = cat(csvFilePath).split('\n').map(function (line) {
    return line.split(',');
});
csvData = csvData.filter(function (row) {
    return row.length === 3;
});

csvData.forEach(function (row) {
    var oldKTP = row[1].trim().toString();
    var newKTP = row[2].trim().toString();
	
	/*to update markToBeDeleted and active.value*/
    var practitionerEntriesToUpdate = db.practitioner.find({
        "identifier": { "$elemMatch": { "type.text.value": "KTP Number", "value.value": newKTP } }
    });
    practitionerEntriesToUpdate.forEach(function (pracObj) {
        db.practitioner.updateOne(
            { "_id": pracObj._id},
            { $set: { "active.value": false , "markToBeDeleted":true} }
        );
		print("For Practitioner ID - " + pracObj._id + ". Updating markToBeDeleted and active.value")
    });
	
	
    var practitionerEntries = db.practitioner.find({
        "active.value":true, "identifier": { "$elemMatch": { "type.text.value": "KTP Number", "value.value": oldKTP } }
    });

    practitionerEntries.forEach(function (pracObj) {
		/* Updating Identifier */
        db.practitioner.updateOne(
            { "_id": pracObj._id, "identifier": { "$elemMatch": { "type.text.value": "KTP Number", "value.value": oldKTP } } },
            { $set: { "identifier.$.value.value": newKTP } }
        );
		print("For Practitioner ID - " + pracObj._id + ". Replacing identifier.value.value from " +oldKTP+" to "+newKTP)
		
		/* Updating practitionerLocationListMap.physicianLocationId*/
        if (pracObj.practitionerLocationListMap) {
            var updatedPractitionerLocationListMap = pracObj.practitionerLocationListMap.map(function (location) {
                if (location.physicianLocationId === oldKTP) {
                    location.physicianLocationId = newKTP;
                }
                return location;
            });

            db.practitioner.updateOne({ "_id": pracObj._id }, { $set: { "practitionerLocationListMap": updatedPractitionerLocationListMap } });
			print("For Practitioner ID - " + pracObj._id + ". Replacing practitionerLocationListMap.physicianLocationId from " +oldKTP+" to "+newKTP)
        }

		/* Updating extension.value */
        if (pracObj.extension && pracObj.extension.length > 0) {
            pracObj.extension.forEach(function (extensionElem) {
                if (extensionElem.url && extensionElem.url === "locationMapping" && extensionElem.value && extensionElem.value != null) {
					extensionElem.value.forEach(function(extensionValueElem){
						if (extensionValueElem.physicianLocationId === oldKTP) {
							extensionValueElem.physicianLocationId = newKTP;
						}
					})
                }
            });
            db.practitioner.updateOne({ "_id": pracObj._id }, { $set: { "extension": pracObj.extension } });
			print("For Practitioner ID - " + pracObj._id + ". Replacing extension.value from " +oldKTP+" to "+newKTP)
        }
        
		/* Updating practitionerProfile.identifiers.value */
        var practitionerProfile = db.practitionerProfile.findOne({ "practitionerId": pracObj._id });
        if (practitionerProfile && practitionerProfile.identifiers && practitionerProfile.identifiers != null) {
            practitionerProfile.identifiers.forEach(function (pracProfileIdentifiers) {
                if (pracProfileIdentifiers.type === "KTP") {
                    pracProfileIdentifiers.value = newKTP;
                }
            });
            db.practitionerProfile.updateOne({ "_id": practitionerProfile._id }, { $set: { "identifiers": practitionerProfile.identifiers } });
			print("For Practitioner ID - " + pracObj._id + ". Replacing practitionerProfile.identifiers.value from " +oldKTP+" to "+newKTP)

        }
    });
});

print("End: " + new Date())