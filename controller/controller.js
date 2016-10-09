var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');

module.exports = function (app,io){
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({     
        extended: true
    }));
    
    app.get('/',function(req,res){
        res.sendFile(path.resolve(__dirname+"/../views/index.html"));
    });
    
    app.post('/register',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        var user={
            "name":req.body.name,
            "handle":req.body.handle,
            "phone":req.body.phone,
            "email":req.body.email,
        };
        console.log(user);
        
        models.user.findOne({"handle":req.body.handle},function(err,doc){
            if(err){
                res.json(err); 
            }
            if(doc == null){
                models.user.create(user,function(err,doc){
                    if(err) res.json(err);
                    else{
                        res.send("success");
                    }
                });
            }else{
                res.send("User already found");
            }
        })
        
    });
    
    
    var handle=null;
    var private=null;
    var users={};
    var keys={};
    app.get('/login',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.query.handle;
        models.user.findOne({"handle":handle},function(err,doc){
            if(err){
                res.json(err); 
            }
            if(doc==null){
                res.send("User has not registered");
            }
            else{
                res.sendFile(path.resolve(__dirname+"/../views/chat1.html"));
            }
            
    });
    });
    
    io.on('connection',function(socket){
        console.log("User is connected  "+handle);
        console.log(socket.id);
        io.to(socket.id).emit('handle', handle);
        models.user.find({"handle" : handle},{friends:1,_id:0},function(err,doc){
            if(err){res.json(err);}
            else{
                list=doc[0].friends.slice();
                console.log(list);
                friends=[];
                pending=[];
                for(var i in list){
                    if(list[i].status=="Friend"){
                        friends.push(list[i].name);
                    }
                    else if (list[i].status=="Pending"){
                        pending.push(list[i].name);
                    }
                    else{
                        continue;
                    }
                }
                console.log(friends);
                console.log(pending+"pending");
                io.to(socket.id).emit('friend_list', friends);
                io.to(socket.id).emit('pending_list', pending);
            }
        });
        
        users[handle]=socket.id;
        keys[socket.id]=handle;
        console.log(users);
        io.emit('users',users);
        socket.on('private message',function(msg){
            console.log('message  :'+msg.split("#*@")[0]);
            io.to(users[msg.split("#*@")[0]]).emit('private message', msg);
        });
        
        socket.on('disconnect', function(){
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);
            console.log(users);
        });
    });
    
    app.post('/friend_request',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        models.user.update({
            handle:req.body.my_handle
        },{
            $push:{
                friends:{
                    name: req.body.friend_handle,
                    status: "Pending"
                }
            }
        },{upsert:true},function(err,doc){
            if(err){res.json(err);}
//            else{
//                console.log(doc);
//            }
        });
        io.to(users[req.body.friend_handle]).emit('message', req.body);
    });
    
    app.post('/friend_request/confirmed',function(req,res){
        console.log(req.body);
        if(req.body.confirm=="Yes"){
        models.user.update({
            "handle":req.body.my_handle,
            "friends.name":req.body.friend_handle
        },{
            '$set':{
                "friends.$.status":"Friend"
            }
        },function(err,doc){
            if(err){res.json(err);}
            else{

                console.log("Inside yes confirmed");
                io.to(users[req.body.friend_handle]).emit('friend', req.body.my_handle);
                io.to(users[req.body.my_handle]).emit('friend', req.body.friend_handle);
            }
        });}
        else{
            
            console.log("Inside No confirmed");
        models.user.update({"handle":req.body.my_handle},{'$set':{'friends':{"name":req.body.friend_handle,"status":"Rejected"}}},{upsert:true},function(err,doc){
            if(err){res.json(err);}
            else{
                console.log("No");
            }
        });}
    });
    
}