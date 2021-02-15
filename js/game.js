var Game = Game || {};
const gameWrapper = document.getElementById('game-wrapper');

Game.slingshot = function() {
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composites = Matter.Composites,
        Composite = Matter.Composite,
        Events = Matter.Events,
        Constraint = Matter.Constraint,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        World = Matter.World,
        Bodies = Matter.Bodies;
        Body = Matter.Body;

    // create engine
    let engine = Engine.create();

    // create renderer
    let render = Render.create({
        element: gameWrapper,
        engine: engine,
        options: {
            width: 800,
            height: 600,
            background: 'transparent',
            wireframeBackground: 'transparent',
            showAngleIndicator: false,
            wireframes: false
        }
    });

    Render.run(render);

    // create runner
    let runner = Runner.create();
    Runner.run(runner, engine);

    // add bodies
    const createBalloonPresent = () => {
        const x = Math.random() * (760 - 40) + 40;
        const y = Math.random() * (300 - 60) + 60;
        const floatDirection = Math.random() > .5 ? 1 : -1;
        
        const balloon = Bodies.circle(x, y, 30, {
            isStatic: true,
            collisionFilter: {group: -1},
            initialPosition: {x: x, y: y}, // custom property necessary for floatBalloon
            floatDirection: floatDirection,
            render: {
                sprite: {
                    texture: '../img/balloon.png',
                    xScale: .27,
                    yScale: .27
                }
            }
        }),
        present = Bodies.rectangle(x, y + 80, 50, 50, {
            collisionFilter: {group: -1},
            density: .9,
            render: {
                sprite: {
                    texture: '../img/present.png',
                    xScale: .25,
                    yScale: .25
                }
            }
        }),
        balloonString = Constraint.create({
            bodyA: balloon,
            pointA: {x: -2, y: 29}, 
            bodyB: present,
            pointB: {x: 0, y: -10},
            render: {
                lineWidth: 1,
                strokeStyle: 'black',
                type: 'line'
            }
        });
        return Composite.create({
            bodies: [balloon, present],
            constraints: [balloonString],
            label: 'balloonPresent'
        });
    };

    let ground = Bodies.rectangle(400, 625, 815, 50, { isStatic: true, render: { visible: false } }),
        slingshot = Bodies.circle(410, 525, 1, {
            isStatic: true,
            render: { 
                sprite: { 
                    texture: '../img/slingshot.png',
                    xScale: .4,
                    yScale: .4
                } 
            } 
        }),
        balloonPresents = [
            createBalloonPresent(),
            createBalloonPresent(),
            createBalloonPresent()
        ],
        rockOptions = { 
            density: 0.004,
            restitution: .5,
            label: 'rock', // custom property to help identify later
            render: {
                sprite: {
                    texture: '../img/rock.png',
                    xScale: .17,
                    yScale: .17
                }
            } 
        },
        rock = Bodies.circle(400, 445, 10, rockOptions),
        anchorA = { x: 350, y: 445 },
        anchorB = { x: 455, y: 445 },
        elasticRender = {
            lineWidth: 8,
            strokeStyle: '#67000d',
            type: 'line'
        },
        elasticA = Constraint.create({ 
            pointA: anchorA, 
            bodyB: rock, 
            stiffness: 0.02,
            render: elasticRender
        }),
        elasticB = Constraint.create({ 
            pointA: anchorB, 
            bodyB: rock, 
            stiffness: 0.02,
            render: elasticRender
        }),
        counterX = -1,
        counterY = -1,
        ticks = 0


    World.add(engine.world, [ground, slingshot, ...balloonPresents, elasticA, elasticB, rock]);
    
    const floatBalloon = (balloonPresent, x, y) => {
        const balloon = balloonPresent.bodies[0];
        let px = balloon.initialPosition.x + 450 * Math.sin(counterX) * balloon.floatDirection,
            py = balloon.initialPosition.y + 10 * Math.sin(counterY) * balloon.floatDirection;

        // Body is static so must manually update velocity for friction to work:
        Body.setVelocity(balloon, { x: px - balloon.position.x, y: py - balloon.position.y });
        Body.setPosition(balloon, { x: px, y: py });
    };

    Events.on(engine, 'beforeUpdate', () => {
        counterX += .005;
        counterY += .04;
        ticks++;
        engine.world.composites.filter(c => c.label === 'balloonPresent').forEach(bP => floatBalloon(bP));
    });

    Events.on(engine, 'afterUpdate', () => {
        // Create new rock when slingshot is fired:
        if (mouseConstraint.mouse.button === -1 && (rock.position.y < 435)) {
            rock = Bodies.circle(400, 445, 10, rockOptions);
            World.add(engine.world, rock);
            elasticA.bodyB = rock;
            elasticB.bodyB = rock;
        }

        // Every 200 ticks, create new balloonPresent if less than 3 exist:
        if (ticks % 200 === 0 &&
            engine.world.composites.filter(c => c.label === 'balloonPresent').length < 3) {
            World.add(engine.world, createBalloonPresent());
        }
    });

    Events.on(engine, 'collisionEnd', (event) => {
        const popBalloon = (balloonPresent) => {
            const present = balloonPresent.bodies[1];
            // Remove present from composite:
            Composite.move(balloonPresent, present, engine.world);
            present.collisionFilter.group = 0;
            // Remove composite from world:
            World.remove(engine.world, balloonPresent);
        };

        const getBalloonPresentFromBody = (body) => {
            return engine.world.composites.find(bP => bP.bodies.includes(body));
        };

        event.pairs.forEach(pair => {
            if (getBalloonPresentFromBody(pair.bodyA) && pair.bodyB.label === 'rock') {
                popBalloon(getBalloonPresentFromBody(pair.bodyA));
            } else if (getBalloonPresentFromBody(pair.bodyB) && pair.bodyA.label === 'rock') {
                popBalloon(getBalloonPresentFromBody(pair.bodyB));
            }
        });
    });

    // add mouse control
    let mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

    World.add(engine.world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // fit the render viewport to the scene
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: 800, y: 600 }
    });

    // context for MatterTools.Demo
    return {
        engine: engine,
        runner: runner,
        render: render,
        canvas: render.canvas,
        stop: function() {
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
        }
    };
};

Game.slingshot.title = 'Slingshot';
Game.slingshot.for = '>=0.14.2';

if (typeof module !== 'undefined') {
    module.exports = Game.slingshot;
}