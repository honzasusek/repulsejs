import {List, Map} from 'immutable';

const CONTACT_THRESHOLD = 0.1;
const BOUNDS_THICKNESS = 10000;
const MAX_ITERATIONS = 500;

Math.hypot = Math.hypot || function() {
  var y = 0;
  var length = arguments.length;

  for (var i = 0; i < length; i++) {
    if (arguments[i] === Infinity || arguments[i] === -Infinity) {
      return Infinity;
    }
    y += arguments[i] * arguments[i];
  }
  return Math.sqrt(y);
};

export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(vectorB) {
    return Math.hypot(this.x - vectorB.x, vectorB.y - this.y);
  }

  getLength() {
    return(this.distanceTo(new Vector(0, 0)));
  }

  setLength(length) {
    return this.multiplyByScalar(length / this.getLength());
  }

  addLength(length) {
    return this.setLength(this.getLength() + length);
  }

  substractLength(length) {
    return this.setLength(this.getLength() - length);
  }

  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  substract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  divideByScalar(scalar) {
    return new Vector(this.x / scalar, this.y / scalar);
  }

  multiplyByScalar(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  clamp({minX, minY, maxX, maxY}) {
    return new Vector(
      Math.max(minX, Math.min(this.x, maxX)),
      Math.max(minY, Math.min(this.y, maxY))
    );
  }

  negate() {
    return this.multiplyByScalar(-1);
  }

  toUnit() {
    return this.divideByScalar(this.getLength());
  }
}

export class Body {
  constructor(position, shape) {
    this.position = position;
    this.shape = shape;
  }
};

export class DynamicBody extends Body {
  constructor(position, shape) {
    super(position, shape);
    this.forces = new List();
  }
}

export class Shape {};

export class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }
}

export class AABB extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
}

export class Contact {
  constructor(bodyA, bodyB) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
  }
}

export class World {
  static overlap(bodyA, bodyB) {
     const shapeA = bodyA.shape;
     const shapeB = bodyB.shape;

     if(bodyA == bodyB) return false;

     if (shapeA.constructor === Circle && shapeB.constructor === Circle)
       return World.overlapCircleVsCircle(bodyA.position, shapeA, bodyB.position, shapeB);

     if(shapeA.constructor === Circle && shapeB.constructor === AABB)
       return World.overlapCircleVsAABB(bodyA.position, shapeA, bodyB.position, shapeB);

     if(shapeA.constructor === AABB && shapeB.constructor === Circle)
       return World.overlapCircleVsAABB(bodyB.position, shapeB, bodyA.position, shapeA);

     // if(shapeA.constructor === AABB && shapeB.constructor === AABB)
     // return AABBOverlapsAABB(shapeA, bodyA.position, shapeB, bodyB.position)

     return false;
  }

  static overlapCircleVsCircle(positionA, circleA, positionB, circleB) {
    return (circleA.radius + circleB.radius) - positionA.distanceTo(positionB) > CONTACT_THRESHOLD;
  }

  static overlapCircleVsAABB(circlePosition, circle, aabbPosition, aabb) {
    return (
      circle.radius
      -
      World.getAABBContactPoint(circlePosition, aabb, aabbPosition).distanceTo(circlePosition)
      >
      CONTACT_THRESHOLD
    );
  }

  static collideCircleVsCircle(positionA, circleA, positionB, circleB) {
    const distance = positionA.distanceTo(positionB);
    const positionAClean =
      (positionA.distanceTo(positionB)) === 0 ?
      positionA.add(new Vector(10, 0)) :
      positionA

    return(
      new Vector(
        positionB.x - positionAClean.x,
        positionB.y - positionAClean.y
      ).divideByScalar(distance).multiplyByScalar(distance - (circleA.radius + circleB.radius))
    );
  }

  static collideCircleVsAABB(circlePosition, circle, aabbPosition, aabb) {
    const contactVector = World.getAABBContactPoint(circlePosition, aabb, aabbPosition);

    return(
      contactVector.substract(circlePosition).getLength() ?
      contactVector.substract(circlePosition).toUnit().multiplyByScalar(
        contactVector.distanceTo(circlePosition) - circle.radius
      ) :
      List([
        circlePosition.substract(aabbPosition).add(new Vector(0, -Number.MAX_VALUE)),
        circlePosition.substract(aabbPosition).add(new Vector(Number.MAX_VALUE, 0)),
        circlePosition.substract(aabbPosition).add(new Vector(0, Number.MAX_VALUE)),
        circlePosition.substract(aabbPosition).add(new Vector(-Number.MAX_VALUE, 0))
      ]).map(
        vector => vector.clamp({
          maxX: aabb.width/2,
          maxY: aabb.height/2,
          minX: -aabb.width/2,
          minY: -aabb.height/2
        })
        .add(aabbPosition)
        .substract(circlePosition)
      ).reduce(
        (shortestVector, vector) => vector.getLength() < shortestVector.getLength() ? vector: shortestVector
      ).addLength(circle.radius)
    );
  }

  static getAABBContactPoint(origin, aabb, aabbPosition) {
    return origin
      .substract(aabbPosition)
      .clamp({
        maxX: aabb.width/2,
        maxY: aabb.height/2,
        minX: -aabb.width/2,
        minY: -aabb.height/2
      })
      .add(aabbPosition)
  }

  constructor(bodyList, stepSize = 0.1) {
    this.bodyList = List(bodyList);
    this.stepSize = stepSize;
    this.lastPositionSum = 0;
    this.steps = 0;
  }

  resolve() {
    while(this.steps <= MAX_ITERATIONS && !this.step());
  }

  step() {
    this.steps += 1;
    this.resolveContacts();
    return this.applyForces();
  }

  applyForces() {
    let positionSum = 0;

    this.bodyList.forEach(body => {
      if(body.constructor === DynamicBody) {
        body.forces.forEach(
          force =>
            body.position = body.position.add(force)
        );
        body.forces = body.forces.clear();
        positionSum += body.position.getLength();
      }
    });

    const clean = !Math.abs(positionSum - this.lastPositionSum);

    this.lastPositionSum = positionSum;

    return clean;
  }

  resolveContacts() {
    this.bodyList.reduce(
      (contactList, bodyA) => this.bodyList.reduce(
        (contactList, bodyB) => {
          const currentContact = World.overlap(bodyA, bodyB) && new Contact(bodyA, bodyB);

          return (
            currentContact &&
            !contactList.filter(
              contact => contact.bodyA === bodyB && contact.bodyB === bodyA
            ).size ?
            contactList.push(currentContact) : contactList
          )
        },
        contactList
      ),
      new List()
    ).forEach(
      contact => {
        const bodyA = contact.bodyA;
        const bodyB = contact.bodyB;
        const shapeA = bodyA.shape;
        const shapeB = bodyB.shape;

        let force;

        if(shapeA.constructor === Circle && shapeB.constructor === Circle) ;
          force = World.collideCircleVsCircle(bodyA.position, shapeA, bodyB.position, shapeB);
        if(shapeA.constructor === Circle && shapeB.constructor === AABB)
          force = World.collideCircleVsAABB(bodyA.position, shapeA, bodyB.position, shapeB);
        if(shapeA.constructor === Circle && shapeB.constructor === AABB)
          force = World.collideCircleVsAABB(bodyA.position, shapeA, bodyB.position, shapeB);
        if(shapeA.constructor === AABB && shapeB.constructor === Circle)
          force = World.collideCircleVsAABB(bodyB.position, shapeB, bodyA.position, shapeA).negate();

        if(force) {

          if(bodyA.position.distanceTo(bodyB.position) === 0)
            force = new Vector(CONTACT_THRESHOLD, 0);

          if(bodyA.constructor === Body) {
            bodyB.forces = bodyB.forces.push(force);
            return;
          };

          if(bodyB.constructor === Body) {
            bodyA.forces = bodyA.forces.push(force);
            return;
          };

          force = force.multiplyByScalar(this.stepSize / 2)

          if(bodyA.constructor === DynamicBody) bodyA.forces = bodyA.forces.push(force)
          if(bodyB.constructor === DynamicBody) bodyB.forces = bodyB.forces.push(force.negate())
        }
      }
    )
  }

  createBounds(width, height, offset = new Vector(0, 0)) {
    const positions = Map({
      top: new Vector(0, -height/2 - BOUNDS_THICKNESS / 2),
      right: new Vector(width/2 + BOUNDS_THICKNESS / 2, 0),
      bottom: new Vector(0, height/2 + BOUNDS_THICKNESS / 2),
      left: new Vector(-width/2 - BOUNDS_THICKNESS / 2, 0)
    }).map(vector => vector.add(offset));

    this.bodyList = this.bodyList.concat(List([
      new Body(positions.get('top'), new AABB(width, BOUNDS_THICKNESS)),
      new Body(positions.get('right'), new AABB(BOUNDS_THICKNESS, height)),
      new Body(positions.get('bottom'), new AABB(width, BOUNDS_THICKNESS)),
      new Body(positions.get('left'), new AABB(BOUNDS_THICKNESS, height))
    ]));
  }
}
