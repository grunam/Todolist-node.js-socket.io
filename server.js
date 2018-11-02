
var todolist = []; 
var connectedUsers = [];


var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://tiabnamik:lI20obpPKFbFSWyy@cluster0-bj2hr.mongodb.net/todolist?retryWrites=true";
MongoClient.connect(uri,  { useNewUrlParser: true }, function(err, client) {
    if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('Connected to MongoDB Atlas database...');
    var collection = client.db("todolist").collection("tasks");
   // perform actions on the collection object

});

var express = require('express'),
 app = express(),  
 server = require('http').createServer(app),
 io = require('socket.io')(server),
 ent = require('ent'),
 session = require("express-session"),
 MongoDBStore = require('connect-mongodb-session')(session),
 sharedsession = require("express-socket.io-session");
 
var store = new MongoDBStore(
  {
    uri: 'mongodb+srv://tiabnamik:lI20obpPKFbFSWyy@cluster0-bj2hr.mongodb.net/todolist?retryWrites=false',
    databaseName: 'todolist',
    collection: 'sessions'
  });
 
store.on('connected', function() {
  store.client; // The underlying MongoClient object from the MongoDB driver
});
 
// Catch errors
store.on('error', function(error) {
  console.log(error);
  
}); 
 
var usedSession =  session({
  secret: 'my-secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true
});

app.use(express.static('./'))
.use(usedSession)
.get('/', function(req, res){
     res.sendFile(__dirname + '/index.html');
 })
.use(function(req, res, next){
   res.redirect('/');         
});
 
io.use(sharedsession(usedSession, {
    autoSave:true
})); 
 
io.on('connection', function(socket){
    
    socket.emit('loadTodolist', todolist);

     socket.on("login", function(data) {
        pseudo = ent.encode(data.pseudo);
        socket.handshake.session.userdata = pseudo;
        //socket.handshake.session.save();
        socket.broadcast.emit('messageLog', {pseudo: socket.handshake.session.userdata, message: '<u>logged in !</u>'});
        connectedUsers.push(pseudo);
        io.sockets.emit('connectedUsersList', connectedUsers);
    });
   
     socket.on('add', function(newtodo){
        newtodo = ent.encode(newtodo);
        todolist.push(newtodo);
        socket.broadcast.emit('add', {pseudo: socket.handshake.session.userdata, task: newtodo});
     })
     
     socket.on('remove', function(id){
         todolist.splice(id, 1);
         socket.broadcast.emit('remove', {pseudo: socket.handshake.session.userdata, task: id});
     })
     
     socket.on('disconnect', function() {
        if (socket.handshake.session.userdata) {
            socket.broadcast.emit('messageLog', {pseudo: socket.handshake.session.userdata, message: '<u>logged out !</u>'});
            connectedUsers.splice(connectedUsers.indexOf(socket.handshake.session.userdata), 1);
            socket.broadcast.emit('connectedUsersList', connectedUsers);
            delete socket.handshake.session.userdata;
            //socket.handshake.session.save();
        }
    });  
 
}); 

var PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});