"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { X, Trophy, Play } from "lucide-react";

export default function TingoJump({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { addCoins, submitScore } = useGame();
    const { user } = useAuth();

    // Game State Refs (Mutable for loop)
    const state = useRef({
        isPlaying: false,
        score: 0,
        coinsCollected: 0,
        gameOver: false,

        // Physics
        pet: { x: 0, y: 0, vx: 0, vy: 0, radius: 25 },
        platforms: [] as { x: number, y: number, w: number, h: number, type: 'cloud' | 'moving', hasCoin: boolean }[],
        cameraY: 0,

        // Inputs
        keys: { left: false, right: false }
    });

    const [uiState, setUiState] = useState({ score: 0, gameOver: false, highscore: 0 }); // For UI React render
    const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});

    // Load Assets
    useEffect(() => {
        const loadImg = (src: string) => {
            const img = new Image();
            img.src = src;
            return img;
        };

        const imgs = {
            pet: loadImg(user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"),
            cloud: loadImg("https://res.cloudinary.com/demo/image/upload/v1675718925/sample_cloud.png"), // Placeholder cloud or use local
            coin: loadImg("https://res.cloudinary.com/demo/image/upload/v1675718925/sample_coin.png"), // Placeholder coin
        };
        // For now use generated images if I pushed them to cloud? 
        // I will use some generic reliable URLs or simple shapes if images fail, but let's try to use shapes for reliability first, images on top.
        setImages(imgs);
    }, [user]);

    // Game Loop
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize
        const resize = () => {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = canvas.parentElement?.clientHeight || 600;

            // Reset position if start
            if (!state.current.isPlaying) {
                state.current.pet.x = canvas.width / 2;
                state.current.pet.y = canvas.height - 100;
                initPlatforms(canvas.width, canvas.height);
            }
        };
        resize();
        window.addEventListener('resize', resize);

        // Input
        const handleDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') state.current.keys.left = true;
            if (e.key === 'ArrowRight') state.current.keys.right = true;
        };
        const handleUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') state.current.keys.left = false;
            if (e.key === 'ArrowRight') state.current.keys.right = false;
        };
        // Touch
        const handleTouchStart = (e: TouchEvent) => {
            const touchX = e.touches[0].clientX;
            const centerX = window.innerWidth / 2;
            if (touchX < centerX) state.current.keys.left = true;
            else state.current.keys.right = true;
        };
        const handleTouchEnd = () => {
            state.current.keys.left = false;
            state.current.keys.right = false;
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        let animationFrameId: number;

        const loop = () => {
            update(canvas.width, canvas.height);
            draw(ctx, canvas.width, canvas.height);
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const initPlatforms = (w: number, h: number) => {
        const platforms = [];
        // Start platform
        platforms.push({ x: w / 2 - 50, y: h - 50, w: 100, h: 20, type: 'cloud', hasCoin: false });

        // Generate up
        for (let i = 1; i < 20; i++) {
            platforms.push(generatePlatform(w, h - (i * 100)));
        }
        state.current.platforms = platforms as any;
    };

    const generatePlatform = (w: number, y: number) => {
        return {
            x: Math.random() * (w - 100),
            y: y,
            w: 80 + Math.random() * 40,
            h: 20,
            type: Math.random() > 0.9 ? 'moving' : 'cloud',
            hasCoin: Math.random() > 0.7
        };
    };

    const update = (w: number, h: number) => {
        const s = state.current;
        if (!s.isPlaying || s.gameOver) return;

        // Horizontal Movement
        if (s.keys.left) s.pet.vx -= 1;
        if (s.keys.right) s.pet.vx += 1;
        s.pet.vx *= 0.9; // Friction
        s.pet.x += s.pet.vx;

        // Wrap around
        if (s.pet.x < -s.pet.radius) s.pet.x = w;
        if (s.pet.x > w) s.pet.x = -s.pet.radius;

        // Vertical Physics
        s.pet.vy += 0.5; // Gravity
        s.pet.y += s.pet.vy;

        // Camera Logic (Move specific items down when pet goes up)
        if (s.pet.y < h * 0.4) {
            const diff = (h * 0.4) - s.pet.y;
            s.pet.y = h * 0.4; // Lock pet visuals
            s.score += Math.floor(diff);

            // Move platforms down
            s.platforms.forEach(p => p.y += diff);

            // Remove old platforms and add new
            s.platforms = s.platforms.filter(p => p.y < h + 50);

            // Add new platforms
            const lastP = s.platforms.reduce((min, p) => p.y < min ? p.y : min, h);
            if (lastP > 100) { // Gap
                // Generate new platform at top
                s.platforms.push(generatePlatform(w, lastP - 100) as any);
            }
        }

        // Collision Detection
        if (s.pet.vy > 0) { // Only bounce when falling
            s.platforms.forEach(p => {
                if (
                    s.pet.x > p.x - 20 &&
                    s.pet.x < p.x + p.w + 20 &&
                    s.pet.y + s.pet.radius > p.y &&
                    s.pet.y + s.pet.radius < p.y + p.h + 20 // Tolerance
                ) {
                    s.pet.vy = -12; // JUMP STRENGTH
                }
            });
        }

        // Coin Collection
        s.platforms.forEach(p => {
            if (p.hasCoin) {
                // Distance check
                const dx = s.pet.x - (p.x + p.w / 2);
                const dy = s.pet.y - (p.y - 20);
                if (Math.sqrt(dx * dx + dy * dy) < 40) {
                    p.hasCoin = false;
                    s.coinsCollected += 1;
                    // Play sound effect visual?
                }
            }
        });

        // Game Over
        if (s.pet.y > h + 100) {
            s.gameOver = true;
            finishGame();
        }

        // Sync UI occasionally
        if (Math.random() > 0.9) {
            setUiState(prev => ({ ...prev, score: s.score }));
        }
    };

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        // Clear
        // Gradient Sky
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, "#87CEEB");
        gradient.addColorStop(1, "#E0F7FA");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        const s = state.current;

        // Draw Platforms
        s.platforms.forEach(p => {
            // Shadow
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.beginPath();
            ctx.roundRect(p.x + 5, p.y + 5, p.w, p.h, 10);
            ctx.fill();

            // Cloud
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 10);
            ctx.fill();

            // Coins
            if (p.hasCoin) {
                ctx.fillStyle = "#FFC107";
                ctx.beginPath();
                ctx.arc(p.x + p.w / 2, p.y - 15, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#FFA000";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw Pet
        ctx.save();
        ctx.translate(s.pet.x, s.pet.y);

        // Draw Avatar
        ctx.beginPath();
        ctx.arc(0, 0, s.pet.radius, 0, Math.PI * 2);
        ctx.clip();
        if (images.pet && images.pet.complete) {
            ctx.drawImage(images.pet, -s.pet.radius, -s.pet.radius, s.pet.radius * 2, s.pet.radius * 2);
        } else {
            ctx.fillStyle = "orange";
            ctx.fillRect(-s.pet.radius, -s.pet.radius, s.pet.radius * 2, s.pet.radius * 2);
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(s.pet.x, s.pet.y, s.pet.radius, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.stroke();

    };

    const startGame = () => {
        state.current = {
            ...state.current,
            isPlaying: true,
            gameOver: false,
            score: 0,
            coinsCollected: 0,
            pet: { x: window.innerWidth / 2, y: 500, vx: 0, vy: -10, radius: 25 },
            cameraY: 0
        };
        initPlatforms(window.innerWidth, window.innerHeight);
        setUiState({ score: 0, gameOver: false, highscore: uiState.highscore });
    };

    const finishGame = async () => {
        setUiState(prev => ({ ...prev, gameOver: true, score: state.current.score }));

        // Save
        const totalCoins = Math.floor(state.current.score / 100) + state.current.coinsCollected;
        await submitScore('tingo-jump', state.current.score);
        if (totalCoins > 0) await addCoins(totalCoins);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex flex-col">
                    <span className="text-white font-black text-4xl drop-shadow-md">{Math.floor(state.current.isPlaying ? state.current.score : uiState.score)}</span>
                    <span className="text-yellow-300 font-bold text-lg drop-shadow-md">Coins: {state.current.coinsCollected}</span>
                </div>
                <button onClick={onClose} className="bg-black/20 p-2 rounded-full pointer-events-auto">
                    <X className="w-8 h-8 text-white" />
                </button>
            </div>

            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Start / Game Over Screen */}
            {(!state.current.isPlaying || uiState.gameOver) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <h1 className="text-6xl font-black text-white mb-2 bg-clip-text text-transparent bg-gradient-to-tr from-blue-400 to-green-400">TINGO JUMP</h1>

                    {uiState.gameOver && (
                        <div className="text-center mb-8 animate-in zoom-in">
                            <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
                            <p className="text-white text-xl">Score: {Math.floor(uiState.score)}</p>
                            <p className="text-yellow-400 text-lg">Coins Earned: +{Math.floor(uiState.score / 100) + state.current.coinsCollected}</p>
                        </div>
                    )}

                    <button
                        onClick={startGame}
                        className="bg-green-500 hover:bg-green-600 text-white px-12 py-6 rounded-full font-black text-3xl shadow-xl transform hover:scale-105 transition-all flex items-center gap-4"
                    >
                        <Play className="fill-current w-8 h-8" /> {uiState.gameOver ? "TRY AGAIN" : "PLAY NOW"}
                    </button>
                    <p className="text-white/60 mt-8 text-sm">Tap left/right or use Arrow Keys to move</p>
                </div>
            )}
        </div>
    );
}
