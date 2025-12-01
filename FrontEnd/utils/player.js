export class Player {
    constructor(imagesRun, imagesJump, x, y, width, height, score) {
      this.imagesRun = imagesRun;
      this.imagesJump = imagesJump;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.vy = 0;
      this.jumping = false;
      this.frameIndex = 0;
      this.jumpFrameIndex = 0;
      this.groundY = y;
      this.score = score
   
      this.frameTimer = 0;
      this.jumpFrameInterval = 100 / 4;
    }

    

    update(gravity, deltaTime = 1, score) {

    let speedFactor = 12 + score * 10 // speed frames
    this.runFrameInterval = Math.max(5, 10000 / speedFactor); // min max vitesse

    this.frameTimer += deltaTime;

    if (this.jumping) {
      if (this.frameTimer > this.jumpFrameInterval) {
        if (this.jumpFrameIndex < this.imagesJump.length - 1) {
          this.jumpFrameIndex++;
        }
        this.frameTimer = 0;
      }

      this.vy += gravity;
      this.y += this.vy;
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.jumping = false;
        this.jumpFrameIndex = 0;
        this.frameIndex = 0;
      }
    } else {
      if (this.frameTimer > this.runFrameInterval) { 
        this.frameIndex = (this.frameIndex + 1) % this.imagesRun.length;
        this.frameTimer = 0;
        }
    }
  }


  draw(ctx) {
    if (this.jumping) {
      let jumpStretchFactor = 2;
      ctx.drawImage(
        this.imagesJump[this.jumpFrameIndex],
        this.x,
        this.y - (this.height * (jumpStretchFactor - 1)),
        this.width,
        this.height * jumpStretchFactor
      );
    } else {
      ctx.drawImage(
        this.imagesRun[this.frameIndex],
        this.x, this.y,
        this.width, this.height
      );
    }
  }
    jump(force) {
    if (!this.jumping) {
      this.vy = -force;
      this.jumping = true;
    }
  }
}