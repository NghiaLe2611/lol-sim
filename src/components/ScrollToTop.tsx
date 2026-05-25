import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function scrollWindowToTop() {
	window.scrollTo(0, 0);
	document.documentElement.scrollTop = 0;
	document.body.scrollTop = 0;
}

export default function ScrollToTop() {
	const location = useLocation();

	useEffect(() => {
		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual';
		}
	}, []);

	useLayoutEffect(() => {
		scrollWindowToTop();
	}, [location.pathname, location.search, location.hash, location.key]);

	return null;
}
