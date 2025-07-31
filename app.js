//Settings for express server
import express from 'express'
const app = express()
const port = 3000

//Settings for csv file editing
import fs from 'fs'
import { parse } from 'csv-parse'
const __dirname = new URL(".", import.meta.url).pathname
import os from 'os'

//Updating CSV
app.get('/update', (req, res) => {

    new Promise((resolve, reject) => {

        fs.appendFile(
            `${__dirname}/empty.csv`,
            [
                "1", "2", "3", "4", "5",
                "6", "7", "8", "9", "10",
                "11", "12", "13", "14", "15"
            ].join(",") + os.EOL,
            "utf8",
            (err) => {

                if(err) { reject(err) }

                resolve()

            }
        )

    }).then(() => {

        res.send('asdf')

    },() => {

        res.send('err')

    })

})


//Fetching CSV as JSON
app.get('/fetch', (req, res) => {    

    new Promise((resolve, reject) => {

        fs.readFile(`${__dirname}/empty.csv`, (err, data) => {

            if (err) { reject(err) }
    
            parse(data, {
    
                columns: true,
                skip_empty_lines: true
    
            }, (err, records) => {
    
                if (err) { reject(err) }
    
                resolve(records) //this goes to .then as 'parsed'
    
            })
    
        })

    }).then(parsed => {

        res.send(JSON.stringify(parsed))

    }, rejected => {

        res.send(JSON.stringify(rejected))

    })

})

app.listen(port, () => {

    console.log(`server is listening at http://localhost:${port}`)

})