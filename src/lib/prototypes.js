String.prototype.parameterize = function() {
    return this.trim().replace(/[^a-zA-Z0-9-\s]/g, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

String.prototype.isValidEmail = function() {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(this);
}

String.prototype.nl2br = function() {
    return (this + '')
        .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br/>' + '$2');
}

String.prototype.toLightUserColor = function() {
    var colors = ['#ECD1FF', '#FFD1CB', '#D6E4FF', '#FFE0A8', '#D9EC9A', '#BBF4C9', '#ECE37E', '#C0FCFA', '#FFD0F2', '#E3DFF4'],
        userUUIDWithoutLetters = this.replace(/\D/g,'');

    return colors[(userUUIDWithoutLetters * 7) % 10];
}

String.prototype.toDarkUserColor = function() {
    var colors = ['#8545B1', '#D15C4C', '#3B6CC4', '#F57E01', '#83A500', '#00A261', '#AB9500', '#00ADC0', '#CA38A3', '#7A758E'],
        userUUIDWithoutLetters = this.replace(/\D/g,'');

    return colors[(userUUIDWithoutLetters * 7) % 10];
}

String.prototype.toVersionObject = function() {
    if (!(this instanceof String)) { return false; }
    var x = this.split('.');
    // parse from string or default to 0 if can't parse
    var maj = parseInt(x[0]) || 0;
    var min = parseInt(x[1]) || 0;
    var pat = parseInt(x[2]) || 0;
    return {
        major: maj,
        minor: min,
        patch: pat
    }
}

String.toHex = function(n) {
    n = n || 16;
    var result = '';
    while (n--){
        result += Math.floor(Math.random()*16).toString(16).toUpperCase();
    }
    return result;
}

String.UUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

export const foo = 'foo'