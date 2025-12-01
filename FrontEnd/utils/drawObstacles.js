
export function drawObstacles(ctx, canvas, obstaclesRef, obstacleImg, gameSpeedRef, score, isGameOver ) {
    if (!ctx || !obstacleImg.complete) return;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    //
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= -2 + gameSpeedRef.current / 0.7; // vitesse obst
  
      //
      if (obs.x + obs.width < 0) {
        obstaclesRef.current.splice(i, 1);
        if (!isGameOver) score.current += 1;
      }
    }
  
    //
    for (let obs of obstaclesRef.current) {
      ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
    }
  }
  
  //
  export function spawnObstacle(obstaclesRef, canvas) {
    const size = 30; // Size
    obstaclesRef.current.push({
      x: canvas.width - size + 10, // depart x
      y: canvas.height - size - 173,
      width: size,
      height: size,
    });
  }