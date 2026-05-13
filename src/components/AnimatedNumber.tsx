import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
	to: number;
	duration?: number; // ms, default 1000
}

export default function AnimatedNumber({ to, duration = 1000 }: AnimatedNumberProps) {
	const [value, setValue] = useState(0);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		const start = performance.now();

		const tick = (now: number) => {
			const progress = Math.min((now - start) / duration, 1);
			// ease-out cubic
			const eased = 1 - Math.pow(1 - progress, 3);
			setValue(Math.round(eased * to));
			if (progress < 1) rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [to, duration]);

	return value;
}
