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
            "chat":null
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

        //                    models.user.update({"handle":handle},{'$set':{'connection_id':socket.id,}},function(err,doc){
        //                        if (err){ return res.send(500, { error: err });}
        //                        else{
        //                            console.log("succesfully saved"+socket.id);
        //                        }
        //                    })
//        models.online.create({"handle":handle,"connection_id":socket.id},function(err,doc){
//            if(err) res.json(err);
//            else{
//                console.log("inside create");
//                models.online.find({},function(err,doc){
//                    if(err){res.json(err);}
//                    else {io.emit('chat message',doc);
//                         io.emit('self',{"handle":handle,"connection_id":socket.id});
//                         } 
//                });
//            }
//        });
        
        users[handle]=socket.id;
        keys[socket.id]=handle;
        console.log(users);
        io.emit('users',users);
        

//        private=function(data){
//            console.log("In here  "+data.my_handle+" "+data.friend_handle+socket.id);
//            ev=data.my_handle+" "+data.friend_handle;
//            socket.on(ev,function(msg){
//                console.log("still in");
//                console.log('private  :'+msg);
//                io.emit(data.my_handle+" "+data.friend_handle,msg);
//            });
//        };
//
        socket.on('private message',function(msg){
            console.log('message  :'+msg.split("#*@")[0]);
            io.to(users[msg.split("#*@")[0]]).emit('private message', msg.split("#*@")[1]);
        });
//        socket.on('depart', function(doc) {
//            delete users[doc];
//            io.emit('users',users);
//        });
        socket.on('disconnect', function(){
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);
            console.log(users);
//            models.online.remove({"connection_id":socket.id},function(err,doc){
//                if(err) res.json(err);
//                else{
//                    console.log("inside remove");
//                    models.online.find({},function(err,doc){
//                        if(err){res.json(err);}
//                        else {io.emit('chat message',doc);} 
//                    });
//                }
//            });
        });
    });
    
    app.post('/friend_request',function(req,res){
        console.log("confirm");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        console.log("body"+req.body.my_handle);
        models.user.update({
            handle:req.body.my_handle
        },{
            $set:{
                friends:{
                    name: req.body.friend_handle,
                    status: "Pending"
                }
            }
        },{upsert:true},function(err,doc){
            if(err){res.json(err);}
            else{
                console.log(doc);
            }
        });
        console.log(users[req.body.friend_handle]);
        io.to(users[req.body.friend_handle]).emit('message', req.body);
        res.send("Sent");
    });
    
    app.post('/friend_request/confirmed',function(req,res){
        console.log(req.body);
        if(req.body.confirm=="Yes"){
        models.user.update({"handle":req.body.my_handle},{'$set':{'friends':{"name":req.body.friend_handle,"status":"Friend"}}},{upsert:true},function(err,doc){
            if(err){res.json(err);}
            else{

                console.log("Inside yes confirmed");
//                private(req.body);
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