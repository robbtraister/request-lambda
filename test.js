'use strict'

const { Lambda } = require('.')

const lambda = Lambda({
  FunctionName: 'arn:aws:lambda:us-east-1:397853141546:function:fusion-resolver-staging-fusion'
})

// lambda({
//   uri: '/resolve/arc-content-api/docs/guides/multisite.md'
// })
//   .then((data) => {
//     console.log(data)
//   })
//   .catch((err) => {
//     console.error(err)
//   })

lambda(
  {
    uri: '/resolve/arc-content-api/docs/guides/multisite.md'
  },
  (err, data) => {
    if (err) {
      console.error(err)
    } else {
      console.log(data)
    }
  }
)
