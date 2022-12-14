let URL = "./model/";
    let model, webcam, ctx, labelContainer, result, maxPredictions;
    let start_time;
    let end_time;
    let cur_status = "preparing";
    let cnt;
    let et; //동작 도전 시간
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
        //askNotificationPermission();
        //initCall();
        var start_audio = new Audio('./audio/start.mp3');
        start_audio.play();
        initCam();

    }

    async function initCall(){
        var text = "척추 요정~";
        var notification = new Notification('스트레칭할 시간입니다.', { body: text});
        setTimeout(notification.close.bind(notification), 4000);
        
    }

    async function initCam(){
        console.log("initCam");
        //처음 1회만 실행

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
        console.log("난수: ",cnt);
        const modelURL = URL + cnt + "/model.json";
        const metadataURL = URL + cnt + "/metadata.json";
        document.getElementById("poseImg").src = URL + cnt + "/사진" + cnt + ".jpeg";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // Note: the pose library adds a tmPose object to your window (window.tmPose)
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }

    function sleep(ms) {
      const wakeUpTime = Date.now() + ms;
      while (Date.now() < wakeUpTime) {}
    }

    async function loop(timestamp) {
        console.log("----------loop-----------");
        webcam.update(); // update the webcam frame

        console.log("after defined", et);

        let temp = new Date();
        
        await predict();
        
        if (cur_status == "next_waiting"){
          console.log("===========next_wating===========");
          cur_status = "next";
          result.innerHTML = "성공! 다음동작으로 넘어가는 중";
          sleep(1000);
        }
        else if ( et = temp + 2000 && cur_status == "next") {
            cur_status = "preparing";
            result.innerHTML = "다시";
            initState();
        }
        window.requestAnimationFrame(loop);
    }

    var error = 0;
    async function predict() {

      // Prediction #1: run input through posenet
      // estimatePose can take in an image, video or canvas html element
      const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
      // Prediction 2: run input through 
      const prediction = await model.predict(posenetOutput);
      const classPrediction = prediction[1].className + ": " + prediction[1].probability.toFixed(2);

      labelContainer.childNodes[1].innerHTML = classPrediction;
      if (et == 0)
      {
        et = new Date();
        console.log("undefined");
      }
      if (prediction[1].probability.toFixed(2) > 0.9){
          console.log("i'm here!/ cur_status: ", cur_status);
          if (cur_status == "preparing"){
              start_time = new Date();
              console.log("start_time 측정 완료");
              cur_status = "start";
          }
          end_time = new Date();
          console.log("success 까지 유지해야하는 시간: ",(3600-(end_time-start_time))/600);
          
          result.innerHTML = (parseInt((3600 - (end_time - start_time))/600))+"초 더 유지해주세요.";
          
          if (end_time - start_time > 3600){
              result.innerHTML = "success"+end_time;
              cur_status = "next_waiting";
              console.log("next_waiting");
              et = new Date();
          }
      } else {
        error++;
        console.log("++++error case++++", error, "개");
        result.innerHTML = 0;
        if(error % 60 == 0 || error == 1){
          var error_audio = new Audio('./audio/error.mp3');
          error_audio.play();
          console.log("audio 출력");
        }
        start_time = new Date();
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
