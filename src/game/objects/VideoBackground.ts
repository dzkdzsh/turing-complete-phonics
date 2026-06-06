// VideoBackground — renders a video as the background texture inside a Phaser scene

import * as Phaser from 'phaser';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4';

export class VideoBackground extends Phaser.GameObjects.Image {
  private video: HTMLVideoElement;

  constructor(scene: Phaser.Scene) {
    // Create hidden video element
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = VIDEO_URL;
    video.play().catch(() => {});

    const { width, height } = scene.scale;

    // Create a canvas texture from the video
    const textureKey = '__video_bg__';
    const tex = scene.textures.createCanvas(textureKey, width, height);
    if (!tex) {
      super(scene, width / 2, height / 2, '__MISSING');
      return;
    }

    super(scene, width / 2, height / 2, textureKey);
    this.video = video;
    this.setDisplaySize(width, height);
    this.setDepth(-100);
    this.setAlpha(0.6); // visible video, game content draws on top

    // Update texture each frame from the video
    scene.events.on('update', () => {
      if (!this.scene) return;
      const ctx = (tex.getSourceImage() as HTMLCanvasElement)?.getContext('2d');
      if (!ctx) return;
      try {
        ctx.drawImage(this.video, 0, 0, width, height);
        tex.refresh();
      } catch {}
    });

    scene.add.existing(this);
  }

  destroy(fromScene?: boolean) {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
    super.destroy(fromScene);
  }
}
