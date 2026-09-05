"use client";

import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { gsap } from "gsap";
import "./staggeredmenu.css";
export interface StaggeredMenuItem {
    label: string;
    ariaLabel: string;
    link: string;
}

export interface StaggeredMenuSocialItem {
    label: string;
    link: string;
}

export interface StaggeredMenuProps {
    position?: "left" | "right";
    colors?: string[];
    items?: StaggeredMenuItem[];
    socialItems?: StaggeredMenuSocialItem[];
    displaySocials?: boolean;
    displayItemNumbering?: boolean;
    className?: string;
    logoUrl?: string;
    menuButtonColor?: string;
    openMenuButtonColor?: string;
    accentColor?: string;
    changeMenuColorOnOpen?: boolean;
    closeOnClickAway?: boolean;
    onMenuOpen?: () => void;
    onMenuClose?: () => void;
    isFixed?: boolean;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
    position = "right",
    colors = ["#B497CF", "#5227FF"],
    items = [],
    socialItems = [],
    displaySocials = true,
    displayItemNumbering = true,
    className,
    logoUrl,
    menuButtonColor = "#fff",
    openMenuButtonColor = "#fff",
    changeMenuColorOnOpen = true,
    accentColor = "#5227FF",
    isFixed = false,
    closeOnClickAway = true,
    onMenuOpen,
    onMenuClose,
}) => {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);

    const panelRef = useRef<HTMLElement | null>(null);
    const preLayersRef = useRef<HTMLDivElement | null>(null);
    const preLayerElsRef = useRef<HTMLElement[]>([]);

    const iconRef = useRef<HTMLSpanElement | null>(null);
    const plusHRef = useRef<HTMLSpanElement | null>(null);
    const plusVRef = useRef<HTMLSpanElement | null>(null);

    const textInnerRef = useRef<HTMLSpanElement | null>(null);
    const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

    const [textLines, setTextLines] = useState<string[]>(["Menu", "Close"]);

    const openTlRef = useRef<gsap.core.Timeline | null>(null);
    const closeTweenRef = useRef<gsap.core.Tween | null>(null);
    const spinTweenRef = useRef<gsap.core.Tween | null>(null);
    const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
    const colorTweenRef = useRef<gsap.core.Tween | null>(null);

    const busyRef = useRef(false);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const panel = panelRef.current;
            const preContainer = preLayersRef.current;
            const plusH = plusHRef.current;
            const plusV = plusVRef.current;
            const icon = iconRef.current;
            const textInner = textInnerRef.current;

            if (!panel || !plusH || !plusV || !icon || !textInner) {
                return;
            }

            const preLayers = preContainer
                ? (Array.from(
                      preContainer.querySelectorAll(".sm-prelayer"),
                  ) as HTMLElement[])
                : [];

            preLayerElsRef.current = preLayers;

            const offscreen = position === "left" ? -100 : 100;

            gsap.set([panel, ...preLayers], {
                xPercent: offscreen,
                opacity: 1,
            });

            if (preContainer) {
                gsap.set(preContainer, {
                    xPercent: 0,
                    opacity: 1,
                });
            }

            gsap.set(plusH, {
                transformOrigin: "50% 50%",
                rotate: 0,
            });

            gsap.set(plusV, {
                transformOrigin: "50% 50%",
                rotate: 90,
            });

            gsap.set(icon, {
                rotate: 0,
                transformOrigin: "50% 50%",
            });

            gsap.set(textInner, {
                yPercent: 0,
            });

            if (toggleBtnRef.current) {
                gsap.set(toggleBtnRef.current, {
                    color: menuButtonColor,
                });
            }
        });

        return () => ctx.revert();
    }, [menuButtonColor, position]);

  
    const buildOpenTimeline = useCallback(() => {
        const panel = panelRef.current;
        const layers = preLayerElsRef.current;

        if (!panel) {
            return null;
        }

        openTlRef.current?.kill();
        closeTweenRef.current?.kill();

        closeTweenRef.current = null;

        const itemEls = Array.from(
            panel.querySelectorAll(".sm-panel-itemLabel"),
        ) as HTMLElement[];

        const numberEls = Array.from(
            panel.querySelectorAll(
                ".sm-panel-list[data-numbering] .sm-panel-item",
            ),
        ) as HTMLElement[];

        const socialTitle = panel.querySelector(
            ".sm-socials-title",
        ) as HTMLElement | null;

        const socialLinks = Array.from(
            panel.querySelectorAll(".sm-socials-link"),
        ) as HTMLElement[];

        const offscreen = position === "left" ? -100 : 100;

        if (itemEls.length) {
            gsap.set(itemEls, {
                yPercent: 140,
                rotate: 10,
            });
        }

        if (numberEls.length) {
            gsap.set(numberEls, {
                "--sm-num-opacity": 0,
            });
        }

        if (socialTitle) {
            gsap.set(socialTitle, {
                opacity: 0,
            });
        }

        if (socialLinks.length) {
            gsap.set(socialLinks, {
                y: 25,
                opacity: 0,
            });
        }

        const tl = gsap.timeline({
            paused: true,
        });

        layers.forEach((layer, index) => {
            tl.fromTo(
                layer,
                {
                    xPercent: offscreen,
                },
                {
                    xPercent: 0,
                    duration: 0.5,
                    ease: "power4.out",
                },
                index * 0.07,
            );
        });

        const lastLayerTime = layers.length ? (layers.length - 1) * 0.07 : 0;

        const panelInsertTime = lastLayerTime + (layers.length ? 0.08 : 0);

        const panelDuration = 0.65;

        tl.fromTo(
            panel,
            {
                xPercent: offscreen,
            },
            {
                xPercent: 0,
                duration: panelDuration,
                ease: "power4.out",
            },
            panelInsertTime,
        );

        if (itemEls.length) {
            const itemsStart = panelInsertTime + panelDuration * 0.15;

            tl.to(
                itemEls,
                {
                    yPercent: 0,
                    rotate: 0,
                    duration: 1,
                    ease: "power4.out",
                    stagger: {
                        each: 0.1,
                        from: "start",
                    },
                },
                itemsStart,
            );

            if (numberEls.length) {
                tl.to(
                    numberEls,
                    {
                        duration: 0.6,
                        ease: "power2.out",
                        "--sm-num-opacity": 1,
                        stagger: {
                            each: 0.08,
                            from: "start",
                        },
                    },
                    itemsStart + 0.1,
                );
            }
        }

        if (socialTitle || socialLinks.length) {
            const socialsStart = panelInsertTime + panelDuration * 0.4;

            if (socialTitle) {
                tl.to(
                    socialTitle,
                    {
                        opacity: 1,
                        duration: 0.5,
                        ease: "power2.out",
                    },
                    socialsStart,
                );
            }

            if (socialLinks.length) {
                tl.to(
                    socialLinks,
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.55,
                        ease: "power3.out",
                        stagger: {
                            each: 0.08,
                            from: "start",
                        },
                    },
                    socialsStart + 0.04,
                );
            }
        }

        openTlRef.current = tl;

        return tl;
    }, [position]);

  
    const playOpen = useCallback(() => {
        if (busyRef.current) {
            return;
        }

        busyRef.current = true;

        const tl = buildOpenTimeline();

        if (!tl) {
            busyRef.current = false;
            return;
        }

        tl.eventCallback("onComplete", () => {
            busyRef.current = false;
        });

        tl.play(0);
    }, [buildOpenTimeline]);

    
    const playClose = useCallback(() => {
        openTlRef.current?.kill();
        openTlRef.current = null;

        const panel = panelRef.current;
        const layers = preLayerElsRef.current;

        if (!panel) {
            return;
        }

        const all = [...layers, panel];
        const offscreen = position === "left" ? -100 : 100;

        closeTweenRef.current?.kill();

        closeTweenRef.current = gsap.to(all, {
            xPercent: offscreen,
            duration: 0.32,
            ease: "power3.in",
            overwrite: "auto",

            onComplete: () => {
                const itemEls = Array.from(
                    panel.querySelectorAll(".sm-panel-itemLabel"),
                ) as HTMLElement[];

                if (itemEls.length) {
                    gsap.set(itemEls, {
                        yPercent: 140,
                        rotate: 10,
                    });
                }

                const numberEls = Array.from(
                    panel.querySelectorAll(
                        ".sm-panel-list[data-numbering] .sm-panel-item",
                    ),
                ) as HTMLElement[];

                if (numberEls.length) {
                    gsap.set(numberEls, {
                        "--sm-num-opacity": 0,
                    });
                }

                const socialTitle = panel.querySelector(
                    ".sm-socials-title",
                ) as HTMLElement | null;

                const socialLinks = Array.from(
                    panel.querySelectorAll(".sm-socials-link"),
                ) as HTMLElement[];

                if (socialTitle) {
                    gsap.set(socialTitle, {
                        opacity: 0,
                    });
                }

                if (socialLinks.length) {
                    gsap.set(socialLinks, {
                        y: 25,
                        opacity: 0,
                    });
                }

                busyRef.current = false;
            },
        });
    }, [position]);

    const animateIcon = useCallback((opening: boolean) => {
        const icon = iconRef.current;

        if (!icon) {
            return;
        }

        spinTweenRef.current?.kill();

        spinTweenRef.current = gsap.to(icon, {
            rotate: opening ? 225 : 0,
            duration: opening ? 0.8 : 0.35,
            ease: opening ? "power4.out" : "power3.inOut",
            overwrite: "auto",
        });
    }, []);


    const animateColor = useCallback(
        (opening: boolean) => {
            const button = toggleBtnRef.current;

            if (!button) {
                return;
            }

            colorTweenRef.current?.kill();

            if (changeMenuColorOnOpen) {
                const targetColor = opening
                    ? openMenuButtonColor
                    : menuButtonColor;

                colorTweenRef.current = gsap.to(button, {
                    color: targetColor,
                    delay: 0.18,
                    duration: 0.3,
                    ease: "power2.out",
                });
            } else {
                gsap.set(button, {
                    color: menuButtonColor,
                });
            }
        },
        [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor],
    );


    useEffect(() => {
        const button = toggleBtnRef.current;

        if (!button) {
            return;
        }

        const targetColor =
            changeMenuColorOnOpen && openRef.current
                ? openMenuButtonColor
                : menuButtonColor;

        gsap.set(button, {
            color: targetColor,
        });
    }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  
    const animateText = useCallback((opening: boolean) => {
        const inner = textInnerRef.current;

        if (!inner) {
            return;
        }

        textCycleAnimRef.current?.kill();

        const currentLabel = opening ? "Menu" : "Close";
        const targetLabel = opening ? "Close" : "Menu";

        const cycles = 3;

        const sequence: string[] = [currentLabel];

        let last = currentLabel;

        for (let i = 0; i < cycles; i++) {
            last = last === "Menu" ? "Close" : "Menu";
            sequence.push(last);
        }

        if (last !== targetLabel) {
            sequence.push(targetLabel);
        }

        sequence.push(targetLabel);

        setTextLines(sequence);

        gsap.set(inner, {
            yPercent: 0,
        });

        const lineCount = sequence.length;

        const finalShift = ((lineCount - 1) / lineCount) * 100;

        textCycleAnimRef.current = gsap.to(inner, {
            yPercent: -finalShift,
            duration: 0.5 + lineCount * 0.07,
            ease: "power4.out",
        });
    }, []);

 
    const closeMenu = useCallback(() => {
        if (!openRef.current) {
            return;
        }

        openRef.current = false;
        setOpen(false);

        onMenuClose?.();

        playClose();
        animateIcon(false);
        animateColor(false);
        animateText(false);

        // Return keyboard focus to the menu button.
        requestAnimationFrame(() => {
            toggleBtnRef.current?.focus();
        });
    }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  
    const toggleMenu = useCallback(() => {
        const target = !openRef.current;

        openRef.current = target;
        setOpen(target);

        if (target) {
            onMenuOpen?.();
            playOpen();
        } else {
            onMenuClose?.();
            playClose();
        }

        animateIcon(target);
        animateColor(target);
        animateText(target);
    }, [
        playOpen,
        playClose,
        animateIcon,
        animateColor,
        animateText,
        onMenuOpen,
        onMenuClose,
    ]);

  
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (!closeOnClickAway) {
                return;
            }

            const target = event.target as Node;

            if (
                panelRef.current &&
                !panelRef.current.contains(target) &&
                toggleBtnRef.current &&
                !toggleBtnRef.current.contains(target)
            ) {
                closeMenu();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, closeOnClickAway, closeMenu]);

  
    useEffect(() => {
        return () => {
            openTlRef.current?.kill();
            closeTweenRef.current?.kill();
            spinTweenRef.current?.kill();
            textCycleAnimRef.current?.kill();
            colorTweenRef.current?.kill();
        };
    }, []);

    return (
        <div
            className={[
                className,
                "staggered-menu-wrapper",
                isFixed ? "fixed-wrapper" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            style={
                accentColor
                    ? ({
                          "--sm-accent": accentColor,
                      } as React.CSSProperties)
                    : undefined
            }
            data-position={position}
            data-open={open || undefined}
        >
            <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
                {(colors?.length ? colors.slice(0, 4) : ["#1e1e22", "#35353c"])
                    .filter((_, index, array) => {
                        if (array.length < 3) {
                            return true;
                        }

                        return index !== Math.floor(array.length / 2);
                    })
                    .map((color, index) => (
                        <div
                            key={`${color}-${index}`}
                            className="sm-prelayer"
                            style={{ background: color }}
                        />
                    ))}
            </div>

            <header
                className="staggered-menu-header"
                aria-label="Main navigation header"
            >
                <div className="sm-logo">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Site logo"
                            className="sm-logo-img"
                            draggable={false}
                        />
                    ) : (
                        <a
                            href="/"
                            className="text-2xl font-bold text-white no-underline"
                            style={{ color: "inherit" }}
                        >
                            Clear Debt
                        </a>
                    )}
                </div>

                <button
                    ref={toggleBtnRef}
                    className="sm-toggle"
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    aria-controls="staggered-menu-panel"
                    onClick={toggleMenu}
                    type="button"
                >
                    <span className="sm-toggle-textWrap" aria-hidden="true">
                        <span
                            ref={textInnerRef}
                            className="sm-toggle-textInner"
                        >
                            {textLines.map((line, index) => (
                                <span
                                    className="sm-toggle-line"
                                    key={`${line}-${index}`}
                                >
                                    {line}
                                </span>
                            ))}
                        </span>
                    </span>

                    <span ref={iconRef} className="sm-icon" aria-hidden="true">
                        <span ref={plusHRef} className="sm-icon-line" />

                        <span
                            ref={plusVRef}
                            className="sm-icon-line sm-icon-line-v"
                        />
                    </span>
                </button>
            </header>

            <nav
                id="staggered-menu-panel"
                ref={panelRef}
                className="staggered-menu-panel"
                aria-label="Main navigation"
                aria-hidden={!open}
            >
                <div className="sm-panel-inner">
                    <ul
                        className="sm-panel-list"
                        role="list"
                        data-numbering={displayItemNumbering || undefined}
                    >
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <li
                                    className="sm-panel-itemWrap"
                                    key={`${item.label}-${index}`}
                                >
                                    <a
                                        className="sm-panel-item"
                                        href={item.link}
                                        aria-label={item.ariaLabel}
                                        tabIndex={open ? 0 : -1}
                                        data-index={index + 1}
                                        onClick={closeMenu}
                                    >
                                        <span className="sm-panel-itemLabel">
                                            {item.label}
                                        </span>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <li
                                className="sm-panel-itemWrap"
                                aria-hidden="true"
                            >
                                <span className="sm-panel-item">
                                    <span className="sm-panel-itemLabel">
                                        No items
                                    </span>
                                </span>
                            </li>
                        )}
                    </ul>

                    {displaySocials && socialItems.length > 0 && (
                        <div className="sm-socials" aria-label="Social links">
                            <h3 className="sm-socials-title">Socials</h3>

                            <ul className="sm-socials-list" role="list">
                                {socialItems.map((social, index) => (
                                    <li
                                        key={`${social.label}-${index}`}
                                        className="sm-socials-item"
                                    >
                                        <a
                                            href={social.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="sm-socials-link"
                                            tabIndex={open ? 0 : -1}
                                            onClick={closeMenu}
                                        >
                                            {social.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default StaggeredMenu;
