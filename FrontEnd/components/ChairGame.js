import { useEffect, useRef, useState } from "react";

import ChairGameStyles from "../styles/ChairGame.module.css";

import { ChairFallingUtils } from "../utils/ChairFallingUtils";
import { Player } from "../utils/player";
import { drawParallax } from "../utils/drawParallax";
import { drawObstacles, spawnObstacle } from "../utils/drawObstacles";

import GameOverModal from "../components/GameOverModal"

function ChairGame({}) {

  const chairCanvasRef = useRef(null);
  const chairCtxRef = useRef(null);
  const animateFallingChairRef = useRef();

  const backgroundCanvasRef = useRef(null);
  const backgroundCtxRef = useRef(null);
  const backgroundX = useRef(0);
  const backgroundImg = useRef(new Image());

  const player = useRef(null);
  const playerCanvasRef = useRef(null);
  const playerCtxRef = useRef(null);
  const playerRunPaths = [
    "/ChairRunGame/chaircourir1.gif",
    "/ChairRunGame/chaircourir2.gif",
    "/ChairRunGame/chaircourir3.gif",
    "/ChairRunGame/chaircourir4.gif",
    "/ChairRunGame/chaircourir5.gif",
    "/ChairRunGame/chaircourir6.gif",
  ];

  const playerJumpPaths = [
    "/ChairRunGame/chairjump1.gif",
    "/ChairRunGame/chairjump2.gif",
    "/ChairRunGame/chairjump3.gif",
    "/ChairRunGame/chairjump4.gif",
    "/ChairRunGame/chairjump5.gif",
    "/ChairRunGame/chairjump6.gif",
    "/ChairRunGame/chairjump7.gif",
    "/ChairRunGame/chairjump8.gif",
    "/ChairRunGame/chairjump9.gif",
    "/ChairRunGame/chairjump10.gif",
    "/ChairRunGame/chairjump11.gif",
  ];

  function loadImages(paths) {
    return paths.map(path => {
      const img = new window.Image();
      img.src = path;
      return img;
    });
  }
  const imagesRun = useRef(loadImages(playerRunPaths));
  const imagesJump = useRef(loadImages(playerJumpPaths));

  const obstaclesCanvasRef = useRef(null);
  const obstaclesCtxRef = useRef(null);
  const obstaclesRef = useRef([]);
  const obstacleImg = useRef(new Image());

  const [isGameOver, setIsGameOver] = useState(false);
  const animationFrameIdRef = useRef(null);

  const spawnIntervalRef = useRef(null);
  const [spawnVisible, setSpawnVisible] = useState(true);

  const gameSpeed = useRef(5);
  const score = useRef(0);
  const [finalScore, setFinalScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);


  const ctxRef = useRef(null);
  const fallingChair = useRef({
    x: 160,
    y: -200,
    width: 0,
    height: 0,
    velocityY: 0,
    gravity: 0.5,
    landed: false,
    image: new Image()
  });

 


  useEffect(() => {

    // Init
document.body.style.overflow = "hidden";
 const onKey = (e) => {
    if (e.code === "Space" && player.current && !player.current.jumping && !isGameOver) {
      player.current.jump(18);
    } else if (e.code === "Space" && isGameOver){
      restartGame();
    }
  };
window.addEventListener("keydown", onKey);
return () => {window.removeEventListener("keydown", onKey);
  

  
  // Adapt. Parent
  const bgCanvas = backgroundCanvasRef.current;
  const chCanvas = chairCanvasRef.current;
  const obsCanvas = obstaclesCanvasRef.current;
  const plCanvas = playerCanvasRef.current;

  obsCanvas.width = 800;
  obsCanvas.height = 600;

  bgCanvas.width = chCanvas.width = 800;
  bgCanvas.height = chCanvas.height = 600;

  plCanvas.width = 800;
  plCanvas.height = 600;

  playerCtxRef.current = plCanvas.getContext("2d");
  obstaclesCtxRef.current = obsCanvas.getContext("2d");
  backgroundCtxRef.current = bgCanvas.getContext("2d");
  chairCtxRef.current = chCanvas.getContext("2d");

  backgroundImg.current.src = "/ChairRunGame/chairdecor.png";
  backgroundImg.current.onload = () => requestAnimationFrame(ChairFallingUtils);

  const chair = fallingChair.current;
  chair.image.src = "/ChairRunGame/chairmirror.svg";
  chair.image.onload = () => requestAnimationFrame(animateFallingChair);

  obstacleImg.current.src = "/ChairRunGame/obstacle.png";
  obstacleImg.current.onload = () => console.log("Obstacle image loaded");
    //

  if (backgroundCanvasRef.current && chairCanvasRef.current ) {
    backgroundCtxRef.current = backgroundCanvasRef.current.getContext("2d");
    chairCtxRef.current = chairCanvasRef.current.getContext("2d");
  }
  
    // Anim chute Cahir
  const img = fallingChair.current.image;
  img.src = "/ChairRunGame/chairmirror.svg";
  
img.onload = () => {
    fallingChair.current.width = img.naturalWidth * 0.5;
    fallingChair.current.height = img.naturalHeight * 0.5;
  };

  
animateFallingChairRef.current = () => {
    const ctx = chairCtxRef.current;
    
    const canvas = chairCanvasRef.current;
    const chair = fallingChair.current;

    canvas.width = 200;
    canvas.height = 900;
    

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ChairFallingUtils(ctx);

    if (!chair.landed) {
      ctx.drawImage(chair.image, chair.x, chair.y, chair.width, chair.height);
      chair.velocityY += chair.gravity;
      fallingChair.current.x = 90;
      chair.y += chair.velocityY;

      if (chair.y >= canvas.height - chair.height - 250) 
        {
        chair.y = canvas.height - chair.height - 40;
        chair.landed = true;

        setTimeout(() => {
          startGame();
        }, 20);
      } else {
        requestAnimationFrame(animateFallingChairRef.current);
      }
    }
  };



  const imgFond = backgroundImg.current;
  imgFond.src = "/ChairRunGame/chairdecor.png";
  imgFond.onload = () => {
    console.log("Background loaded");
  };

  

  ChairFallingUtils()
  animateFallingChairRef.current();
};

}, []);



const ChairFallingUtils = () => {


if (!backgroundImg.current.complete) return;
const ctx = backgroundCtxRef.current;
const canvas = backgroundCanvasRef.current;
if (!ctx || !backgroundImg.current.complete) return;
ctx.clearRect(0,0,canvas.width,canvas.height);

  const scaleDecor = 0.3; 
  const decorHeight = canvas.height;
  const bgWidth = backgroundImg.current.width * scaleDecor;
  ctx.globalAlpha = 1

  ctx.save();
  
  ctx.drawImage(backgroundImg.current, backgroundX.current, canvas.height - decorHeight, bgWidth, decorHeight);
  ctx.drawImage(backgroundImg.current, backgroundX.current + bgWidth, canvas.height - decorHeight, bgWidth, decorHeight);
  ctx.restore(); 

  ctx.drawImage(backgroundImg.current, backgroundX.current, canvas.height - decorHeight, bgWidth, decorHeight);
  ctx.drawImage(backgroundImg.current, backgroundX.current + bgWidth, canvas.height - decorHeight, bgWidth, decorHeight);

 

if (!isGameOver) {
  backgroundX.current -= gameSpeed.current / 1.7;
}

  if (backgroundX.current <= -bgWidth) {
    backgroundX.current = 0;
  }
};


function startGame() {

console.log("Chair landed! Starting game...");

const chCanvas = chairCanvasRef.current;
chCanvas.width = 800;
chCanvas.height = 600;

const gravity = 1.2;
const sol = 330;
const ctx = obstaclesCtxRef.current;

  player.current = new Player(
    imagesRun.current,
    imagesJump.current,
    40,
    330,
    133,
    133
  );

  if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current);
      scheduleNextObstacle();


  let lastTime = performance.now();

function gameLoop(now) {
  if (isGameOver) return;

    const deltaTime = now - lastTime;
    lastTime = now;

    playerCtxRef.current.clearRect(0, 0, 800, 600);

    gameSpeed.current = 5 + score.current * 0.3;
    drawParallax(backgroundCtxRef.current, backgroundCanvasRef.current, backgroundImg.current, backgroundX, gameSpeed, score);
    drawObstacles(obstaclesCtxRef.current, obstaclesCanvasRef.current, obstaclesRef, obstacleImg.current, gameSpeed, score);

    if (!isGameOver) {
      setDisplayScore(score.current);
    }
    if (player.current) {
      player.current.update(gravity, deltaTime, score.current);
      player.current.draw(playerCtxRef.current);

      checkCollision(player.current, obstaclesRef.current);
  }

    const chair = fallingChair.current;
    chairCtxRef.current.drawImage(chair.image, chair.x, chair.y, chair.width, chair.height);

    if (!isGameOver) {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(gameLoop);
    }
        }
      
    requestAnimationFrame(gameLoop);;
}


function checkCollision(player, obstacles) {
if (!spawnVisible && isGameOver) return;

  const playerHitbox = {
    x: player.x + player.width * 0.57,
    y: player.y + player.height * 0.1,         
    width: player.width * 0.21,
    height: player.height * 0.7           
  };

    for (let obs of obstacles) {
      const obstacleHitbox = {
        x: obs.x + obs.width * 0.1,          
        y: obs.y + obs.height * 0.4,
        width: obs.width * 0.8,
        height: obs.height * 0.9
      };
          if (
            playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
            playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
            playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
            playerHitbox.y + playerHitbox.height > obstacleHitbox.y
          ){
        setIsGameOver(true);
        gameSpeed.current = 0
        setSpawnVisible(false)
        setFinalScore(score.current);
        clearInterval(spawnIntervalRef.current);
        console.log("Game Over");
        break;
      }
    }
} 


function scheduleNextObstacle() {

if (isGameOver) return;

  let minDelay;

if (score.current > 100) {
  minDelay = 400;
} else if (score.current > 70) {
  minDelay = 500;
} else if (score.current > 50) {
  minDelay = 600;
} else if (score.current > 45) {
  minDelay = 300;
} else if (score.current > 43) {
  minDelay = 400;
} else if (score.current > 36) {
  minDelay = 400;
} else if (score.current > 27) {
  minDelay = 350;
} else if (score.current > 25) {
  minDelay = 700;
} else if (score.current > 15) {
  minDelay = 400;
} else if (score.current > 10) {
  minDelay = 900;
} else if (score.current > 5) {
  minDelay = 1000;
} else {
  minDelay = 1000;
}

let randomness = Math.random() * 2500 - Math.random() * minDelay;
let variableDelay = minDelay + randomness;
variableDelay = Math.max(400, Math.min(3000, variableDelay));

  let nextSpawn = Math.max(minDelay, variableDelay);

  spawnIntervalRef.current = setTimeout(() => {
    spawnObstacle(obstaclesRef, chairCanvasRef.current);
    scheduleNextObstacle();
  }, nextSpawn);
}


function restartGame() {
  setIsGameOver(false);
  setSpawnVisible(true);
  score.current = 0;
  gameSpeed.current = 5;
  backgroundX.current = 0;
  cancelAnimationFrame(animationFrameIdRef.current);
  clearTimeout(spawnIntervalRef.current);

  obstaclesRef.current = [];
  obstaclesCtxRef.current.clearRect(
    0, 0, obstaclesCanvasRef.current.width, obstaclesCanvasRef.current.height
  );

  playerCtxRef.current.clearRect(
    0, 0, playerCanvasRef.current.width, playerCanvasRef.current.height
  );
  player.current = null;

  const chair = fallingChair.current;
  chair.y = -200;
  chair.velocityY = 0;
  chair.landed = false;

  ChairFallingUtils();
  animateFallingChairRef.current?.();
}


  return(
    <div data-component="ChairGameContainer" className={ChairGameStyles.body}>

      {/* ===== SCORE DISPLAY ===== */}
      <div data-component="ScoreDisplay" className={ChairGameStyles.score}>
        <img
          data-component="ScoreIcon"
          className={ChairGameStyles.yourScoreSvg}
          src="/ChairRunGame/yourscore.svg"
          alt="Your Score"
        />
        <div data-component="ScoreValue" className={ChairGameStyles.yourScoreText}>
          {displayScore}
        </div>
      </div>

      {/* ===== CANVAS LAYERS ===== */}
      <div data-component="CanvasStack" className={ChairGameStyles.canvasStack}>
        
        {/* Background Layer */}
        <div data-component="BackgroundCanvasLayer" className={ChairGameStyles.canvasBackground}> 
          <canvas 
            ref={backgroundCanvasRef} 
            data-component="BackgroundCanvas"
            className={ChairGameStyles.BackgroundArea}
          />
        </div>
      
        {/* Obstacles Layer */}
        <div data-component="ObstaclesCanvasLayer" className={ChairGameStyles.obstaclesArea}>
          <canvas 
            ref={obstaclesCanvasRef} 
            data-component="ObstaclesCanvas"
            className={ChairGameStyles.obstaclesCanvas} 
          />
        </div>

        {/* Player Layer */}
        <div data-component="PlayerCanvasLayer" className={ChairGameStyles.playerArea}>
          <canvas 
            ref={playerCanvasRef} 
            data-component="PlayerCanvas"
            className={ChairGameStyles.playerCanvas} 
          />
        </div>
      </div>

      {/* Falling Chair Layer */}
      <div data-component="FallingChairCanvasLayer" className={ChairGameStyles.fallChairArea}>
        <canvas 
          ref={chairCanvasRef} 
          data-component="FallingChairCanvas"
          className={ChairGameStyles.fallChairAucuneIdee} 
        />
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div data-component="GameOverModalWrapper">
          <GameOverModal 
            className={ChairGameStyles.GameOverModal}
            score={finalScore}
            onRestart={restartGame} 
          />
        </div>
      )}
    </div>
  )
}

export default ChairGame;