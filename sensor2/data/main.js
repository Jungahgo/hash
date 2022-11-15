var now;
var startTime = null;
var sensor;

function sleep(ms) {
    const wakeUpTime = Date.now() + ms;
    while (Date.now() < wakeUpTime) {}
}

function modifyNumber(time){
    if(parseInt(time) < 10){
        return "0" + time;
    }
    return time;
}

function getEvent() {
    if (!!window.EventSource) {
        var source = new EventSource('/events');
        source.addEventListener('open', function(e) {
        console.log("Events Connected");
        }, false);
    
        source.addEventListener('update', function(e) {
            sensor = e.data;
            var sen_print;
            if(sensor == 0) sen_print = "not sit";
            else if(sensor == 1) sen_print = "sit";
            document.getElementById("sensor_val").innerHTML = sen_print;
        }, false);
    }
    
    document.getElementById("time").innerHTML = "00" + ":" + "00";

    if(sensor > 0){
        if (startTime == null) startTime = Date.now();
        //console.log(startTime);
         
        now = Date.now();
        //console.log(now);

        time = parseInt((now-startTime)/1000);
        sec = modifyNumber(time % 60);
        min = modifyNumber(parseInt(time / 60));
        document.getElementById("time").innerHTML = min + ":" + sec;

        if(time > 10){
            startTime = null;
            location.href = 'https://resonant-choux-15ccca.netlify.app/';
        }
    }
    if(sensor == 0 && startTime != null) {
        startTime = null;
        document.getElementById("time").innerHTML = "00" + ":" + "00";
    }
    sleep(100);

    window.requestAnimationFrame(getEvent);
}

window.requestAnimationFrame(getEvent);