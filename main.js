
const W = 800, H = 480, REQUIRED_HEARTS = 5;

function updateRotateHint() {
  const hint = document.getElementById('rotateHint');
  const isPortrait = window.innerHeight > window.innerWidth;
  hint.style.display = isPortrait ? 'flex' : 'none';
}
window.addEventListener('resize', updateRotateHint);
window.addEventListener('orientationchange', updateRotateHint);

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000000',
  render: { pixelArt: true, antialias: false, roundPixels: true },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,
      debugShowBody: false,
      debugShowStaticBody: false
    }
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, Level1Scene, WinScene]
};
new Phaser.Game(config);
updateRotateHint();

function BootScene(){ Phaser.Scene.call(this,{key:'boot'}); }
BootScene.prototype = Object.create(Phaser.Scene.prototype);
BootScene.prototype.constructor = BootScene;
BootScene.prototype.preload = function(){
  this.load.image('bg1','assets/bg_level1.png');
  this.load.image('tile','assets/tile_platform.png');
  this.load.image('heart','assets/heart.png');
  this.load.image('door','assets/door.png');
  this.load.image('snore','assets/snore.png');
  this.load.image('fredrik','assets/fredrik.png');
};
BootScene.prototype.create = function(){ this.scene.start('title'); };

function TitleScene(){ Phaser.Scene.call(this,{key:'title'}); }
TitleScene.prototype = Object.create(Phaser.Scene.prototype);
TitleScene.prototype.constructor = TitleScene;
TitleScene.prototype.create = function(){
  this.add.image(W/2,H/2,'bg1').setAlpha(1);
  this.add.rectangle(W/2,H/2,720,360,0x000000,0.28).setStrokeStyle(4,0xffffff,0.35);
  this.add.text(W/2,72,'Heart Quest: Wake Jenny',{fontFamily:'Arial',fontSize:'42px',color:'#ffffff',stroke:'#2b1a2a',strokeThickness:8}).setOrigin(0.5);

  const intro = [
    'Allt börjar perfekt.',
    'Jenny somnar.',
    '',
    'Plötsligt…',
    'hon börjar snarka som ett monster 😴👹',
    '',
    'Fredrik måste ta sig igenom drömvärldar, samla hjärtan',
    'och väcka henne innan hon blir helt possessed.'
  ].join('\n');

  this.add.text(W/2,H/2,intro,{fontFamily:'Arial',fontSize:'22px',color:'#ffffff',align:'center',lineSpacing:10}).setOrigin(0.5);
  this.add.text(W/2,H-70,'Tryck för att börja',{fontFamily:'Arial',fontSize:'22px',color:'#ffffff'}).setOrigin(0.5);
  const z=this.add.image(W-92,92,'snore').setScale(2.2).setAlpha(0.8);
  this.tweens.add({targets:z,y:72,duration:1200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  this.input.once('pointerdown',()=>this.scene.start('level1'));
};

function Level1Scene(){ Phaser.Scene.call(this,{key:'level1'}); }
Level1Scene.prototype = Object.create(Phaser.Scene.prototype);
Level1Scene.prototype.constructor = Level1Scene;

Level1Scene.prototype.create = function(){
  this.add.image(W/2,H/2,'bg1').setScrollFactor(0);

  this.physics.world.setBounds(0,0,2200,H);

  const platforms=this.physics.add.staticGroup();
  const addPlat=(x,y,tiles=6)=>{ for(let i=0;i<tiles;i++) platforms.create(x+i*16,y,'tile').setOrigin(0,0).refreshBody(); };
  for(let x=0;x<2200;x+=16) platforms.create(x,H-32,'tile').setOrigin(0,0).refreshBody();

  addPlat(200,360,8); addPlat(430,300,6); addPlat(620,240,6);
  addPlat(820,310,7); addPlat(1040,260,6); addPlat(1240,210,6);
  addPlat(1450,290,7); addPlat(1680,240,6); addPlat(1900,320,8);

  this.player=this.physics.add.sprite(80,H-120,'fredrik').setScale(1.5);
  this.player.setCollideWorldBounds(true);
  this.player.body.setSize(22,42).setOffset(5,4);
  this.physics.add.collider(this.player,platforms);

  this.cameras.main.setBounds(0,0,2200,H);
  this.cameras.main.startFollow(this.player,true,0.12,0.12);
  this.cameras.main.setZoom(1.15);

  this.hearts=this.physics.add.group({allowGravity:false,immovable:true});
  const spots=[[240,330],[470,270],[660,210],[860,280],[1080,230],[1280,180],[1500,260],[1720,210],[1940,290]];
  spots.forEach(([x,y])=>{
    const h=this.hearts.create(x,y,'heart').setScale(2.0);
    this.tweens.add({targets:h,y:y-6,duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  });
  this.heartsCollected=0;

  this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
    h.disableBody(true,true);
    this.heartsCollected++;
    this.hudHearts.setText(`❤️ ${this.heartsCollected}/${REQUIRED_HEARTS}`);
  });

  this.door=this.physics.add.staticImage(2100,H-56,'door').setOrigin(0.5,1).setScale(2.2);
  this.physics.add.overlap(this.player,this.door,()=>{
    if(this.heartsCollected>=REQUIRED_HEARTS) this.scene.start('win',{hearts:this.heartsCollected});
    else this.showToast(`Du behöver fler hjärtan! (${this.heartsCollected}/${REQUIRED_HEARTS})`);
  });

  this.hudHearts=this.add.text(16,16,`❤️ 0/${REQUIRED_HEARTS}`,{fontFamily:'Arial',fontSize:'26px',color:'#fff',stroke:'#2b1a2a',strokeThickness:8}).setScrollFactor(0);
  this.toast=this.add.text(W/2,62,'',{fontFamily:'Arial',fontSize:'22px',color:'#fff',stroke:'#2b1a2a',strokeThickness:8}).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

  this.cursors=this.input.keyboard.createCursorKeys();
  this.touch={left:false,right:false,jump:false};
  this.createTouchControls();
};

Level1Scene.prototype.createTouchControls=function(){
  const padY=H-82;
  const makeBtn=(x,label)=>{
    const bg=this.add.rectangle(x,padY,96,74,0xffffff,0.10).setStrokeStyle(4,0xffffff,0.35).setScrollFactor(0);
    this.add.text(x,padY,label,{fontFamily:'Arial',fontSize:'30px',color:'#fff',stroke:'#2b1a2a',strokeThickness:6}).setOrigin(0.5).setScrollFactor(0);
    bg.setInteractive();
    return bg;
  };
  const left=makeBtn(92,'◀'), right=makeBtn(206,'▶'), jump=makeBtn(W-110,'⤒');
  left.on('pointerdown',()=>this.touch.left=true);
  left.on('pointerup',()=>this.touch.left=false);
  left.on('pointerout',()=>this.touch.left=false);
  right.on('pointerdown',()=>this.touch.right=true);
  right.on('pointerup',()=>this.touch.right=false);
  right.on('pointerout',()=>this.touch.right=false);
  jump.on('pointerdown',()=>this.touch.jump=true);
  jump.on('pointerup',()=>this.touch.jump=false);
  jump.on('pointerout',()=>this.touch.jump=false);
};

Level1Scene.prototype.showToast=function(msg){
  this.toast.setText(msg); this.toast.setAlpha(1);
  this.tweens.killTweensOf(this.toast);
  this.tweens.add({targets:this.toast,alpha:0,duration:850,delay:850});
};

Level1Scene.prototype.update=function(){
  const speed=270, jumpSpeed=540;
  const left=this.cursors.left.isDown||this.touch.left;
  const right=this.cursors.right.isDown||this.touch.right;
  const jump=Phaser.Input.Keyboard.JustDown(this.cursors.up)||Phaser.Input.Keyboard.JustDown(this.cursors.space)||this.touch.jump;

  if(left) this.player.setVelocityX(-speed);
  else if(right) this.player.setVelocityX(speed);
  else this.player.setVelocityX(0);

  if(jump && this.player.body.blocked.down) this.player.setVelocityY(-jumpSpeed);
  if(this.touch.jump) this.touch.jump=false;
};

function WinScene(){ Phaser.Scene.call(this,{key:'win'}); }
WinScene.prototype=Object.create(Phaser.Scene.prototype);
WinScene.prototype.constructor=WinScene;
WinScene.prototype.init=function(data){ this.dataFromLevel=data||{}; };
WinScene.prototype.create=function(){
  this.add.image(W/2,H/2,'bg1').setAlpha(1);
  this.add.rectangle(W/2,H/2,720,320,0x000000,0.28).setStrokeStyle(4,0xffffff,0.35);
  this.add.text(W/2,120,'DEMO KLAR!',{fontFamily:'Arial',fontSize:'44px',color:'#fff',stroke:'#2b1a2a',strokeThickness:10}).setOrigin(0.5);

  const msg=[
    `Du samlade ${this.dataFromLevel.hearts||0} hjärtan ❤️`,'',
    'Den riktiga versionen får 5 banor,',
    'snark-monster-Jenny, Fredrik-jumpscares,',
    'och finalscenen (C).'
  ].join('\n');

  this.add.text(W/2,H/2+40,msg,{fontFamily:'Arial',fontSize:'22px',color:'#fff',align:'center',lineSpacing:10}).setOrigin(0.5);
  this.add.text(W/2,H-70,'Tryck för att spela igen',{fontFamily:'Arial',fontSize:'22px',color:'#fff'}).setOrigin(0.5);
  this.input.once('pointerdown',()=>this.scene.start('title'));
};
