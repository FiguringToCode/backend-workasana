const { initializeDatabase } = require('./db/db.connect')
const Task = require('./models/tasks.model')
const Team = require('./models/team.model')
const Project = require('./models/project.model')
const User = require('./models/user.model')
const Tag = require('./models/tag.model')

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

initializeDatabase()

const SECRET_KEY = "supersecretadmin"
const JWT_SECRET = "jwt_secret"
const saltRounds = 10 
// Salt Rounds in bcrypt indicates the cost factor i.e the number of iterations bcrypt uses to process the password hashing. Higher salt rounds make the hashing more secure but also more computationally expensive, usually a value between 10 and 12 is standard for balancing security and performances.

app.use(express.json())

const cors = require('cors')
const corsOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200
}

app.use(cors(corsOptions))


const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization']

    if(!authHeader){
        return res.status(401).json({message: "No token provided."})
    }
    const token = authHeader.split(' ')[1]

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET)
        req.user = decodedToken
        console.log(req.user)
        next()

    } catch (error) {
        return res.status(402).json({message: "Invalid token."})
    }

}



app.post('/admin/login', (req, res) => {
    const {secret} = req.body

    if(secret === SECRET_KEY){
        const token = jwt.sign({role: "admin"}, JWT_SECRET, {expiresIn: "24h"})
        res.json({token, message: "Access Granted"})
    }
    else {
        res.json({message: "Invalid Secret"})
    }
})



// User SignUp
app.post('/user/signup', async (req, res) => {
    const {username, password, email} = req.body
    try {
        const userExists = await User.findOne({username: username})
        if(userExists){
            return res.status(400).json({error: "Username already exists"})
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const user = new User({username, password: hashedPassword, email})
        await user.save()
        res.status(201).json({message: "User registered successfully"})

    } catch (error) {
        res.status(500).json({error: error.message})
    }
})



// User Login
app.post('/user/login', async (req, res) => {
    const { username, password } = req.body
    try {
        const user = await User.find({username: username})
        if(!user){
            return res.status(401).json({error: "Invalid username"})
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if(!isPasswordMatch){
            return res.status(401).json({error: "Invalid password"})
        }
        
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {expiresIn: "24h"})
        res.json({token, message: "Login successful"})

    } catch (error) {
        res.status(500).json({error: error.message})
    }
})



const createNewTask = async (newTask) => {
    try {
        const task = new Task(newTask)
        return await task.save()

    } catch (error) {
        throw error
    }
}

app.post('/tasks', verifyJWT, async (req, res) => {
    console.log(req.body)
    try {
        const tasks = await createNewTask(req.body)
        tasks ? 
        res.status(201).json({message: 'Task added successfully', task: tasks})
        :
        res.status(400).json({error: 'Error adding new task'})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const getAllTasks = async () => {
    try {
        const tasks = await Task.find()
        .populate('project')
        .populate('team')
        .populate('owners')
        return tasks
        
    } catch (error) {
        throw error
    }
}

app.get('/tasks', verifyJWT, async (req, res) => {
    try {
        const allTasks = await getAllTasks()
        allTasks.length > 0 ? res.json(allTasks) : res.status(400).json({error: "Tasks not found."})
        
    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const updateStatusById = async (taskId, dataToUpdate) => {
    try {
        const updateStatus = await Task.findByIdAndUpdate(taskId, dataToUpdate, {new: true})
        return updateStatus
    } catch (error) {
        throw error
    }
}

app.post('/tasks/status/:taskId', verifyJWT, async(req, res) => {
    try {
        const updatedStatus = await updateStatusById(req.params.taskId, req.body)
        updatedStatus ? res.status(200).json({message: "Status updated successfully.", updatedStatus: updatedStatus}) : res.status(400).json({message: "Unable to update status."})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const createNewProject = async (newProject) => {
    try {
        const project = new Project(newProject)
        return await project.save()

    } catch (error) {
        throw error
    }
}

app.post('/project', verifyJWT, async (req, res) => {
    console.log(req.body)
    try {
        const project = await createNewProject(req.body)
        project ? res.status(200).json({message: "Project added successfully"})
        :
        res.status(400).json({error: "Error adding new project"})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const getAllProjects = async () => {
    try {
        const projects = await Project.find()
        return projects

    } catch (error) {
        throw error
    }
}

app.get('/projects', verifyJWT, async (req, res) => {
    try {
        const project = await getAllProjects()
        project.length > 0 ? res.json(project) : res.status(400).json({error: "Project not found", })

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const createNewTeam = async (newTeam) => {
    try {
        const team = new Team(newTeam)
        return await team.save()

    } catch (error) {
        throw error
    }
}

app.post('/teams', verifyJWT, async (req, res) => {
    console.log(req.body)
    try {
        const team = await createNewTeam(req.body)
        team ? res.status(200).json({message: "Team added succesfully"})
        :
        res.status(400).json({error: "Error adding new team."})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const getAllTeams = async () => {
    try {
        const teams = await Team.find()
        return teams

    } catch (error) {
        throw error
    }
}

app.get('/teams', verifyJWT, async (req, res) => {
    try {
        const teams = await getAllTeams()
        teams.length > 0 ? res.json(teams) : res.status(400).json({error: "Teams not found"})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const createNewUser = async (newUser) => {
    try {
        const user = new User(newUser)
        return await user.save()

    } catch (error) {
        throw error
    }
}

app.post('/user', verifyJWT, async (req, res) => {
    console.log(req.body)
    try {
        const user = await createNewUser(req.body)
        user ? res.status(200).json({message: "User added successfully"})
        :
        res.status(400).json({error: "Error adding new user"})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const getUserById = async (userId) => {
    try {
        const userById = await User.findById(userId)
        return userById

    } catch (error) {
        throw error
    }
}

app.get('/user/:userId', verifyJWT, async (req, res) => {
    try {
        const userById = await getUserById(req.params.userId)
        userById ? res.json(userById) : res.status(400).json({error: "Not found user by id"})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})



const createNewTag = async (newTag) => {
    try {
        const tag = new Tag(newTag)
        return await tag.save()

    } catch (error) {
        throw error
    }
}

app.post('/tag', verifyJWT, async (req, res) => {
    console.log(req.body)
    try {
        const tag = await createNewTag(req.body)
        tag ? res.status(200).json({message: "Tag added successfully"})
        :
        res.status(400).json({error: "Error adding tag"})

    } catch (error) {
        res.status(404).json({error: error.message})
    }
})





const PORT = 3000
app.listen(PORT, () => {
    console.log("Server connected to port", PORT)
})
