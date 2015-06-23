/**
 * Updates constants
 */
var STARTING_LIMIT = 10;
var INCREMENT = 10;

/**
 * Updates created
 */
Template.app_partup_updates.onCreated(function() {
    var tpl = this;

    // Updates model
    tpl.updates = {

        handle: null,

        loading: false,
        end_reached: false,
        refreshDate: new ReactiveVar(new Date()),

        // The data model
        model: Updates.findByFilter(tpl.data.partupId),
        updateModel: function() {
            Tracker.nonreactive(function() {
                var options = tpl.updates.options.get();
                tpl.updates.model = Updates.findByFilter(tpl.data.partupId, options.filter, options.limit);
            });
            return tpl.updates.model.fetch();
        },

        // The view model
        view: new ReactiveVar([]),
        updateView: function() {
            Tracker.nonreactive(function() {
                var updates = tpl.updates.model.fetch();
                tpl.updates.view.set(updates);
                tpl.updates.refreshDate.set(new Date());
            });
        },
        addToView: function(updates) {
            var self = this;
            Tracker.nonreactive(function() {
                var current_updates = self.view.get();
                self.view.set(current_updates.concat(updates));
            });
        },

        // Options reactive variable (on change, update the whole view model)
        options: new ReactiveVar({}, function(a, b) {
            tpl.updates.resetLimit();

            var options = b;
            options.limit = tpl.updates.limit.get();

            var oldHandle = tpl.updates.handle;
            tpl.updates.handle = tpl.subscribe('updates.from_partup', tpl.data.partupId, options);
            tpl.updates.loading = true;

            Meteor.autorun(function whenSubscriptionIsReady(computation) {
                if (tpl.updates.handle.ready()) {
                    computation.stop(); // Stop the autorun
                    if (oldHandle) oldHandle.stop();
                    tpl.updates.loading = false;

                    /**
                     * From here, put the code in a Tracker.nonreactive to prevent the autorun from reacting to this
                     * -
                     */
                    Tracker.nonreactive(function replacePartups() {
                        tpl.updates.updateModel();
                        tpl.updates.updateView();
                    });
                }
            });
        }),

        // Filter reactive variable (on change, set value to the tpl.options reactive var)
        filter: new ReactiveVar('default', function(oldFilter, newFilter) {
            var options = tpl.updates.options.get();
            options.filter = newFilter;
            tpl.updates.options.set(options);
        }),

        // The reactive limit variable (on change, add updates to the view)
        limit: new ReactiveVar(STARTING_LIMIT, function(a, b) {
            var first = b === STARTING_LIMIT;
            if (first) return;

            var options = tpl.updates.options.get();
            options.limit = b;

            var oldHandle = tpl.updates.handle;
            tpl.updates.handle = tpl.subscribe('updates.from_partup', tpl.data.partupId, options);
            tpl.updates.loading = true;

            Meteor.autorun(function whenSubscriptionIsReady(computation) {
                if (tpl.updates.handle.ready()) {
                    computation.stop(); // Stop the autorun
                    if (oldHandle) oldHandle.stop();
                    tpl.updates.loading = false;

                    /*
                     * From here, put the code in a Tracker.nonreactive to prevent the autorun from reacting to this
                     * - Update the model (recall the findByFilter, with the new limit)
                     * - Get the current viewmodel
                     * - Determine whether the end is reached
                     * - Determine the added updates by comparing the _ids
                     * - Add the added updates to the current view model
                     **/
                    Tracker.nonreactive(function addPartups() {
                        var modelUpdates = tpl.updates.updateModel();
                        var viewUpdates = tpl.updates.view.get();

                        var difference = modelUpdates.length - viewUpdates.length;
                        tpl.updates.end_reached = difference < INCREMENT;

                        var addedUpdates = mout.array.filter(modelUpdates, function(update) {
                            return !mout.array.find(viewUpdates, function(_update) {
                                return update._id === _update._id;
                            });
                        });

                        tpl.updates.addToView(addedUpdates);
                    });
                }
            });
        }),

        increaseLimit: function() {
            tpl.updates.limit.set(tpl.updates.limit.get() + INCREMENT);
        },

        resetLimit: function() {
            tpl.updates.limit.set(STARTING_LIMIT);
            tpl.updates.end_reached = false;
        }

    };

    // When the model changes and the view is empty, update the view with the model
    tpl.autorun(function() {
        var updates = tpl.updates.model.fetch();

        if (updates.length && !tpl.updates.view.get().length) {
            tpl.updates.view.set(updates);
            tpl.updates.refreshDate.set(new Date());
        }
    });

    // First run
    tpl.updates.options.set({});
});

/**
 * Updates rendered
 */
Template.app_partup_updates.onRendered(function() {
    var tpl = this;

    /**
     * Infinite scroll
     */
    Partup.client.scroll.infinite({
        template: tpl,
        element: tpl.find('[data-infinitescroll-container]')
    }, function() {
        if (tpl.updates.loading || tpl.updates.end_reached) return;
        tpl.updates.increaseLimit();
    });

});

/**
 * Updates destroyed
 */
Template.app_partup_updates.onDestroyed(function() {
    var tpl = this;
    if (tpl.updates.handle) tpl.updates.handle.stop();
});

/**
 * Updates helpers
 */
Template.app_partup_updates.helpers({
    updates: function() {
        return Template.instance().updates.view.get();
    },

    newUpdatesCount: function() {
        var template = Template.instance();
        var refreshDate = template.updates.refreshDate.get();

        return lodash.filter(template.updates.model.fetch(), function(update) {
            return moment(update.updated_at).diff(refreshDate) > 0;
        }).length;
    },

    anotherDay: function(update) {
        var TIME_FIELD = 'created_at';

        var updates = Template.instance().updates.view.get();
        var currentIndex = lodash.findIndex(updates, update);
        var previousUpdate = updates[currentIndex - 1];
        var previousMoment = moment();

        if (previousUpdate) {
            previousMoment = moment(previousUpdate[TIME_FIELD]);
        }

        var currentMoment = moment(update[TIME_FIELD]);

        return previousMoment.diff(currentMoment) > 24 * 60 * 60 * 1000;
    },
    isLoggedIn: function() {
        var user = Meteor.user();
        return !!user;
    },
    isUpper: function() {
        var template = Template.instance();

        var user = Meteor.user();
        if (!user) return false;

        var partup = Partups.findOne(template.data.partupId);
        if (!partup) return false;

        return partup.uppers.indexOf(user._id) > -1;
    },

    metaDataForUpdate: function() {
        var update = this;
        var updateUpper = Meteor.users.findOne({_id: update.upper_id});

        var is_newuser = update.type.indexOf('partups_newuser') > -1;
        var is_contribution = update.type.indexOf('partups_contributions_') > -1;
        var path = '';
        if (is_newuser) {
            path = Router.path('profile', {_id: update.upper_id});
        } else if (is_contribution) {
            var activityUpdateId = Activities.findOne({_id: update.type_data.activity_id}).update_id;
            path = Router.path('partup-update', {_id: update.partup_id, update_id: activityUpdateId});
        } else {
            path = Router.path('partup-update', {_id: update.partup_id, update_id: update._id});
        }

        return {
            updateUpper: updateUpper,
            updated_at: update.updated_at,
            path: path,
            update_type: update.type,
            invited_name: update.type_data.name,
            is_contribution: is_contribution
        };
    },

    filterReactiveVar: function() {
        return Template.instance().updates.filter;
    }
});

/**
 * Updates events
 */
Template.app_partup_updates.events({
    'click [data-newmessage-popup]': function(event, template) {
        Partup.client.popup.open('new-message', function() {
            template.updates.updateView();
        });
    },
    'click [data-reveal-new-updates]': function(event, template) {
        template.updates.updateView();
    }
});
