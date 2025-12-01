
export function drawParallax(
    ctx,
    canvas,
    image,
    xRef,
    speed,
    score,
    scale = 0.3
  ) {
    if (!ctx || !image.complete) return xRef.current;
  
    const decorHeight = canvas.height;
    const bgWidth     = image.width * scale;
    const transparency = Math.max(0.2, 0.99 - score.current / 23);
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = transparency;
    ctx.drawImage(image, xRef.current, canvas.height - decorHeight, bgWidth, decorHeight);
    ctx.drawImage(image, xRef.current + bgWidth, canvas.height - decorHeight, bgWidth, decorHeight);
    ctx.globalAlpha = 1;
  
    let adjustedSpeed = speed.current + score.current * 0.66; // vitesse / score
let newX = xRef.current - adjustedSpeed / 1.7;

if (newX <= -bgWidth) newX = 0;
xRef.current = newX;
return newX;
  }