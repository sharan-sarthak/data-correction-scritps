print("Start - " + new Date())

var patientEntry = db.patient.find({"_id": 847112});
patientEntry.forEach(function (patientObj) {
    if (patientObj.searchElementsList && patientObj.searchElementsList.length > 0) {
        patientObj.searchElementsList = patientObj.searchElementsList.filter(function (element) {
            return element !== "k_ts101832121" && element !== "id_ts101832121";
        });
        db.patient.update({ _id: patientObj._id }, { $set: { searchElementsList: patientObj.searchElementsList }});
    }
});

db.diagnosticOrder.update({"_id":{$in:[3096715, 3841138]}},{ $set: { "markToBeDeleted": true}},{ multi: true })

db.diagnosticOrder.update({"subject":1079446},{ $unset: {"active":"" }})
db.diagnosticReport.update({"subject":1079446},{ $unset: { "active":"" }})
db.imagingStudy.update({"patient":1079446},{ $unset: { "active":"" }})

print("End - " + new Date())