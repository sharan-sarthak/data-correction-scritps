print("Start - " + new Date())

var identifierToRemove = "TS101832121";
var patientEntries = db.patient.find({ "identifier.value.value": identifierToRemove });

patientEntries.forEach(function (patObj) {
    if(patObj.identifier && patObj.identifier.length > 1){
        patObj.identifier = patObj.identifier.filter(function (identifierEntry) {
            return identifierEntry.value.value !== identifierToRemove;
        });
        db.patient.update({ _id: patObj._id }, { $set: { identifier: patObj.identifier } });
        print("Removed identifier " + identifierToRemove + " from patient with _id: " + patObj._id);
    }
});

db.patient.update({"_id":1079446},{ $set: { "markToBeDeleted": true, "active.value":false } })
db.diagnosticOrder.update({"subject":1079446},{ $set: { "markToBeDeleted": true, "active.value":false } })
db.diagnosticReport.update({"subject":1079446},{ $set: { "markToBeDeleted": true, "active.value":false } })
db.imagingStudy.update({"patient":1079446},{ $set: { "markToBeDeleted": true, "active.value":false } })


print("End - " + new Date())