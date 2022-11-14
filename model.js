let URL = "./model/";
    let model, webcam, ctx, labelContainer, result, maxPredictions;
    let start_time;
    let end_time;
    let cur_status = "preparing";
    let cnt;
    let t; //동작 도전 시간
    let total = 4; //총 동작 수


    function checkNotificationPromise() {
        try {
          Notification.requestPermission().then();
        } catch(e) {
          return false;
        }
    
        return true;
      }

    //알림 권한 요청
    function askNotificationPermission() {
        console.log("askNotification");
        // 권한을 실제로 요구하는 함수
        function handlePermission(permission) {
          // 사용자의 응답에 관계 없이 크롬이 정보를 저장할 수 있도록 함
          if(!('permission' in Notification)) {
            Notification.permission = permission;
          }
      
          // 사용자 응답에 따라 단추를 보이거나 숨기도록 설정
          if(Notification.permission === 'denied' || Notification.permission === 'default') {
            notificationBtn.style.display = 'block';
          } else {
            notificationBtn.style.display = 'none';
          }
        }
      
        // 브라우저가 알림을 지원하는지 확인
        if (!('Notification' in window)) {
          console.log("이 브라우저는 알림을 지원하지 않습니다.");
        } else {
          if(checkNotificationPromise()) {
            Notification.requestPermission()
            .then((permission) => {
              handlePermission(permission);
            })
          } else {
            Notification.requestPermission(function(permission) {
              handlePermission(permission);
            });
          }
        }
      }

    async function init(){
        // 초기 함수    
        // 알림 허용 받기
        console.log("init");
        askNotificationPermission();

        initCam();

    }

    async function initCall(){
        var text = "척추 요정~";
        var notification = new Notification('할 일 목록', { body: text});
        setTimeout(notification.close.bind(notification), 4000);
        
    }

    async function initCam(){
        console.log("initCam");
        //처음 1회만 실행
        initCall();
        initState();
        // Convenience function to setup a webcam
        const size = 500;
        const flip = true; // whether to flip the webcam
        webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append/get elements to the DOM
        const canvas = document.getElementById("canvas");
        canvas.width = size; canvas.height = size;
        ctx = canvas.getContext("2d");
        labelContainer = document.getElementById("label-container");
        result = document.getElementById("result");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function initState() {
        console.log("initState");
        cnt = Math.floor(Math.random() * (total))+1;
        const modelURL = URL + cnt + "/model.json";
        const metadataURL = URL + cnt + "/metadata.json";
        document.getElementById("poseImg").src = URL + cnt + "/사진" + cnt + ".png";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // Note: the pose library adds a tmPose object to your window (window.tmPose)
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }

    async function loop(timestamp) {
        console.log("--------",timestamp);
        webcam.update(); // update the webcam frame
        if (t == null)
        {
          t = timestamp;
        }
        await predict(timestamp);
        if (cur_status == "next") {
            cur_status = "preparing";
            //넘어갈 때 좀 기다려야할 듯
            result.innerHTML = "다시";
            t = timestamp;
            initState();
        }
        window.requestAnimationFrame(loop);
    }


    async function predict(timestamp) {
        // Prediction #1: run input through posenet
        // estimatePose can take in an image, video or canvas html element
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        // Prediction 2: run input through teachable machine classification model
        const prediction = await model.predict(posenetOutput);
        console.log(cur_status);
        const classPrediction = prediction[0].className + ": " + prediction[0].probability.toFixed(2);

        labelContainer.childNodes[0].innerHTML = classPrediction;

        for (let k = 0; k < maxPredictions; k++) {
              if(prediction[k].className == "error"){
                if(prediction[k].probability.toFixed(2) > 0.95 && t - timestamp > 1000){
                  var error_audio = new Audio('./audio/error.mp3');
                  error_audio.play();
                }
              }
              else {
                continue;
              }
      }
        if (prediction[0].probability.toFixed(2) > 0.9){
            console.log("i'm here!/ cur_status: ", cur_status);
            if (cur_status == "preparing"){
                start_time = new Date();
                console.log("start_time 측정 완료");
                cur_status = "start";
            }
            end_time = new Date();

            if (end_time - start_time > 4000){
                result.innerHTML = "success"+end_time;
                cur_status = "next";
            }
        } else {
            cur_status = "preparing";
        }

        drawPose(pose);
    }

    function drawPose(pose) {
        if (webcam.canvas) {
            ctx.drawImage(webcam.canvas, 0, 0);
            // draw the keypoints and skeleton
            if (pose) {
                const minPartConfidence = 0.5;
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }