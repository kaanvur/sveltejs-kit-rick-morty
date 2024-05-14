let intersectionObserver: IntersectionObserver | undefined;

function ensureIntersectionObserver() {
    if (intersectionObserver) return;

    intersectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const eventName = entry.isIntersecting ? 'enterViewport' : 'exitViewport';
                entry.target.dispatchEvent(new CustomEvent(eventName));
            });
        }
    );
}

export default function viewport(element: HTMLElement) {
    ensureIntersectionObserver();
    if (!intersectionObserver) {
        throw new Error('IntersectionObserver is not initialized');
    }
    intersectionObserver.observe(element);

    return {
        destroy() {
            if (intersectionObserver) {
                intersectionObserver.unobserve(element);
            }
        }
    }
}