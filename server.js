const express = require("express");
const app = express();
const server = require("http").createServer(app);
const socket = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const { connect } = require("mongoose");

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT"],
  headers: ["Content-Type", "Authorization"],
};
const MONGO_URI = `mongodb+srv://suryasarisa00:${process.env.MONGO_PASS}@surya.u197635.mongodb.net/mssgs?retryWrites=true&w=majority`;
connect(MONGO_URI).then(() => {
  console.log("connected to db");
});
app.use(cors(corsOptions));
const io = socket(server, { cors: corsOptions });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const users = {};

io.on("connection", (socket) => {
  // console.log("connected: ", socket.id);

  socket.on("addMySocket", (data) => {
    users[data.username] = socket.id;
    socket.broadcast.emit("userConnected", data.username);
    console.log("addMySocket: ", data.username);
  });

  socket.on("signin", async (data) => {
    console.log(data);
    const user = await User.findOne({
      _id: data.username,
      password: data.password,
    });

    try {
      delete data.password;
      delete user.password;
    } catch (err) {
      console.log(err);
    }

    if (!user)
      return socket.emit("signinError", "Invalid username or password");

    console.log("signin: ", data.username);
    users[data.username] = socket.id;
    const token = jwt.sign({ username: data.username }, process.env.JWT_SECRET);
    socket.emit("token", token);

    socket.broadcast.emit("userConnected", data.username);

    const usersList = Object.keys(users).filter((id) => id !== data.username);
    socket.emit("users", usersList);
  });

  socket.on("mssg", (data) => {
    console.log("mssg: ", data);
    const receiverSocketId = users[data.receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message", {
        senderId: data.senderId,
        message: data.message,
      });
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUser = Object.keys(users).find(
      (key) => users[key] === socket.id
    );
    if (disconnectedUser) {
      socket.broadcast.emit("userDisconnected", disconnectedUser);
      console.log("disconnected user: ", disconnectedUser);
      delete users[disconnectedUser];
    } else {
      // console.error("disconnected user not found: ", socket.id);
    }
  });
});

app.post("/signup", async (req, res) => {
  const { name, password, username } = req.body;
  console.log(req.body);
  if (!name || !password || !username) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const prvUser = await User.findById(username);
  if (prvUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const user = new User({ name, password, _id: username });
  await user.save();
  res.json({ message: "User created successfully" });
});

app.post("/status", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Invalid token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(400).json({ error: "Invalid token" });
    const usersList = Object.keys(users).filter((id) => id !== user.username);
    return res.json({
      status: "success",
      username: user.username,
      users: usersList,
    });
  });
});

app.get("/", (req, res) => {
  res.send("Welcome surya");
});

server.listen(process.env.PORT || 3000, () => {
  console.log("server is running");
});
