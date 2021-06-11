import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs'
import { stripHtml } from "string-strip-html";
import joi from 'joi'

let participants = [];
let messages = [];

const app = express();
app.use(express.json());

var corsOptions = {
    origin: '*',
}
app.use(cors(corsOptions));

function cleanData (body) {
    const objArray = Object.entries(body)       //transformar numa matriz
    const cleanArray = objArray.map(item => {   //percorrer a matriz com map 
        const [key, value] = item               //destructuring da array
        return [key, stripHtml(value.trim())]   //limpar a array criada executando stripHtml pra cada value do objeto inicial removendo os espaços em seguida
    })
    return Object.fromEntries(cleanArray)       //transforma a matriz em objeto de novo
}

app.post('/participants', (req,res) => {

    const schema = joi.object({
        name: joi.string().required()
    });
    const isValid = schema.validate(req.body);

    if(isValid.error) return res.sendStatus(422);
    
    const { name } = cleanData(req.body);

    if(!participants.some((item) => name === item.name)) {
        participants.push({name: name, lastStatus: Date.now()})
        messages.push({from: name, to: 'Todos', text: 'entra na sala', type: 'status', time: dayjs().format('HH:mm:ss')})

        return res.sendStatus(200)
    }
    res.sendStatus(400)
})

app.get('/participants', (req,res) => {
    res.send(participants)
})

app.post('/messages', (req,res) => {

    const schema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid(["message", "private_message"]).required()
    })

    const isValid = schema.validate(req.body);

    if(isValid.error) return res.sendStatus(422);

    const message = cleanData(req.body)
    const {to, text, type} = message
    const from = req.header("User")

    if(participants.find(({name}) => name === from)) {
        messages.push({...message, from})
        return res.sendStatus(200)
    }

    res.sendStatus(400)
})

app.get('/messages', (req,res) => {
    const limit = req.query.limit
    const user = req.header("User")

    const messagesFiltered = messages.filter(element => element.type === "messages" || element.to === user || element.from === user);

    limit
    ? res.send(messagesFiltered.slice(0, limit))
    : res.send(messagesFiltered)
})

app.post('/status', (req,res) => {
    const user = req.header("User")

    const participant = participants.find(({name}) => name === user)

        participant
        ? ((participant.lastStatus = Date.now()) && res.sendStatus(200))
        : res.sendStatus(400)
})

setInterval(() => {
    participants = participants.filter(element => {
        if (Date.now() - element.lastStatus < 10000) {
            return true
        }
        else {
            messages.push({from: element.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss')})
            return false
        }    
    })
}, 15000)

app.listen(4000)