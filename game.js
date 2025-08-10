const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const game = {
    score: 0,
    isGameOver: false,
    gameStarted: false,
    keys: {},
    bullets: [],
    enemies: [],
    strongEnemies: [],
    technicalEnemies: [],
    enemyBullets: [],
    enemySpawnTimer: 0,
    enemySpawnInterval: 240,
    spawnRateTimer: 0,
    clouds: [],
    items: [],
    explosions: [],
    bombFlash: 0,
    effects: {
        barrier: 0,
        timeStop: 0,
        homing: 0
    }
};

const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    shootCooldown: 0,
    life: 3,
    invincible: 0,
    blinkTimer: 0
};

class Bullet {
    constructor(x, y, velocityY, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.velocityY = velocityY;
        this.width = 4;
        this.height = 10;
        this.isEnemy = isEnemy;
        this.isHoming = !isEnemy && game.effects.homing > 0;
    }

    update() {
        if (this.isHoming && !this.isEnemy && (game.enemies.length > 0 || game.strongEnemies.length > 0 || game.technicalEnemies.length > 0)) {
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            game.enemies.forEach(enemy => {
                const distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (distance < closestDistance && distance < 150) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            game.strongEnemies.forEach(strongEnemy => {
                const distance = Math.sqrt((strongEnemy.x - this.x) ** 2 + (strongEnemy.y - this.y) ** 2);
                if (distance < closestDistance && distance < 150) {
                    closestDistance = distance;
                    closestEnemy = strongEnemy;
                }
            });
            
            game.technicalEnemies.forEach(technicalEnemy => {
                const distance = Math.sqrt((technicalEnemy.x - this.x) ** 2 + (technicalEnemy.y - this.y) ** 2);
                if (distance < closestDistance && distance < 150) {
                    closestDistance = distance;
                    closestEnemy = technicalEnemy;
                }
            });
            
            if (closestEnemy) {
                const angle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
                const speed = Math.sqrt(this.velocityY ** 2);
                this.x += Math.cos(angle) * speed * 0.6;
                this.y += Math.sin(angle) * speed * 0.6;
            }
        }
        
        if (this.velocityX) {
            this.x += this.velocityX;
        }
        this.y += this.velocityY;
    }

    draw() {
        if (!this.isEnemy && game.effects.homing > 0) {
            ctx.fillStyle = '#ff8800';
        } else {
            ctx.fillStyle = this.isEnemy ? '#ff6666' : '#66ff66';
        }
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }

    isOffScreen() {
        return this.y < -10 || this.y > canvas.height + 10;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speedY = 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.shootCooldown = Math.random() * 120 + 120;
    }

    update() {
        if (game.effects.timeStop <= 0) {
            this.y += this.speedY;
            this.x += this.speedX;
            
            if (this.x <= this.width/2 || this.x >= canvas.width - this.width/2) {
                this.speedX = -this.speedX;
            }
            
            this.shootCooldown--;
            if (this.shootCooldown <= 0 && !game.isGameOver) {
                game.enemyBullets.push(new Bullet(this.x, this.y + this.height/2, 2.1, true));
                this.shootCooldown = Math.random() * 240 + 180;
            }
        }
    }

    draw() {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y - this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y - this.height/2);
        ctx.closePath();
        ctx.fill();
    }

    isOffScreen() {
        return this.y > canvas.height + 50;
    }
}

class StrongEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.speedY = 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.shootCooldown = Math.random() * 120 + 120;
        this.hp = Math.floor(Math.random() * 6) + 5;
        this.maxHp = this.hp;
    }

    update() {
        if (game.effects.timeStop <= 0) {
            this.y += this.speedY;
            this.x += this.speedX;
            
            if (this.x <= this.width/2 || this.x >= canvas.width - this.width/2) {
                this.speedX = -this.speedX;
            }
            
            this.shootCooldown--;
            if (this.shootCooldown <= 0 && !game.isGameOver) {
                game.enemyBullets.push(new Bullet(this.x, this.y + this.height/2, 2.1, true));
                this.shootCooldown = Math.random() * 240 + 180;
            }
        }
    }

    draw() {
        const intensity = this.hp / this.maxHp;
        const red = Math.floor(255 * (1 - intensity * 0.5));
        const green = Math.floor(64 * intensity);
        const blue = Math.floor(64 * intensity);
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x, this.y + this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y);
        ctx.closePath();
        ctx.fill();
    }

    isOffScreen() {
        return this.y > canvas.height + 50;
    }

    takeDamage() {
        this.hp--;
        return this.hp <= 0;
    }
}

class TechnicalEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speedY = 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.shootCooldown = Math.random() * 120 + 120;
        this.rotation = 0;
    }

    update() {
        if (game.effects.timeStop <= 0) {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += 0.1;
            
            if (this.x <= this.width/2 || this.x >= canvas.width - this.width/2) {
                this.speedX = -this.speedX;
            }
            
            this.shootCooldown--;
            if (this.shootCooldown <= 0 && !game.isGameOver) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const bulletSpeed = 2.1;
                const velocityX = Math.cos(angle) * bulletSpeed;
                const velocityY = Math.sin(angle) * bulletSpeed;
                
                const aimBullet = new Bullet(this.x, this.y + this.height/2, velocityY, true);
                aimBullet.velocityX = velocityX;
                game.enemyBullets.push(aimBullet);
                
                this.shootCooldown = Math.random() * 240 + 180;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height + 50;
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 40;
        this.timer = 30;
        this.maxTimer = 30;
    }

    update() {
        this.timer--;
        this.radius = this.maxRadius * (1 - this.timer / this.maxTimer);
    }

    draw() {
        const alpha = this.timer / this.maxTimer;
        ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    isFinished() {
        return this.timer <= 0;
    }
}

class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.speed = 1;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        let icon = '';
        switch(this.type) {
            case 'barrier': icon = '🛡️'; break;
            case 'timeStop': icon = '⏱️'; break;
            case 'homing': icon = '🚀'; break;
            case 'heart': icon = '❤'; break;
            case 'bomb': icon = '💣'; break;
        }
        ctx.fillText(icon, this.x, this.y + 8);
    }

    isOffScreen() {
        return this.y > canvas.height + 50;
    }
}

function drawPlayer() {
    if (player.invincible > 0) {
        player.blinkTimer++;
        if (Math.floor(player.blinkTimer / 10) % 2 === 0) {
            return;
        }
    }
    
    ctx.fillStyle = '#4444ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height/2);
    ctx.lineTo(player.x - player.width/2, player.y + player.height/2);
    ctx.lineTo(player.x + player.width/2, player.y + player.height/2);
    ctx.closePath();
    ctx.fill();
    
    if (game.effects.barrier > 0) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function updatePlayer() {
    if (!game.gameStarted) {
        if (game.keys[' ']) {
            startGame();
        }
        return;
    }
    
    if (game.isGameOver) {
        if (game.keys['r'] || game.keys['R']) {
            resetGame();
        }
        return;
    }
    
    if (game.keys['ArrowLeft']) {
        player.x = Math.max(player.width/2, player.x - player.speed);
    }
    if (game.keys['ArrowRight']) {
        player.x = Math.min(canvas.width - player.width/2, player.x + player.speed);
    }
    
    if (player.shootCooldown > 0) {
        player.shootCooldown--;
    }
    
    if (game.keys[' '] && player.shootCooldown <= 0) {
        game.bullets.push(new Bullet(player.x, player.y - player.height/2, -4.2));
        player.shootCooldown = 20;
    }
}

function spawnEnemies() {
    game.enemySpawnTimer++;
    
    if (game.effects.timeStop <= 0) {
        game.spawnRateTimer++;
        
        if (game.spawnRateTimer >= 600) {
            game.enemySpawnInterval = Math.max(20, Math.floor(game.enemySpawnInterval * 0.8));
            game.spawnRateTimer = 0;
        }
    }
    
    if (game.enemySpawnTimer >= game.enemySpawnInterval) {
        const x = Math.random() * (canvas.width - 60) + 30;
        const randomChance = Math.random();
        
        if (randomChance < 0.05) {
            game.strongEnemies.push(new StrongEnemy(x, -30));
        } else if (randomChance < 0.15) {
            game.technicalEnemies.push(new TechnicalEnemy(x, -30));
        } else {
            game.enemies.push(new Enemy(x, -30));
        }
        
        game.enemySpawnTimer = 0;
    }
}

function checkCollisions() {
    game.bullets = game.bullets.filter(bullet => {
        let hit = false;
        
        game.enemies = game.enemies.filter(enemy => {
            if (Math.abs(bullet.x - enemy.x) < (bullet.width + enemy.width)/2 &&
                Math.abs(bullet.y - enemy.y) < (bullet.height + enemy.height)/2) {
                hit = true;
                game.score += 10;
                
                game.explosions.push(new Explosion(enemy.x, enemy.y));
                
                if (Math.random() < 0.1) {
                    const itemTypes = ['barrier', 'timeStop', 'homing', 'heart', 'bomb'];
                    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                    game.items.push(new Item(enemy.x, enemy.y, randomType));
                }
                
                return false;
            }
            return true;
        });
        
        game.strongEnemies = game.strongEnemies.filter(strongEnemy => {
            if (Math.abs(bullet.x - strongEnemy.x) < (bullet.width + strongEnemy.width)/2 &&
                Math.abs(bullet.y - strongEnemy.y) < (bullet.height + strongEnemy.height)/2) {
                hit = true;
                
                if (strongEnemy.takeDamage()) {
                    game.score += strongEnemy.maxHp * 100;
                    
                    game.explosions.push(new Explosion(strongEnemy.x, strongEnemy.y));
                    
                    if (Math.random() < 0.3) {
                        const itemTypes = ['barrier', 'timeStop', 'homing', 'heart', 'bomb'];
                        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                        game.items.push(new Item(strongEnemy.x, strongEnemy.y, randomType));
                    }
                    
                    return false;
                }
                
                return true;
            }
            return true;
        });
        
        game.technicalEnemies = game.technicalEnemies.filter(technicalEnemy => {
            if (Math.abs(bullet.x - technicalEnemy.x) < (bullet.width + technicalEnemy.width)/2 &&
                Math.abs(bullet.y - technicalEnemy.y) < (bullet.height + technicalEnemy.height)/2) {
                hit = true;
                game.score += 20;
                
                game.explosions.push(new Explosion(technicalEnemy.x, technicalEnemy.y));
                
                if (Math.random() < 0.1) {
                    const itemTypes = ['barrier', 'timeStop', 'homing', 'heart', 'bomb'];
                    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                    game.items.push(new Item(technicalEnemy.x, technicalEnemy.y, randomType));
                }
                
                return false;
            }
            return true;
        });
        
        return !hit && !bullet.isOffScreen();
    });
    
    if (game.effects.barrier <= 0 && player.invincible <= 0 && game.effects.timeStop <= 0) {
        game.enemyBullets.forEach(bullet => {
            if (Math.abs(bullet.x - player.x) < (bullet.width + player.width)/2 &&
                Math.abs(bullet.y - player.y) < (bullet.height + player.height)/2) {
                takeDamage();
            }
        });
        
        game.enemies.forEach(enemy => {
            if (Math.abs(enemy.x - player.x) < (enemy.width + player.width)/2 &&
                Math.abs(enemy.y - player.y) < (enemy.height + player.height)/2) {
                takeDamage();
            }
        });
        
        game.strongEnemies.forEach(strongEnemy => {
            if (Math.abs(strongEnemy.x - player.x) < (strongEnemy.width + player.width)/2 &&
                Math.abs(strongEnemy.y - player.y) < (strongEnemy.height + player.height)/2) {
                takeDamage();
            }
        });
        
        game.technicalEnemies.forEach(technicalEnemy => {
            if (Math.abs(technicalEnemy.x - player.x) < (technicalEnemy.width + player.width)/2 &&
                Math.abs(technicalEnemy.y - player.y) < (technicalEnemy.height + player.height)/2) {
                takeDamage();
            }
        });
    }
    
    game.items = game.items.filter(item => {
        if (Math.abs(item.x - player.x) < (item.width + player.width)/2 &&
            Math.abs(item.y - player.y) < (item.height + player.height)/2) {
            
            switch(item.type) {
                case 'barrier':
                    game.effects.barrier += 1200;
                    break;
                case 'timeStop':
                    game.effects.timeStop += 600;
                    break;
                case 'homing':
                    game.effects.homing += 1200;
                    break;
                case 'heart':
                    player.life++;
                    break;
                case 'bomb':
                    game.enemies.forEach(enemy => {
                        game.score += 10;
                        game.explosions.push(new Explosion(enemy.x, enemy.y));
                    });
                    game.strongEnemies.forEach(strongEnemy => {
                        game.score += strongEnemy.maxHp * 100;
                        game.explosions.push(new Explosion(strongEnemy.x, strongEnemy.y));
                    });
                    game.technicalEnemies.forEach(technicalEnemy => {
                        game.score += 20;
                        game.explosions.push(new Explosion(technicalEnemy.x, technicalEnemy.y));
                    });
                    game.enemies = [];
                    game.strongEnemies = [];
                    game.technicalEnemies = [];
                    game.enemyBullets = [];
                    game.bombFlash = 10;
                    break;
            }
            return false;
        }
        return !item.isOffScreen();
    });
}

function drawUI() {
    ctx.fillStyle = '#000080';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`スコア: ${game.score}`, 20, 35);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('❤'.repeat(player.life), 20, 65);
}

function takeDamage() {
    player.life--;
    
    game.explosions.push(new Explosion(player.x, player.y));
    
    game.effects.barrier = 0;
    game.effects.timeStop = 0;
    game.effects.homing = 0;
    
    if (player.life <= 0) {
        gameOver();
    } else {
        player.invincible = 120;
        player.blinkTimer = 0;
    }
}

function gameOver() {
    game.isGameOver = true;
}

function startGame() {
    game.gameStarted = true;
}

function resetGame() {
    game.score = 0;
    game.isGameOver = false;
    game.gameStarted = false;
    game.bullets = [];
    game.enemies = [];
    game.strongEnemies = [];
    game.technicalEnemies = [];
    game.enemyBullets = [];
    game.items = [];
    game.explosions = [];
    game.bombFlash = 0;
    game.enemySpawnTimer = 0;
    game.enemySpawnInterval = 240;
    game.spawnRateTimer = 0;
    game.effects.barrier = 0;
    game.effects.timeStop = 0;
    game.effects.homing = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 60;
    player.shootCooldown = 0;
    player.life = 3;
    player.invincible = 0;
    player.blinkTimer = 0;
}

function update() {
    if (game.effects.barrier > 0) game.effects.barrier--;
    if (game.effects.timeStop > 0) game.effects.timeStop--;
    if (game.effects.homing > 0) game.effects.homing--;
    if (player.invincible > 0) player.invincible--;
    if (game.bombFlash > 0) game.bombFlash--;
    
    game.explosions.forEach(explosion => explosion.update());
    game.explosions = game.explosions.filter(explosion => !explosion.isFinished());
    
    game.clouds.forEach(cloud => cloud.update());
    
    updatePlayer();
    
    if (game.isGameOver || !game.gameStarted) return;
    
    spawnEnemies();
    
    game.bullets.forEach(bullet => bullet.update());
    game.bullets = game.bullets.filter(bullet => !bullet.isOffScreen());
    
    if (game.effects.timeStop <= 0) {
        game.enemyBullets.forEach(bullet => bullet.update());
        game.enemyBullets = game.enemyBullets.filter(bullet => !bullet.isOffScreen());
    }
    
    game.enemies.forEach(enemy => enemy.update());
    game.enemies = game.enemies.filter(enemy => !enemy.isOffScreen());
    
    game.strongEnemies.forEach(strongEnemy => strongEnemy.update());
    game.strongEnemies = game.strongEnemies.filter(strongEnemy => !strongEnemy.isOffScreen());
    
    game.technicalEnemies.forEach(technicalEnemy => technicalEnemy.update());
    game.technicalEnemies = game.technicalEnemies.filter(technicalEnemy => !technicalEnemy.isOffScreen());
    
    game.items.forEach(item => item.update());
    game.items = game.items.filter(item => !item.isOffScreen());
    
    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (game.effects.timeStop > 0) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (game.bombFlash > 0) {
        ctx.fillStyle = 'rgba(255, 165, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    game.clouds.forEach(cloud => cloud.draw());
    
    drawPlayer();
    game.bullets.forEach(bullet => bullet.draw());
    game.enemyBullets.forEach(bullet => bullet.draw());
    game.enemies.forEach(enemy => enemy.draw());
    game.strongEnemies.forEach(strongEnemy => strongEnemy.draw());
    game.technicalEnemies.forEach(technicalEnemy => technicalEnemy.draw());
    game.items.forEach(item => item.draw());
    game.explosions.forEach(explosion => explosion.draw());
    
    drawUI();
    
    if (!game.gameStarted) {
        ctx.fillStyle = '#000080';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('スペースキーでゲーム開始', canvas.width / 2, canvas.height / 2);
    }
    
    if (game.isGameOver) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = '#000080';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Rキーでリトライ', canvas.width / 2, canvas.height / 2 + 30);
    }
}

class Cloud {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 0.5;
        this.circles = [];
        const baseSize = 40 + Math.random() * 20;
        this.circles.push({ offsetX: 0, offsetY: 0, radius: baseSize });
        this.circles.push({ offsetX: baseSize * 0.6, offsetY: 0, radius: baseSize * 0.8 });
        this.circles.push({ offsetX: -baseSize * 0.5, offsetY: baseSize * 0.2, radius: baseSize * 0.7 });
        this.circles.push({ offsetX: baseSize * 0.3, offsetY: baseSize * 0.3, radius: baseSize * 0.6 });
    }

    update() {
        if (game.effects.timeStop <= 0) {
            this.x -= this.speed;
            if (this.x < -100) {
                this.x = canvas.width + 100;
                this.y = Math.random() * (canvas.height * 0.6);
            }
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(this.x + circle.offsetX, this.y + circle.offsetY, circle.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function initClouds() {
    for (let i = 0; i < 5; i++) {
        game.clouds.push(new Cloud(
            Math.random() * canvas.width,
            Math.random() * (canvas.height * 0.6)
        ));
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault(); // スペースキーのスクロールを防ぐ
    }
    game.keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        e.preventDefault(); // スペースキーのスクロールを防ぐ
    }
    game.keys[e.key] = false;
});

initClouds();
gameLoop();