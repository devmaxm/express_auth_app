const debug = require('debug')('exer:server')
const http = require('http')
const app = require('../app')

const PORT = parseInt(process.env.PORT) || 3000
const server = http.createServer(app)

server.listen(PORT)
server.on('error', onError)
server.on('listening', onListening)
console.log(`Server started on port: ${PORT}`)


function onError(error) {
    if(error.syscall !== 'listen') {
        throw error
    }

    var bind = typeof PORT === 'string'
        ? 'Pipe' + PORT : 'Port' + PORT

    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`)
            process.exit(1)
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`)
            process.exit(1)
            break
        default:
            throw error
    }
}

function onListening() {
    const addr = server.address()
    var bind = typeof PORT === 'string'
        ? 'Pipe' + PORT : 'Port' + PORT
    debug(`Listening on ${bind}`)
}
