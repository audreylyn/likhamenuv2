import React, { useEffect, useRef, useState, ReactNode } from 'react';

// =====================================================
// SCROLL ANIMATION WRAPPER
// Uses Intersection Observer for performant scroll-triggered animations
// =====================================================

interface ScrollAnimationProps {
    children: ReactNode;
    className?: string;
    animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in';
    delay?: number;
    threshold?: number;
    once?: boolean;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
    children,
    className = '',
    animation = 'fade-up',
    delay = 0,
    threshold = 0.1,
    once = true,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once && ref.current) {
                        observer.unobserve(ref.current);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold, once]);

    const animationStyles: Record<string, { initial: string; visible: string }> = {
        'fade-up': {
            initial: 'opacity-0 translate-y-8',
            visible: 'opacity-100 translate-y-0',
        },
        'fade-in': {
            initial: 'opacity-0',
            visible: 'opacity-100',
        },
        'slide-left': {
            initial: 'opacity-0 translate-x-8',
            visible: 'opacity-100 translate-x-0',
        },
        'slide-right': {
            initial: 'opacity-0 -translate-x-8',
            visible: 'opacity-100 translate-x-0',
        },
        'zoom-in': {
            initial: 'opacity-0 scale-95',
            visible: 'opacity-100 scale-100',
        },
    };

    const styles = animationStyles[animation];

    return (
        <div
            ref={ref}
            className={`transform transition-all duration-700 ease-out ${isVisible ? styles.visible : styles.initial
                } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// =====================================================
// STAGGERED ANIMATION CONTAINER
// Automatically staggers animations for child elements
// =====================================================

interface StaggeredAnimationProps {
    children: ReactNode[];
    className?: string;
    animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in';
    staggerDelay?: number;
    threshold?: number;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
    children,
    className = '',
    animation = 'fade-up',
    staggerDelay = 100,
    threshold = 0.1,
}) => {
    return (
        <div className={className}>
            {React.Children.map(children, (child, index) => (
                <ScrollAnimation
                    animation={animation}
                    delay={index * staggerDelay}
                    threshold={threshold}
                >
                    {child}
                </ScrollAnimation>
            ))}
        </div>
    );
};

export default ScrollAnimation;
