// Get the http://localhost:8000/openapi.json file and write it to openapi.json

const axios = require('axios')
const fs = require('fs')

axios.get('http://127.0.0.1:8000/api/openapi.json').then(res => {
    fs.writeFileSync('openapi.json', JSON.stringify(res.data))
})

fs.rmSync('src/api-docs', { recursive: true, force: true })
