Package.describe({
    name: 'partup-client-admin-sectors',
    version: '0.0.1',
    summary: '',
    documentation: null
});

Package.onUse(function(api) {
    api.use([
        'partup-lib'
    ], ['client', 'server']);

    api.use([
        'templating',
        'aldeed:autoform',
        'reactive-dict'
    ], 'client');

    api.addFiles([

        'AdminSectors.html',
        'AdminSectors.js',
        '_EditSector.html',
        '_EditSector.js'

    ], 'client');

});
