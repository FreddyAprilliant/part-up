Template.AdminSectors.onCreated(function() {
    this.subscribe('sectors.all');
    this.currentSectorId = new Reactive(undefined)
    this.currentToggleTarget = new ReactiveVar(undefined)
    this.toggleMenu = () => {
        let target = Template.instance().currentToggleTarget.get()
        $(target).next('[data-toggle-target]').toggleClass('pu-state-active')
        $('[data-toggle-target]').not(
            $(target).next('[data-toggle-target]')[0].removeClass('pu-state-active'))
    }
});

Template.AdminSectors.helpers({
    sectors: () => Sectors.find(),
    currentSector: () => Template.instance().currentSectorId.get(),
    newSector: () => {
        return {
            _id: undefined,
            name: undefined,
            phrase_key: 'network-settings-sector-'
        }
    },
    toggleMenu: () => Template.instance().toggleMenu
});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.AdminSectors.events({
    'click [data-toggle]': (event, template) => {
        event.preventDefault()
        template.currentToggleTarget.set(event.currentTarget)
        template.toggleMenu()

        // $(event.currentTarget).next('[data-toggle-target]').toggleClass('pu-state-active');
        // $('[data-toggle-target]').not($(event.currentTarget).next('[data-toggle-target]')[0]).removeClass('pu-state-active');
    },
    'click [data-expand]': (event) => {
        $(event.currentTarget).addClass('pu-state-expanded');
    },
    'click [data-sector-edit]': (event, template) => {
        let sectorId = $(event.currentTarget).data('sector-edit')
        template.currentSectorId.set(sectorId)
        Partup.client.popup.open({id: 'popup.sector-edit'})
        template.toggleMenu()
    },
    'click [data-sector-remove]': (event, template) => {
        let sectorId = $(event.currentTarget).data('sector-remove')
        let affectedCount = Networks.find().fetch()
            .filter(tribe => tribe.sector_id === sectorId)
            .reduce((total, current) => { total = ++total }, 0)

        Partup.client.prompt.confirm({
            message: `This will affect ${affectedCount} tribes, are you sure?`,
            onConfirm: () => {
                Meteor.call('sectors.remove', sectorId, error => {
                    if (error) {
                        Partup.client.notify.error(TAPi18n.__('pages-modal-admin-createsector-error-' + error.reason));
                        return;
                    }
                    Partup.client.notify.success('Sector removed correctly');
                });
            }
        });
        template.toggleMenu()
    },
    'click [data-closepage]': function(event, template) {
        event.preventDefault();
        Intent.return('admin-sectors', {
            fallback_route: {
                name: 'discover'
            }
        });
    }
});

/*************************************************************/
/* Widget form hooks */
/*************************************************************/
AutoForm.hooks({
    createSectorForm: {
        onSubmit: function(insertDoc, updateDoc, currentDoc) {
            var self = this;

            Meteor.call('sectors.insert', insertDoc, function(error, sectorId) {
                if (error) {
                    Partup.client.notify.error(TAPi18n.__('pages-modal-admin-createsector-error-' + error.reason));
                    return;
                }
                Partup.client.notify.success('Sector inserted correctly');
                self.done();
                AutoForm.resetForm('createSectorForm');
            });

            return false;
        }
    }
});
