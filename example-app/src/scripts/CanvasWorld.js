import {AABB, Circle, World} from '../../../src/repulse.js';

export class CanvasWorld extends World {
  constructor(bodyList, context) {
    super(bodyList);
    this.context = context;
  }

  step() {
    this.resolveContacts();
    this.draw();
    return this.applyForces();;
  }

  setShapeStyle() {
    this.context.strokeStyle = '#000000';
  }

  setForceStyle() {
    this.context.strokeStyle = '#ff0000';
  }

  drawBody(body) {
    this.setShapeStyle();
    switch (body.shape.constructor) {
      case(Circle):
        this.drawCircle(body.position, body.shape);
        break;
      case(AABB):
        this.drawAABB(body.position, body.shape);
        break;
    }
    this.setForceStyle();
    this.drawForces(body);
  }

  drawCircle(position, circle) {
    const context = this.context;

    context.beginPath();
    context.arc(position.x, position.y, circle.radius, 0, Math.PI * 2);
    context.stroke();
    context.closePath();
  }

  drawAABB(position, aabb) {
    const context = this.context;

    context.beginPath();
    context.strokeRect(
      position.x - aabb.width / 2,
      position.y - aabb.height / 2,
      aabb.width,
      aabb.height
    );
    context.closePath();
  }

  drawForces(body) {
    if(body.forces) body.forces.forEach(force => this.drawVector(body.position, force));
  }

  drawVector(origin, vector) {
    const context = this.context;

    context.beginPath();
    context.moveTo(origin.x, origin.y);
    context.lineTo(origin.x + vector.x, origin.y + vector.y);
    context.stroke();
    context.closePath();
  }

  draw() {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    this.bodyList.forEach(body => this.drawBody(body));
  }

}
