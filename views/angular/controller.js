var app = angular.module('myapp',['ngMaterial','ui.router','ngStorage']);

app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();

    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider){
    $urlRouterProvider.otherwise('/');
    $stateProvider
    .state('login',{
        url:'/',
        views:{
            'body':{
                templateUrl:'/views/login.html',
                controller:'registerController'
            }
        }
    })
    .state('loggedin',{
        url:'/login',
        views:{
            'body':{
                templateUrl:'/views/chat.html',
                controller:'myController'
            }
        }
    })
}]);




app.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});


app.controller('myController',['$scope','socket','$http','$mdDialog','$compile','$location','$state','$localStorage', '$sessionStorage',function($scope,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){
    url= location.host;
    $scope.users=[];
    $scope.online_friends=[];
    $scope.allfriends=[];
    $scope.messages={};
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('handle', function(data) {
        $scope.user = data;
        console.log("Get handle : "+$scope.user);
    });

    

    socket.on('friend_list', function(data) {
        console.log("Friends list : "+data);
        $scope.$apply(function () {
            $scope.allfriends.push.apply($scope.allfriends,data);
        });
        console.log("Friends list : "+$scope.allfriends);
    });

    socket.on('pending_list', function(data) {

    });

    socket.on('users', function(data) {
        console.log("users list : "+data);
        $scope.$apply(function () {
            $scope.users=[];
            $scope.online_friends=[];
            for(var i in data){
                console.log("users list : "+i);
                if (i!=$scope.user){
                    console.log(i);
                    console.log("users list : "+$scope.allfriends);
                    if ( $scope.allfriends.includes(i) ){
                        $scope.online_friends.push(i);
                    }
                    else{
                        $scope.users.push(i);                        
                    }
                    
                }
            }
            console.log("users list : "+$scope.allfriends);
            console.log("users list : "+$scope.users);
            console.log("users list : "+$scope.online_friends);
        });
    });
    
    $scope.confirm=function(){
        var data = {
            "friend_handle":$scope.friend,
            "my_handle":$scope.user
        };

//        var config = {
//            headers : {
//                'Content-Type': 'application/json'
//            }
//        };

        $http({method: 'POST',url:'http://'+url+'/friend_request',data})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    };
    
    $scope.showConfirm = function(data) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
        .title(" connection request ")
        .textContent(data.my_handle+' wants to connect.Do you want to Connect?')
        .ariaLabel('Lucky day')
        .ok('Ok')
        .cancel('No');

        $mdDialog.show(confirm).then(function() {
            data['confirm']="Yes";
            $http({method: 'POST',url:'http://'+url+'/friend_request/confirmed', data//, headers:{
                //'Content-Type': 'application/json'
            //}
            })
        }, function() {
            data['confirm']="No";

            $http({method: 'POST',url:'http://'+url+'/friend_request/confirmed', data//, headers:{
            //    'Content-Type': 'application/json'
            //}
            })
        });
    };

    socket.on('message', function(data) {
        $scope.showConfirm(data);
    });

    socket.on('friend', function(data) {
        console.log("Connection Established"+data);
        $scope.$apply(function () {
            if (!$scope.online_friends.includes(data)){
                console.log(data);
                $scope.online_friends.push(data);
                $scope.users.splice($scope.users.indexOf(data),1);
            }

        });
    });
//    
//    socket.on('all_friend_list', function(data) {
//        $scope.$apply(function () {
//            $scope.allfriends.push.apply($scope.allfriends,data);
//        });
//    });
//    

    $scope.friend_request = function(user) {   
        $scope.friend = user;
    };

    var getDate=function(){
        date = new Date();
        hour=date.getHours();
        period="AM";
        if (hour>12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;        
    }
    
    
    socket.on('group', function(data) {
        var div = document.createElement('div');
        if(data.split("#*@")[1]!=$scope.user){
            div.innerHTML='<div class="direct-chat-msg right">\
                            <div class="direct-chat-info clearfix">\
                            <span class="direct-chat-name pull-right">'+data.split("#*@")[1]+'</span>\
                            <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                            </div>\
                            <img class="direct-chat-img" src="" alt="message user image">\
                            <div class="direct-chat-text">'
                            +data.split("#*@")[0]+
                            '</div>\
                            </div>';
            document.getElementById("group").appendChild(div);
            document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        }
    });
    
    $scope.group_message= function(message){
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src=""\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById("group").appendChild(div);
        document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        socket.emit('group message',message+"#*@"+$scope.user);
        $scope.groupMessage=null;
    }
    
    var insertMessage = function(from,to,msg){
        console.log(from + " " + to);
        if (to in $scope.messages){
            if ($scope.messages[to].length>25){
                $scope.messages[to].splice(0,1);
            }
        }
        else{
            $scope.messages[to]=[];
        }
        $scope.messages[to].push({
            "sender":from,
            "msg" : msg,
            "date" : getDate()  
        });
        localStorage.setItem(to,JSON.stringify($scope.messages[to]));
        localStorage.setItem(from,JSON.stringify($scope.messages[from]));
        console.log(localStorage.getItem(to));
    }

    socket.on('private message', function(data) {        
        var div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg right">\
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-right    ">'+data.split("#*@")[2]+'</span>\
                        <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src="" alt="message user image">\
                        <div class="direct-chat-text">'
                        +data.split("#*@")[1]+
                        '</div>\
                        </div>';
        var chat_box=document.getElementById(data.split("#*@")[2]);
        console.log(chat_box);
        if(chat_box!=null){
            chat_box.appendChild(div);
        }
        else{
            $scope.chat_popup(data.split("#*@")[2]);
            document.getElementById(data.split("#*@")[2]).appendChild(div);
        }
        insertMessage(data.split("#*@")[2],data.split("#*@")[2],data.split("#*@")[1]);
        document.getElementById(data.split("#*@")[2]).scrollTop=document.getElementById(data.split("#*@")[2]).scrollHeight;        
    });

    $scope.send_message=function(chat,message){
        console.log(chat);
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src=""\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop=document.getElementById(chat).scrollHeight;
        socket.emit('private message',chat+"#*@"+message+"#*@"+$scope.user+"#*@"+getDate());
        insertMessage($scope.user,chat,message);
        $scope.message=null;
    }

    
    popups=[];
    
    $scope.chat_popup = function(chat_friend){
        console.log(chat_friend);
        console.log(popups);
        for(var iii = 0; iii < popups.length; iii++)
        {   
            //already registered. Bring it to front.
            if($scope.chat_friend == popups[iii])
            {
                popups.splice(iii,1);

                popups.push(chatfriend);

                display_popups();
            }
        }
        
        console.log($scope.messages);
        console.log($scope.messages[chat_friend]);
//        for(var i=0; i<$scope.messages[chat_friend].length; i++){
//            console.log($scope.messages[chat_friend][i].sender);
//        }
        div = document.createElement('div');
        div.innerHTML='<div class="popup-box popup-box-on chat-popup" id="'+chat_friend+'01">\
                        <div class="popup-head">\
                        <div class="popup-head-left pull-left"><img alt="pic">'+chat_friend+'</div>\
                        <div class="popup-head-right pull-right">\
                        <div class="btn-group">\
                        <button class="chat-header-button" data-toggle="dropdown" type="button" aria-expanded="false">\
                        <i class="glyphicon glyphicon-cog"></i> </button>\
                        <ul role="menu" class="dropdown-menu pull-right">\
                        <li><a href="#">Block</a></li>\
                        <li><a href="#">Clear Chat</a></li>\
                        <li><a href="#">Email Chat</a></li>\
                        </ul>\
                        </div>\
                        <button  ng-click="close_chat(\''+chat_friend+'\')" class="chat-header-button pull-right" type="button">  <i class="glyphicon glyphicon-remove"></i></button>\
                        </div>\
                        </div>\
                        <div class="box-body popup-messages">\
                        <div class="direct-chat-messages" id="'+chat_friend+'" >\
                        </div>\
                        </div>\
                        <div class="popup-messages-footer">\
                        <textarea id="status_message" placeholder="Type a message..." rows="10" cols="40" ng-model="message" my-enter="send_message(\''+chat_friend+'\',\'{{message}}\')"></textarea>\
                        <div class="btn-footer">\
                        <button class="bg_none"><i class="glyphicon glyphicon-film"></i> </button>\
                        <button class="bg_none"><i class="glyphicon glyphicon-camera"></i> </button>\
                        <button class="bg_none"><i class="glyphicon glyphicon-paperclip"></i> </button>\
                        <button class="bg_none pull-right" ng-click="send_message('+chat_friend+',message)"><i class="glyphicon  glyphicon-thumbs-up"></i> </button>\
                        </div>\
                        </div>\
                        </div>';
        $compile(div)($scope);
        
        
        if(popups.length>1){
            document.getElementById(chat_friend+"01").className=document.getElementById(popups[popups.length-2]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
        }
        var body=document.getElementsByTagName("body")[0];
        body.appendChild(div);
        if(localStorage.getItem(chat_friend)!==null){
            $scope.messages[chat_friend] = JSON.parse(localStorage.getItem(chat_friend));
        }
        if($scope.messages[chat_friend] != undefined){
            for(var i=0; i<$scope.messages[chat_friend].length; i++){
                console.log($scope.messages[chat_friend][i].sender);
                if($scope.messages[chat_friend][i].sender==$scope.user){
                    div = document.createElement('div');
                    div.innerHTML='<div class="direct-chat-msg"> \
<div class="direct-chat-info clearfix">\
<span class="direct-chat-name pull-left">'+$scope.messages[chat_friend][i].sender+'</span>\
<span class="direct-chat-timestamp pull-right">'+$scope.messages[chat_friend][i].date+'</span>\
</div>\
<img class="direct-chat-img" src=""\ alt="message user image">\
<div class="direct-chat-text">'
    +$scope.messages[chat_friend][i].msg+
    '</div>\
</div>';
                    document.getElementById(chat_friend).appendChild(div);
                    document.getElementById(chat_friend).scrollTop=document.getElementById(chat_friend).scrollHeight;
                }
                else{
                    div = document.createElement('div');
                    div.innerHTML='<div class="direct-chat-msg right">\
<div class="direct-chat-info clearfix">\
<span class="direct-chat-name pull-right    ">'+$scope.messages[chat_friend][i].sender+'</span>\
<span class="direct-chat-timestamp pull-left">'+$scope.messages[chat_friend][i].date+'</span>\
</div>\
<img class="direct-chat-img" src="" alt="message user image">\
<div class="direct-chat-text">'
    +$scope.messages[chat_friend][i].msg+
    '</div>\
</div>';
                    document.getElementById(chat_friend).appendChild(div);
                    document.getElementById(chat_friend).scrollTop=document.getElementById(chat_friend).scrollHeight;
                }
            }
        }
        console.log($scope.online_friends);
//        $compile(body)($scope);
        popups.push(chat_friend);
        
    }
    
    
    //this is used to close a popup
    $scope.close_chat= function(chat_friend)
    {
        chat_box=null;
        console.log(chat_friend);
        console.log(popups);
        
        for(var iii = 0; iii < popups.length; iii++)
        {
            if(chat_friend == popups[iii])
            {
                console.log("sss");
//                document.getElementById(popups[popups.length-1]+"01").className=document.getElementById(popups[popups.length-1]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
                var chat_box=document.getElementById(popups[popups.length-1]+"01");
                chat_box.parentElement.removeChild(chat_box);
                popups.splice(iii,1);
            }
        }   
    }
//    
//    //displays the popups. Displays based on the maximum number of popups that can be displayed on the current viewport width
//    function display_popups()
//    {
//        document.getElementById(popups[popups.length-2]+"01").className=document.getElementById(popups[popups.length-2]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
//        document.getElementById(popups[popups.length-1]+"01").className += "popup-box-on";
//    }
    
}]);

app.service('encrypt', function() {
    this.hash =function(str){
        h = 7;
        letters = "abcdefghijklmnopqrstuvwxyz-_1234567890@!#$%&*.,"
        for (var i=0;i<str.length;i++){
            h = (h * 37 + letters.indexOf(str[i]))
        }
        return h
    }
});

app.controller('registerController',['$scope','encrypt','$http','$state',function($scope,encrypt,$http,$state){
    url= location.host;

    $scope.user={
        'name':'',
        'handle':'',
        'password':'',
        'email':'',
        'phone':''
    };

    $scope.login_data={
        'handle':'',
        'password':''
    };

    $scope.Register = function(){
        $scope.user.password=encrypt.hash($scope.user.password);

        $http({method: 'POST',url:'http://'+url+'/register', data:$scope.user})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    }

    $scope.login = function(){
        console.log("login");
        $scope.login_data.password=encrypt.hash($scope.login_data.password);
        console.log($scope.login_data);
        $http({ method: 'POST', url:'http://'+url+'/login', data:$scope.login_data })//, headers:config})
            .success(function (data) {
            if(data=="success"){
                console.log("Inside success login");
                $state.go('loggedin');
            }
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    }
}]);