Template._EditSector.onCreated(function () {
    this.submitting = new ReactiveVar(false);
})

Template._EditSector.helpers({
    formSchema: Partup.schemas.forms.sector,
    currentSectorFields: () => Sectors.findOne({_id: Template.instance().data.sectorId }),
    submitting: () => Template.instance().submitting.get()
})

AutoForm.hooks({
    editSectorForm: {
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            var self = this
            var template = self.template.parent()

            var parent = Template.instance().parent()
            parent.submitting.set(true)

            Meteor.call('sectors.update', template.data.sectorId, insertDoc, function (error, result) {
                parent.submitting.set(false)
                if (error) {
                    return Partup.client.notify.error(TAPi18n.__('base-errors-' + error.reason))
                }
                Partup.client.popup.close()
            })

            return false;
        }
    }
})
