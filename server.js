import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs'

let participants = [];
let messages = [];

const app = express();
app.use(express.json());

var corsOptions = {
    origin: '*',
}
app.use(cors(corsOptions));

app.post('/participants', (req,res) => {
    const participant = req.body.name;
    console.log(participant)

    if(participant && !participants.some(({name}) => name === participant)) {
        participants.push({name: participant, lastStatus: Date.now()})
        messages.push({from: participant, to: 'Todos', text: 'entra na sala', type: 'status', time: dayjs().format('HH:mm:ss')})

        return res.sendStatus(200)
    }
    res.sendStatus(400)
})

app.get('/participants', (req,res) => {
    res.send(participants)
})

app.post('/messages', (req,res) => {
    const message = req.body
    const {to, text, type} = message
    const from = req.header("User")

    if(to && text && ["message", "private_message"].includes(type) && participants.find(({name}) => name === from)) {
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