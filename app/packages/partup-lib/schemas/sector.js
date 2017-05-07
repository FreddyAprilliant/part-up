/**
 * Base Sector schema
 * @name sectorBaseSchema
 * @memberof Partup.schemas
 * @private
 */
var sectorBaseSchema = new SimpleSchema({
    _id: {
        type: String,
        max: 150
    }
});

/**
 * Sector entity schema
 * @name sector
 * @memberof Partup.schemas.entities
 */
Partup.schemas.entities.sector = new SimpleSchema([sectorBaseSchema, {
    //
}]);

/**
 * sector form schema
 * @name sector
 * @memberof Partup.schemas.forms
 */
Partup.schemas.forms.sector = new SimpleSchema([sectorBaseSchema, {
    /**
     * @desc The name of which the sector should be identified by, therefore it should be unique.
     * @member {String}
     */
    name: {
        type: String,
        max: 150
    },
    /**
     * @desc The correspondent PhraseApp key to display a localized version of 'name'
     * @member {String}
     */
    phrase_key: {
        type: String,
        max: 150
    }
}]);
