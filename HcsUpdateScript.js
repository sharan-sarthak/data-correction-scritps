print("Start: " + new Date())

var hscEntry = db.healthcareService.find({ "name.value": "REHABILITATION MEDICINE" });

hscEntry.forEach(function (hcsObj) {
  var updatedIdentifier = hcsObj.identifier.map(function (identifierElem) {
    if (
      identifierElem.type &&
      identifierElem.type.text &&
      identifierElem.type.text.value === "specialtyIdentifier"
    ) {
      identifierElem.value.value = "RHBPHY";
    }
    return identifierElem;
  });

  db.healthcareService.updateOne(
    { "_id": hcsObj._id },
    { $set: { "identifier": updatedIdentifier } }
  );
  print("Updated HCS ID - "+hcsObj._id)
});

print("End: " + new Date())
