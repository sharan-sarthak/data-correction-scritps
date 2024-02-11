var csvFilePath = "/tmp/842 Merit Health Woman's Hospital - empi_extract_mrn_crosswalk_20230710_wh_merit";
var locationID = "842";
var csvData = cat(csvFilePath).split('\n').map(function (line) {
    return line.split(',');
});
csvData = csvData.filter(function (row) {
    return row.length === 7;
});
csvData.shift();
function updatePatient(patientId, update) {
    db.patient.update({ _id: NumberLong(patientId) }, update);
}
function compareAndUpdateField(pulseList, cernerList, key, flagForIdentifierTelecom) {
    for (var j = 0; j < cernerList.length; j++) {
        var addName = true;
        for (var i = 0; i < pulseList.length; i++) {
            if(flagForIdentifierTelecom){
                if (cernerList[j].value.value == pulseList[i].value.value) {
                    addName = false;
                    break;
                }
            }
            else{
                if (cernerList[j].text.value == pulseList[i].text.value) {
                    addName = false;
                    break;
                }
            }
        }
        if (addName == true) {
            pulseList.unshift(cernerList[j]); // unshift to add at the beginning
        }
    }
    return pulseList;
}
function compareAndUpdateSearchElements(pulseList, cernerList) {
    var pulseSearchElementsList = pulseList.slice();
    for (var i = 0; i < cernerList.length; i++) {
        var cernerElement = cernerList[i];
        if (!pulseSearchElementsList.includes(cernerElement)) {
            pulseSearchElementsList.push(cernerElement);
        }
    }
    return pulseSearchElementsList;
}
csvData.forEach(function (row) {
    var pulseID = row[6].trim().toString();
    var cernerID = row[5] ? row[5].trim().toString() : undefined;
    var pulsePatient = db.patient.findOne({
        "identifier.system.value": locationID,
        "identifier.value.value": pulseID,
        "active.value": true
    });
    if (pulsePatient != null) {
        if (cernerID !== undefined && cernerID !== "") {
            var cernerPatient = db.patient.findOne({
                "identifier.system.value": locationID,
                "identifier.value.value": cernerID,
                "active.value": true
            });
            if (cernerPatient != null) {
                if(pulsePatient.identifier && cernerPatient.identifier){
                    var updatedIdentifier = compareAndUpdateField(pulsePatient.identifier, cernerPatient.identifier, "value.value", true);
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "identifier": updatedIdentifier
                        }
                    });
                }
                
                if(pulsePatient.name && cernerPatient.name){
                    var updatedName = compareAndUpdateField(pulsePatient.name, cernerPatient.name, "text.value", false);
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "name": updatedName
                        }
                    });
                }
                else if(pulsePatient.name == null && cernerPatient.name){
                    print("pulsePatient.name is null then putting cernerPatient.name to pulsePatient.name")
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "name": cernerPatient.name
                        }
                    });
                }
                
                if(pulsePatient.address && cernerPatient.address){
                    var updatedAddress = compareAndUpdateField(pulsePatient.address, cernerPatient.address, "text.value", false);
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "address": updatedAddress
                        }
                    });
                }
                else if(pulsePatient.address == null && cernerPatient.address){
                    print("pulsePatient.address is null then putting cernerPatient.address to pulsePatient.address")
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "address": cernerPatient.address
                        }
                    });
                }
                
                if(pulsePatient.telecom && cernerPatient.telecom){
                    var updatedTelecom = compareAndUpdateField(pulsePatient.telecom, cernerPatient.telecom, "value.value", true);
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "telecom": updatedTelecom
                        }
                    });
                }
                else if(pulsePatient.telecom == null && cernerPatient.telecom){
                    print("pulsePatient.telecom is null then putting cernerPatient.telecom to pulsePatient.telecom")
                    updatePatient(pulsePatient._id, {
                        $set: {
                            "telecom": cernerPatient.telecom
                        }
                    });
                }
                
                if(pulsePatient.searchElementsList && cernerPatient.searchElementsList){
                    var updatedSearchElements = compareAndUpdateSearchElements(pulsePatient.searchElementsList, cernerPatient.searchElementsList);
                    if (updatedSearchElements.length > pulsePatient.searchElementsList.length) {
                        updatePatient(pulsePatient._id, {
                            $set: { "searchElementsList": updatedSearchElements }
                        });
                    }
                }
                else if(pulsePatient.searchElementsList == null && cernerPatient.searchElementsList){
                    print("pulsePatient.searchElementsList is null then putting cernerPatient.searchElementsList to pulsePatient.searchElementsList")

                    updatePatient(pulsePatient._id, {
                        $set: {
                            "searchElementsList": cernerPatient.searchElementsList
                        }
                    });
                }
                
                updatePatient(cernerPatient._id, {
                    $set: {
                        "active.value": false,
                        "linkList": [
                            {
                                "active": { "extension": null, "value": true },
                                "other": pulsePatient._id,
                                "type": { "extension": null, "value": "replace" }
                            }
                        ]
                    }
                });
                // Updating the consent for cerner patient
                db.consent.updateMany({ "patient": cernerPatient._id }, { $set: { "status.value": "ACTIVE_MERGE" } });
                print("Merged Cerner patient of mongo Id " + cernerPatient._id + " into Pulse patient of mongo id " + pulsePatient._id + "with pulseID " + cernerID);
            } else if (cernerID !== undefined && pulsePatient.identifier) {
                pulsePatient.identifier.forEach(function (identifier) {
                    if (identifier.system.value == locationID) {
                        identifier.value.value = cernerID;
                        return;
                    }
                });
                updatePatient(pulsePatient._id, {
                    $set: { identifier: pulsePatient.identifier }
                });
            }
        }
    } else {
        var cernerPatient = db.patient.findOne({
            "identifier.system.value": locationID,
            "identifier.value.value": cernerID,
            "active.value": true
        });
        if (cernerPatient != null) {
            db.consent.updateMany({ "patient": cernerPatient._id }, { $set: { "status.value": "ACTIVE_MERGE" } });
        }
    }
});