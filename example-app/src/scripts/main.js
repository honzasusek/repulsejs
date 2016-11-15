import {AABB, Body, DynamicBody, Circle, Vector} from '../../../src/repulse.js';
import {CanvasWorld} from './CanvasWorld.js';

document.body.onload = function() {
  const animateButton = document.getElementById('animateButton');
  const canvas = document.getElementById('canvas');
  const canvasRect = canvas.getBoundingClientRect();
  const resolveButton = document.getElementById('resolveButton');
  const stepButton = document.getElementById('stepButton');

  const repulseExample = new CanvasWorld(
    [
      new DynamicBody(new Vector(70, 64), new Circle(20)),
      new DynamicBody(new Vector(70, 64), new Circle(20)),
      new DynamicBody(new Vector(129, 20), new Circle(40)),
      new DynamicBody(new Vector(111, 50), new Circle(40)),
      new Body(new Vector(100, 80), new AABB(100, 50))
    ],
    canvas.getContext('2d')
  );

  repulseExample.createBounds(canvasRect.width, canvasRect.height, new Vector(canvasRect.width/2, canvasRect.height/2));

  animateButton.addEventListener('click', () => {
    const animate = () => {
      if(!repulseExample.step()) window.requestAnimationFrame(animate);
    };
    animate();
  });

  resolveButton.addEventListener('click', () => {
    repulseExample.resolve();
    repulseExample.draw();
  });

  stepButton.addEventListener('click', () => {
    repulseExample.step();
  });

  repulseExample.draw();
}
