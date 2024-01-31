const express = require("express");
const app = express();
const server = require("http").createServer(app);
const socket = require("socket.io");
const cors = require("cors");

const corsOptions = {
  origin: ["http://localhost:4444", "http://192.168.0.169:4444"],
  methods: ["GET", "POST", "DELETE", "PUT"],
  headers: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
const io = socket(server, { cors: corsOptions });

const users = {};

io.on("connection", (socket) => {
  socket.on("signin", (data) => {
    console.log("signin: ", data);
    users[data.userId] = socket.id;
    socket.broadcast.emit("userConnected", data.userId);
    console.log("users: ", users);
    const usersList = Object.keys(users).filter((id) => id !== data.userId);
    socket.emit("users", usersList);
  });

  socket.on("mssg", (data) => {
    console.log("mssg: ", data);
    const receiverSocketId = users[data.receiverId];
    console.log("=======================================================");
    console.log("senderSocketId: ", socket.id);
    console.log("receiverSocketId: ", receiverSocketId);

    if (receiverSocketId) {
      console.log(
        `message should be sent to ${data.receiverId} : ${receiverSocketId}  > ${data.message}`
      );
      io.to(receiverSocketId).emit("message", {
        senderId: data.senderId,
        message: data.message,
      });
    }
    console.log("=======================================================");

    // socket.to(data.receiverId).emit("message", {
    //   senderId: data.senderId,
    //   message: data.message,
    // });
  });

  socket.on("active", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    const disconnectedUser = Object.keys(users).find(
      (key) => users[key] === socket.id
    );
    if (disconnectedUser) {
      console.log("disconnected user: ", disconnectedUser);
      delete users[disconnectedUser];
    } else {
      console.warn("disconnected user not found: ", socket.id);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Welcome surya");
});

server.listen(process.env.PORT || 3000, () => {
  console.log("server is running");
});
