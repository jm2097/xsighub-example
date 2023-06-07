export const environment = {
  production: true,
  xsighub: {
    api: 'http://localhost:3000/api',
    version: 'v=1.0',
    socketIO: {
      namespaces: {
        sessions: 'ws://localhost:3000/sessions',
      },
    },
  },
};
