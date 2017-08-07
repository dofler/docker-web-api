const { server } = require('./lib/server')
const port = process.env.PORT || 8080

server.listen(port, () => {
  console.log('Listening on port %s', port)
})
