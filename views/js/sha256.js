angular.module('angular-encryption', [])

    .service("sha256", function() {
    this.hash =function(str){
        h = 7;
        letters = "abcdefghijklmnopqrstuvwxyz-_1234567890@!#$%&*.,"
        for (var i=0;i<str.length;i++){
            h = (h * 37 + letters.index(s[i]))
        }
        return h
    }
});