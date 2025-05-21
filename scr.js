// script.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 1100;
canvas.height = 600;

// Asset loader
const loadImage = src => { const img = new Image(); img.src = src; return img; };

// Images
const RUNNING = [loadImage("Assets/Dino/DinoRun1.png"), loadImage("Assets/Dino/DinoRun2.png")];
const JUMPING = loadImage("Assets/Dino/DinoJump.png");
const DUCKING = [loadImage("Assets/Dino/DinoDuck1.png"), loadImage("Assets/Dino/DinoDuck2.png")];
const SMALL_CACTUS = [loadImage("Assets/Cactus/SmallCactus1.png"), loadImage("Assets/Cactus/SmallCactus2.png"), loadImage("Assets/Cactus/SmallCactus3.png")];
const LARGE_CACTUS = [loadImage("Assets/Cactus/LargeCactus1.png"), loadImage("Assets/Cactus/LargeCactus2.png"), loadImage("Assets/Cactus/LargeCactus3.png")];
const BIRD = [loadImage("Assets/Bird/Bird1.png"), loadImage("Assets/Bird/Bird2.png")];
const CLOUD = loadImage("Assets/Other/Cloud.png");
const BG = loadImage("Assets/Other/Track.png");

// Game vars
let gameSpeed = 12;
let x_pos_bg = 0;
const y_pos_bg = 380;
let points = 0;
let obstacles = [];
let deathCount = 0;
let loopId = null;
const input = {};

// Dinosaur class
class Dinosaur {
  constructor() {
    this.X_POS = 80;
    this.Y_POS = 310;
    this.Y_POS_DUCK = 340;
    this.JUMP_VEL = 12;
    this.gravity = 0.6;
    this.duck_img = DUCKING;
    this.run_img = RUNNING;
    this.jump_img = JUMPING;
    this.state = 'run';
    this.step_index = 0;
    this.current_vel = 0;
    this.image = this.run_img[0];
    this.x = this.X_POS;
    this.y = this.Y_POS;
  }

  update() {
    // Mid-air dive: ArrowDown during jump switches to dive state
    if (this.state === 'jump' && input.ArrowDown) {
      this.state = 'dive';
    }
    // Input state transitions
    if (input.ArrowUp && this.state !== 'jump' && this.state !== 'dive') {
      this.state = 'jump';
      this.current_vel = this.JUMP_VEL;
      this.step_index = 0;
    } else if (input.ArrowDown && this.state === 'run') {
      this.state = 'duck';
    } else if (this.state !== 'jump' && this.state !== 'dive') {
      this.state = 'run';
    }

    // State logic
    if (this.state === 'duck') this.duck();
    else if (this.state === 'run') this.run();
    else if (this.state === 'jump' || this.state === 'dive') this.jump();

    // Loop animations
    if (this.step_index >= 8) this.step_index = 0;
  }

  duck() {
    this.image = this.duck_img[Math.floor(this.step_index / 4)];
    this.y = this.Y_POS_DUCK;
    this.step_index++;
  }

  run() {
    this.image = this.run_img[Math.floor(this.step_index / 4)];
    this.y = this.Y_POS;
    this.step_index++;
  }

  jump() {
    this.image = this.jump_img;
    // For dive state, do not reset current_vel
    if (this.state === 'jump') {
      // normal jump ascent
      this.y -= this.current_vel * 1.2;
      this.current_vel -= this.gravity;
    } else {
      // dive: immediate fall
      this.y += this.current_vel ? this.current_vel * this.gravity : this.gravity * 5;
    }
    // Landing
    if (this.y >= this.Y_POS) {
      this.y = this.Y_POS;
      this.state = 'run';
      this.step_index = 0;
    }
    this.step_index++;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y);
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.image.width, height: this.image.height };
  }
}

  update() {
    // Jump dive: pressing down makes dino fall faster
    if (this.state === 'jump' && input.ArrowDown) {
      this.current_vel = -this.JUMP_VEL;
    }
    // Input state transitions
    if (input.ArrowUp && this.state !== 'jump') {
      this.state = 'jump';
      this.current_vel = this.JUMP_VEL;
      this.step_index = 0;
    } else if (input.ArrowDown && this.state === 'run') {
      this.state = 'duck';
    } else if (this.state !== 'jump') {
      this.state = 'run';
    }

    // State logic
    if (this.state === 'duck') this.duck();
    else if (this.state === 'run') this.run();
    else if (this.state === 'jump') this.jump();

    // Loop animations
    if (this.step_index >= 8) this.step_index = 0;
  }

  duck() {
    this.image = this.duck_img[Math.floor(this.step_index / 4)];
    this.y = this.Y_POS_DUCK;
    this.step_index++;
  }

  run() {
    this.image = this.run_img[Math.floor(this.step_index / 4)];
    this.y = this.Y_POS;
    this.step_index++;
  }

  jump() {
    this.image = this.jump_img;
    // Apply velocity and gravity
    this.y -= this.current_vel * 1.2;
    this.current_vel -= this.gravity;
    // Landing
    if (this.y >= this.Y_POS) {
      this.y = this.Y_POS;
      this.state = 'run';
      this.step_index = 0;
    }
    this.step_index++;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y);
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.image.width, height: this.image.height };
  }
}

// Cloud class
class Cloud {
  constructor() {
    this.x = canvas.width + Math.random() * 200;
    this.y = 50 + Math.random() * 50;
    this.image = CLOUD;
  }

  update() {
    this.x -= gameSpeed * 0.4;
    if (this.x < -this.image.width) this.reset();
  }

  reset() {
    this.x = canvas.width + Math.random() * 800;
    this.y = 50 + Math.random() * 50;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y);
  }
}

// Obstacle
class Obstacle {
  constructor(imgArr) {
    this.arr = imgArr;
    this.index = Math.floor(Math.random() * imgArr.length);
    this.image = imgArr[this.index];
    this.x = canvas.width;
    this.width = this.image.width;
    this.height = this.image.height;
    this.setY();
  }

  setY() {
    if (this.arr === SMALL_CACTUS) this.y = 325;
    else if (this.arr === LARGE_CACTUS) this.y = 300;
    else this.y = 250;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y);
  }

  getRect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

class Bird extends Obstacle {
  constructor(arr) {
    super(arr);
    this.frame = 0;
  }
  update() {
    super.update();
    this.frame++;
    this.image = this.arr[Math.floor(this.frame / 5) % this.arr.length];
  }
}

// Init
let player = new Dinosaur();
let cloud = new Cloud();

// Spawn logic
function spawnObstacle() {
  const r = Math.random();
  if (r < 0.3) obstacles.push(new Obstacle(SMALL_CACTUS));
  else if (r < 0.6) obstacles.push(new Obstacle(LARGE_CACTUS));
  else obstacles.push(new Bird(BIRD));
}

// Drawing
function background() {
  const w = BG.width;
  ctx.drawImage(BG, x_pos_bg, y_pos_bg);
  ctx.drawImage(BG, w + x_pos_bg, y_pos_bg);
  if (x_pos_bg <= -w) x_pos_bg = 0;
  x_pos_bg -= gameSpeed;
}

function score() {
  points++;
  if (points % 80 === 0) gameSpeed = Math.min(gameSpeed + 0.7, 25);
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Points: " + points, 950, 40);
}

// Collision detection
const checkCollision = (r1, r2) => (
  r1.x < r2.x + r2.width &&
  r1.x + r1.width > r2.x &&
  r1.y < r2.y + r2.height &&
  r1.y + r1.height > r2.y
);

// Loop
function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background();
  cloud.update(); cloud.draw();
  player.update(); player.draw();
  if (!obstacles.length) spawnObstacle();
  obstacles.forEach((o, i) => {
    o.update(); o.draw();
    if (checkCollision(player.getRect(), o.getRect())) {
      clearInterval(loopId); deathCount++; menu();
    }
    if (o.x + o.width < 0) obstacles.splice(i, 1);
  });
  score();
}

// Menu/reset
function menu() {
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black"; ctx.font = "30px Arial";
  const m = deathCount ? `Restart - Score: ${points}` : "Press any key to Start";
  ctx.fillText(m, canvas.width/2 - 150, canvas.height/2);
  document.onkeydown = resetGame;
}

function resetGame() {
  gameSpeed = 12; x_pos_bg = 0; points = 0; obstacles = [];
  player = new Dinosaur(); cloud = new Cloud();
  startInputListener();
  loopId = setInterval(updateGame, 1000/30);
}

function startInputListener() {
  document.addEventListener('keydown', e => input[e.key] = true);
  document.addEventListener('keyup', e => input[e.key] = false);
}

// Start
deathCount = 0;
startInputListener();
menu();
