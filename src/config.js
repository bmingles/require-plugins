var require = {
  // baseUrl: '/src',

  // bundles: {
  //   'src/bundles/moment-v1': ['moment'],
  //   'src/bundles/react-v1': ['react']
  // }
  map: {
    '*': {
      'moment': 'lazy!src/bundles/moment-v1',
      'react': 'lazy!src/bundles/react-v1'
    }
  }
}