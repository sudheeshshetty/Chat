var app = angular.module('myapp',['ngMaterial']);

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

app.controller('myController',['$scope','socket','$http','$mdDialog','$compile',function($scope,socket,$http,$mdDialog,$compile){
    $scope.users=[];
    $scope.friends=[];

    socket.on('handle', function(data) {
        $scope.user = data;
    });

    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('users', function(data) {
        $scope.$apply(function () {
            $scope.users=[];
            for(var i in data){
                if (i!=$scope.user){
                    $scope.users.push(i);
                }
            }
            console.log($scope.users);
        });
    });


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
            $http({method: 'POST',url:'http://localhost:8080/friend_request/confirmed', data:data, headers:{
                'Content-Type': 'application/json'
            }})
        }, function() {
            data['confirm']="No";

            $http({method: 'POST',url:'http://localhost:8080/friend_request/confirmed', data:data, headers:{
                'Content-Type': 'application/json'
            }})
        });
    };

    socket.on('message', function(data) {
        $scope.showConfirm(data);
    });

    socket.on('friend', function(data) {
        console.log("Connection Established"+data);
        $scope.$apply(function () {
            if (!$scope.friends.includes(data)){
                $scope.friends.push(data);
            }

        });
    });
    
    socket.on('friend_list', function(data) {
        console.log(data);
        $scope.$apply(function () {
            $scope.friends.push.apply($scope.friends,data);
        });
        console.log($scope.friends);
    });
    
    socket.on('pending_list', function(data) {

    });

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

    socket.on('private message', function(data) {        
        var div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg right">\
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-right">'+data.split("#*@")[2]+'</span>\
                        <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src="/views/dist/img/user3-128x128.jpg" alt="message user image">\
                        <div class="direct-chat-text">'
                        +data.split("#*@")[1]+
                        '</div>\
                        </div>';
        document.getElementById(data.split("#*@")[2]).appendChild(div);
        document.getElementById(data.split("#*@")[2]).scrollTop=document.getElementById(data.split("#*@")[2]).scrollHeight;        
    });

    $scope.send_message=function(chat,message){
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src="/views/dist/img/user1-128x128.jpg"\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop=document.getElementById(chat).scrollHeight;
        socket.emit('private message',chat+"#*@"+message+"#*@"+$scope.user);
        $scope.message=null;
    }

    $scope.confirm=function(){
        var data = {
            "friend_handle":$scope.friend,
            "my_handle":$scope.user
        };

        var config = {
            headers : {
                'Content-Type': 'application/json'
            }
        };

        $http({method: 'POST',url:'http://localhost:8080/friend_request', data:data, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    };
    
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
<button  ng-click="close_chat(\''+chat_friend+'\')" class="chat-header-button pull-right" type="button"><i class="glyphicon glyphicon-remove"></i></button>\
</div>\
</div>\
<div class="popup-messages">\
<div class="direct-chat-messages" id="'+chat_friend+'">\
</div>\
</div>\
<div class="popup-messages-footer">\
<textarea id="status_message" placeholder="Type a message..." rows="10" cols="40" ng-model="message" my-enter="send_message(\'{{'+chat_friend+'}}\',\'{{message}}\')"></textarea>\
<div class="btn-footer">\
<button class="bg_none"><i class="glyphicon glyphicon-film"></i> </button>\
<button class="bg_none"><i class="glyphicon glyphicon-camera"></i> </button>\
<button class="bg_none"><i class="glyphicon glyphicon-paperclip"></i> </button>\
<button class="bg_none pull-right" ng-click="send_message('+chat_friend+',message)"><i class="glyphicon glyphicon-thumbs-up"></i> </button>\
</div>\
</div>\
</div>';
        $compile(div)($scope);
        if(popups.length>1){
            document.getElementById(chat_friend+"01").className=document.getElementById(popups[popups.length-2]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
        }
        var body=document.getElementsByTagName("body")[0];
        body.appendChild(div);
        console.log($scope.friends);
//        $compile(body)($scope);
        popups.push(chat_friend);
        
    }
    console.log($scope.friends);
    //this is used to close a popup
    $scope.close_chat= function(chat_friend)
    {
        console.log(chat_friend);
        console.log(popups);
        for(var iii = 0; iii < popups.length; iii++)
        {
            if(chat_friend == popups[iii])
            {
                console.log("sss");
                document.getElementById(popups[popups.length-1]+"01").className=document.getElementById(popups[popups.length-1]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
                popups.splice(iii,1);
            }
        }   
    }
    
    //displays the popups. Displays based on the maximum number of popups that can be displayed on the current viewport width
    function display_popups()
    {
        document.getElementById(popups[popups.length-2]+"01").className=document.getElementById(popups[popups.length-2]+"01").className.replace(/(?:^|\s)popup-box-on(?!\S)/g , '');
        document.getElementById(popups[popups.length-1]+"01").className += "popup-box-on";
    }
    
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
