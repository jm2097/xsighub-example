export const environment = {
    production: true,
    xsighub: {
        api: 'https://xsighub.azurewebsites.net/api',
        version: 'v=1.0',
        socketIO: {
            namespaces: {
                sessions: 'https://xsighub.azurewebsites.net/sessions',
            },
        },
    },
};
