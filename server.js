//TODO détecter fin du socket ou de la session (arrêt processus serveur)


var todolist = []; 
var connectedUsers = [];


var mongoose = require('mongoose');
var dateFormat = require('dateformat');

var uri = "mongodb+srv://tiabnamik:lI20obpPKFbFSWyy@cluster0-bj2hr.mongodb.net/todolist?retryWrites=true";


mongoose.connect(uri, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


var taskSchema = new mongoose.Schema({
  name : String,
  user: String,
  date : Date 
});


var taskModel = mongoose.model('task', taskSchema);
taskModel.find(null, function (err, result) {
  if (err) { 
      //throw err;
      console.log('Error occurred while finding all task from MongoDB Atlas...\n',err);
  }
 
  //console.log(result);
  if(result.length !== 0){
    (function(a){
        for (var i = 0, len = a.length; i < len; i++){
            todolist.push({id:a[i]['_id'],  name: a[i]['name'], user: a[i]['user'], date: dateFormat(a[i]['date'], "dddd, mmmm dS, yyyy, h:MM:ss TT") });   
        }
    })(result);
  }
  console.log('ma todolist: '+todolist);
  mongoose.connection.close();
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
  resave: false,
  saveUninitialized: false
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
    autoSave:false
})); 
 
io.on('connection', function(socket){
    
    console.log(todolist);
    socket.emit('loadTodolist', todolist);

     socket.on("login", function(data) {
        user = ent.encode(data.user);
        socket.handshake.session.userdata = user;
        socket.handshake.session.save();
        io.sockets.emit('messageLog', {user: socket.handshake.session.userdata, message: '<u>logged in !</u>'});
        connectedUsers.push(user);
        io.sockets.emit('connectedUsersList', connectedUsers);
    });
   
     socket.on('add', function(newtodo){
        newtodo = ent.encode(newtodo);
        var now = Date.now();
      
        mongoose.connect(uri, { useNewUrlParser: true });
        //mongoose.Promise = global.Promise;
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
        var myTask = new taskModel({name : newtodo, user: socket.handshake.session.userdata, date: now});
       
        myTask.save(function (err) {
            if (err) { 
               //throw err;
                console.log('Error occurred while saving task from MongoDB Atlas...\n',err);
            }
            console.log('task has been successfuly added !');
            // On se déconnecte de MongoDB maintenant
            mongoose.connection.close();
        });
        todolist.push({name : newtodo, user: socket.handshake.session.userdata, date: dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT") });
        console.log(todolist);
        io.sockets.emit('add', {name : newtodo, user: socket.handshake.session.userdata, date: dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT") });
     })
     
     socket.on('remove', function(id){
        mongoose.connect(uri, { useNewUrlParser: true });
        //mongoose.Promise = global.Promise;
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
        //var myTask = new taskModel({name : newtodo, user: socket.handshake.session.userdata, date: Date.now()});
       taskModel.findByIdAndDelete({_id:todolist[id].id}, function (err, result) {
          if (err) { 
              //throw err;
              console.log('Error occurred while removing task from MongoDB Atlas...\n',err);
          }
          console.log('task has been successfuly removed !');
          mongoose.connection.close();
        });
         todolist.splice(id, 1);
         console.log(todolist);
         io.sockets.emit('remove', {user: socket.handshake.session.userdata, task: id});
     })
     
     socket.on('disconnect', function() {
        if (socket.handshake.session.userdata) {
            socket.broadcast.emit('messageLog', {user: socket.handshake.session.userdata, message: '<u>logged out !</u>'});
            connectedUsers.splice(connectedUsers.indexOf(socket.handshake.session.userdata), 1);
            //socket.handshake.session.save();
            socket.broadcast.emit('connectedUsersList', connectedUsers);
            delete socket.handshake.session.userdata;
        }
    });  
 
}); 

var PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});
