var Game = Game || {};
const gameWrapper = document.getElementById('game-wrapper');

Game.slingshot = function() {
    let Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composites = Matter.Composites,
        Events = Matter.Events,
        Constraint = Matter.Constraint,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        World = Matter.World,
        Bodies = Matter.Bodies;
        Body = Matter.Body;

    // create engine
    let engine = Engine.create(),
        world = engine.world;

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


    let ground = Bodies.rectangle(400, 625, 815, 50, { isStatic: true, render: { visible: false } }),
        slingshot = Bodies.circle(410, 525, 1, {
            isStatic: true,
            render: { 
                sprite: { 
                    texture: '../img/slingshot.png',
                    xScale: .6,
                    yScale: .6
                } 
            } 
        }),
        balloon = Bodies.circle(400, 100, 30, {
            isStatic: true,
            render: {
                sprite: {
                    texture: '../img/balloon.png',
                    xScale: .27,
                    yScale: .27
                }
            }
        }),
        present = Bodies.rectangle(400, 180, 50, 50, {
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
            stiffness: .9,
            render: {
                lineWidth: 1,
                strokeStyle: 'black',
                type: 'line'
            }
        }),
        rockOptions = { 
            density: 0.004, 
            render: {
                sprite: {
                    texture: '../img/rock.png',
                    xScale: .25,
                    yScale: .25
                }
            } 
        },
        rock = Bodies.circle(400, 400, 15, rockOptions),
        anchorA = { x: 320, y: 400 },
        anchorB = { x: 480, y: 400 },
        elasticRender = {
            lineWidth: 10,
            strokeStyle: '#67000d',
            type: 'line'
        },
        elasticA = Constraint.create({ 
            pointA: anchorA, 
            bodyB: rock, 
            stiffness: 0.01,
            render: elasticRender
        }),
        elasticB = Constraint.create({ 
            pointA: anchorB, 
            bodyB: rock, 
            stiffness: 0.01,
            render: elasticRender
        }),
        counterX = -1,
        counterY = -1


    World.add(engine.world, [ground, balloon, balloonString, present, slingshot, elasticA, elasticB, rock]);

    Events.on(engine, 'beforeUpdate', function(event) {
        counterX += .005;
        counterY += .04;
        let px = 400 + 450 * Math.sin(counterX),
            py = 60 + 10 * Math.sin(counterY);

        // body is static so must manually update velocity for friction to work
        Body.setVelocity(balloon, { x: px - balloon.position.x, y: py - balloon.position.y });
        Body.setPosition(balloon, { x: px, y: py });
        console.log(px);
    });

    Events.on(engine, 'afterUpdate', function() {
        if (mouseConstraint.mouse.button === -1 && (rock.position.y < 385)) {
            rock = Bodies.circle(400, 400, 15, rockOptions);
            World.add(engine.world, rock);
            elasticA.bodyB = rock;
            elasticB.bodyB = rock;
        }
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

    World.add(world, mouseConstraint);

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