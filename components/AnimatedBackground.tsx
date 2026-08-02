import React, { useEffect, useRef } from 'react';

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let animationFrameId: number;
    let time = 0;

    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 120
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.x;
      mouse.y = event.y;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    class Particle {
      theta: number;
      phi: number;
      radius: number;
      size: number;
      color: string;
      phase: number;
      pulseSpeed: number;
      density: number;

      // 3D coordinates
      x3d: number = 0;
      y3d: number = 0;
      z3d: number = 0;

      constructor() {
        this.theta = Math.random() * Math.PI * 2; // Longitude
        this.phi = Math.acos((Math.random() * 2) - 1); // Latitude (even distribution)
        // Widen the network across the screen
        this.radius = Math.max(canvas.width, canvas.height) * 0.45; // Wider Globe radius
        
        this.size = Math.random() * 2 + 0.5;
        this.density = (Math.random() * 20) + 1;
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.05 + Math.random() * 0.05;
        
        // Use MYF colors: Emeralds and Golds
        const colors = ['#047857', '#d4a045', '#10b981', '#f59e0b', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.phase += this.pulseSpeed;
        
        // Base 3D position on a sphere
        this.x3d = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.y3d = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        this.z3d = this.radius * Math.cos(this.phi);

        // Apply slow continuous rotation (around Y axis mostly, slight X axis)
        const rotationY = time * 0.002;
        const rotationX = time * 0.001;

        // Rotate around X axis
        const y1 = this.y3d * Math.cos(rotationX) - this.z3d * Math.sin(rotationX);
        const z1 = this.y3d * Math.sin(rotationX) + this.z3d * Math.cos(rotationX);
        
        // Rotate around Y axis
        const x2 = this.x3d * Math.cos(rotationY) + z1 * Math.sin(rotationY);
        const z2 = -this.x3d * Math.sin(rotationY) + z1 * Math.cos(rotationY);
        const y2 = y1;

        this.x3d = x2;
        this.y3d = y2;
        this.z3d = z2;
      }

      draw() {
        if (!ctx) return;
        
        // 3D projection
        const focalLength = this.radius * 2.5; // Dynamically scale focal length to avoid negative perspective
        const zOffset = focalLength + this.radius; // Push sphere back so it's fully visible
        
        // Add perspective scale
        const scaleProjected = Math.max(0.01, focalLength / (focalLength + this.z3d));
        
        // Screen coordinates
        const xProjected = (this.x3d * scaleProjected) + (canvas.width / 2);
        const yProjected = (this.y3d * scaleProjected) + (canvas.height / 2);

        // Fade objects further away
        const depthAlpha = Math.max(0.1, (this.z3d + this.radius) / (this.radius * 2));
        const pulseAlpha = 0.3 + (Math.sin(this.phase) + 1) * 0.35;
        ctx.globalAlpha = depthAlpha * pulseAlpha;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Scale size by perspective safely
        ctx.arc(xProjected, yProjected, Math.max(0, this.size * scaleProjected), 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = Math.max(0, 15 * scaleProjected);
        ctx.shadowColor = this.color;
        ctx.globalAlpha = 1.0;
      }
    }

    function init() {
      particlesArray = [];
      // Adjust particle count depending on screen size
      const numberOfParticles = Math.min(600, (canvas.width * canvas.height) / 10000);
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }

    function connect() {
      // We project coordinates for connecting lines as well to maintain 3D look
      
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const p1 = particlesArray[a];
          const p2 = particlesArray[b];
          const focalLength = p1.radius * 2.5;
          
          // Calculate 3D distance
          const dx = p1.x3d - p2.x3d;
          const dy = p1.y3d - p2.y3d;
          const dz = p1.z3d - p2.z3d;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Connect if close enough in 3D space
          if (distance < p1.radius * 0.3) {
            let opacityValue = 1 - (distance / (p1.radius * 0.3));
            
            // Average depth to scale line width and opacity
            const avgZ = (p1.z3d + p2.z3d) / 2;
            const scaleProjected = Math.max(0.01, focalLength / (focalLength + avgZ));
            const depthAlpha = Math.max(0.1, (avgZ + p1.radius) / (p1.radius * 2));

            if (opacityValue > 0 && ctx) {
              ctx.strokeStyle = `rgba(212, 160, 69, ${opacityValue * depthAlpha * 0.2})`;
              ctx.lineWidth = Math.max(0.1, 1 * scaleProjected);
              
              const x1 = (p1.x3d * Math.max(0.01, focalLength / (focalLength + p1.z3d))) + (canvas.width / 2);
              const y1 = (p1.y3d * Math.max(0.01, focalLength / (focalLength + p1.z3d))) + (canvas.height / 2);
              
              const x2 = (p2.x3d * Math.max(0.01, focalLength / (focalLength + p2.z3d))) + (canvas.width / 2);
              const y2 = (p2.y3d * Math.max(0.01, focalLength / (focalLength + p2.z3d))) + (canvas.height / 2);

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          }
        }
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 1.15; // Increased speed
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      
      // Sort particles by Z-index before drawing so closer ones are drawn on top of farther ones
      particlesArray.sort((a, b) => b.z3d - a.z3d);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
      }
      
      connect();
      animationFrameId = requestAnimationFrame(animate);
    }

    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0 bg-transparent pointer-events-none">
      {/* 3D gradient glowing orbs for depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#047857]/10 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#d4a045]/10 blur-[150px] mix-blend-screen pointer-events-none" />
      
      {/* The Interactive Particle Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-[0.70]"
        style={{ filter: 'drop-shadow(0 0 10px rgba(212,160,69,0.3))' }}
      />
      
      {/* Dark vignette overlay for contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(10,25,47,1))] opacity-60 pointer-events-none" />
    </div>
  );
};

export default AnimatedBackground;
