const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
require('dotenv').config()
// middleware 
app.use(express.json())
app.use(cors())

const verifyJWT = (req, res, next) => {
    const header = req.headers.authorization
    console.log(header)
    if (!header) {
        const error = res.status(401).send({ message: 'Unauthorized Access' })
        console.log(error)
        return
    }
    const token = header.split(' ')[1]
    console.log('token', token)
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
        if (err) {
            console.log('from error')
            console.log(token)
            return res.status(403).send({ message: 'forbidden Access' })
        }
        req.decode = decode
        next()
    })

}

const uri = `mongodb+srv://${process.env.WARE_HOUSE}:${process.env.WARE_PASSWORD}@cluster0.7iv30.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect()
        const serviceCollection = client.db('wareHouse').collection('service')
        // get service data 
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const result = await cursor.limit(6).toArray()
            res.send(result)
        })
        // get all service data 
        app.get('/services', verifyJWT, async (req, res) => {
            const page = Number(req.query.page)
            const count = Number(req.query.count)
            // console.log(req.headers.authorization)
            const email = req.query.email
            console.log(email)
            if (email === req.decode.email) {
                const query = {}
                const cursor = serviceCollection.find(query)
                const result = await cursor.skip(page * count).limit(count).toArray()
                res.send(result)
            }else{
                res.send({message:'Forbidden access'})
            }
        })
        // get all services count data 
        app.get('/serviceCount', async (req, res) => {
            const result = await serviceCollection.estimatedDocumentCount()
            res.send({ result })
        })
        //get single data 
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })
        // filter by email 
        app.get('/myItems', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const page = Number(req.query.page)
            const size = Number(req.query.size)
            const cursor = serviceCollection.find(query)
            const result = await cursor.skip(page * size).limit(size).toArray()
            res.send(result)
           
        })
        app.get('/myItemsCount', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const cursor = serviceCollection.find(query)
            const result = await cursor.count()
            res.send({ result })
            console.log({ result })
        })
        // update data 
        app.put('/service/:id', async (req, res) => {
            const id = req.params.id
            const body = req.body.quantity
            const options = { upsert: true };
            const query = { _id: ObjectId(id) }
            const doc = {
                $set: {
                    quantity: body
                }
            }
            const result = await serviceCollection.updateOne(query, doc, options)
            res.send(result)
            console.log(result)
        })
        // add data 
        app.post('/service', async (req, res) => {
            const body = req.body
            const result = await serviceCollection.insertOne(body)
            res.send(result)
        })
        // delete data 
        app.post('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
            console.log(req.params)
        })

        // jwt token validation 
        app.post('/login', async (req, res) => {
            const user = req.body
            console.log(user)
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            })
            res.send({ accessToken })
            console.log('from access token',accessToken)
        })
    } finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('server connected')
})

app.listen(port, () => {
    console.log('server running on', port)
})